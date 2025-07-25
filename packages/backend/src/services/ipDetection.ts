import { ConnectionAnalysis, IPAddress, IPAnalysis, NetworkConnection } from '@/types/ip';
import { logger } from '@/utils/logger';
import { Request } from 'express';
import ip from 'ip';
import { isIP } from 'net';

export class IPDetectionService {
  /**
   * Extract all possible IP addresses from request headers and connection
   */
  static extractAllIPs(req: Request): IPAddress[] {
    const detectedIPs: IPAddress[] = [];

    // 1. Socket/Connection IP (most direct)
    const socketIP = this.extractSocketIP(req);
    if (socketIP) {
      detectedIPs.push(socketIP);
    }

    // 2. X-Forwarded-For header (most common proxy header)
    const forwardedIPs = this.extractForwardedForIPs(req);
    detectedIPs.push(...forwardedIPs);

    // 3. X-Real-IP header (nginx, apache)
    const realIP = this.extractRealIP(req);
    if (realIP) {
      detectedIPs.push(realIP);
    }

    // 4. CF-Connecting-IP (Cloudflare)
    const cfIP = this.extractCloudflareIP(req);
    if (cfIP) {
      detectedIPs.push(cfIP);
    }

    // 5. X-Cluster-Client-IP (cluster environments)
    const clusterIP = this.extractClusterIP(req);
    if (clusterIP) {
      detectedIPs.push(clusterIP);
    }

    // 6. Forwarded header (RFC 7239)
    const forwardedRFC = this.extractForwardedRFC(req);
    detectedIPs.push(...forwardedRFC);

    // Remove duplicates and invalid IPs
    return this.deduplicateIPs(detectedIPs);
  }

  /**
   * Determine the most likely real client IP
   */
  static determinePrimaryIP(ips: IPAddress[]): IPAddress | null {
    if (ips.length === 0) return null;
    if (ips.length === 1) return ips[0] || null;

    // Sort by confidence score (highest first)
    const sortedIPs = [...ips].sort((a, b) => b.confidence - a.confidence);

    // Prefer public IPs over private ones
    const publicIPs = sortedIPs.filter(ip => ip.type === 'public');
    if (publicIPs.length > 0) {
      return publicIPs[0] || null;
    }

    // If no public IPs, return the highest confidence IP
    return sortedIPs[0] || null;
  }

  /**
   * Analyze connection properties
   */
  static analyzeConnectionProperties(req: Request): NetworkConnection {
    const protocol = req.secure ? 'HTTPS' : 'HTTP';
    const port = req.socket.localPort || (req.secure ? 443 : 80);

    return {
      protocol,
      port,
      encrypted: req.secure,
      userAgent: req.get('User-Agent') || undefined,
      acceptLanguage: req.get('Accept-Language') || undefined,
      acceptEncoding: req.get('Accept-Encoding') || undefined,
      dnt: req.get('DNT') === '1',
      headers: this.sanitizeHeaders(req.headers)
    };
  }

  /**
   * Perform complete connection analysis
   */
  static async analyzeConnection(req: Request): Promise<ConnectionAnalysis> {
    const requestId = (req.headers['x-request-id'] as string) || 'unknown';

    try {
      // Extract all IPs
      const allIPs = this.extractAllIPs(req);

      // Determine primary IP
      const primaryIP = this.determinePrimaryIP(allIPs);

      if (!primaryIP) {
        throw new Error('No valid IP address detected');
      }

      // Create IP analysis
      const ipAnalysis: IPAnalysis = {
        primaryIP,
        allDetectedIPs: allIPs
      };

      // Analyze connection
      const connection = this.analyzeConnectionProperties(req);

      // Create connection analysis
      const analysis: ConnectionAnalysis = {
        ip: ipAnalysis,
        connection,
        timestamp: new Date().toISOString(),
        requestId
      };

      logger.info('IP analysis completed', {
        requestId,
        primaryIP: primaryIP.address,
        totalIPs: allIPs.length,
        protocol: connection.protocol
      });

      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('IP analysis failed', { requestId, error: errorMessage });
      throw error;
    }
  }

  // Private helper methods

  private static extractSocketIP(req: Request): IPAddress | null {
    const socketIP = req.socket.remoteAddress || req.ip;
    if (!socketIP || !isIP(socketIP)) return null;

    return {
      address: this.normalizeIP(socketIP),
      version: isIP(socketIP) as 4 | 6,
      type: this.classifyIPType(socketIP),
      source: 'socket',
      confidence: 70 // Medium confidence as it could be a proxy
    };
  }

  private static extractForwardedForIPs(req: Request): IPAddress[] {
    const forwardedFor = req.get('X-Forwarded-For');
    if (!forwardedFor) return [];

    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const result: IPAddress[] = [];

    ips.forEach((ipStr, index) => {
      if (isIP(ipStr)) {
        result.push({
          address: this.normalizeIP(ipStr),
          version: isIP(ipStr) as 4 | 6,
          type: this.classifyIPType(ipStr),
          source: 'x-forwarded-for',
          confidence: index === 0 ? 90 : Math.max(50 - index * 10, 10) // First IP has highest confidence
        });
      }
    });

    return result;
  }

  private static extractRealIP(req: Request): IPAddress | null {
    const realIP = req.get('X-Real-IP');
    if (!realIP || !isIP(realIP)) return null;

    return {
      address: this.normalizeIP(realIP),
      version: isIP(realIP) as 4 | 6,
      type: this.classifyIPType(realIP),
      source: 'x-real-ip',
      confidence: 85
    };
  }

  private static extractCloudflareIP(req: Request): IPAddress | null {
    const cfIP = req.get('CF-Connecting-IP');
    if (!cfIP || !isIP(cfIP)) return null;

    return {
      address: this.normalizeIP(cfIP),
      version: isIP(cfIP) as 4 | 6,
      type: this.classifyIPType(cfIP),
      source: 'cf-connecting-ip',
      confidence: 95 // Cloudflare is very reliable
    };
  }

  private static extractClusterIP(req: Request): IPAddress | null {
    const clusterIP = req.get('X-Cluster-Client-IP');
    if (!clusterIP || !isIP(clusterIP)) return null;

    return {
      address: this.normalizeIP(clusterIP),
      version: isIP(clusterIP) as 4 | 6,
      type: this.classifyIPType(clusterIP),
      source: 'x-cluster-client-ip',
      confidence: 80
    };
  }

  private static extractForwardedRFC(req: Request): IPAddress[] {
    const forwarded = req.get('Forwarded');
    if (!forwarded) return [];

    const result: IPAddress[] = [];

    // Parse RFC 7239 Forwarded header: for=192.0.2.60;proto=http;by=203.0.113.43
    const forwardedEntries = forwarded.split(',');

    forwardedEntries.forEach(entry => {
      const forMatch = entry.match(/for=([^;,\s]+)/);
      if (forMatch && forMatch[1]) {
        let ipStr = forMatch[1];

        // Remove quotes and brackets
        ipStr = ipStr.replace(/["\[\]]/g, '');

        // Handle IPv6 with port (e.g., [::1]:8080)
        const ipv6Match = ipStr.match(/^(.+):(\d+)$/);
        if (ipv6Match && ipv6Match[1] && isIP(ipv6Match[1])) {
          ipStr = ipv6Match[1];
        }

        if (isIP(ipStr)) {
          result.push({
            address: this.normalizeIP(ipStr),
            version: isIP(ipStr) as 4 | 6,
            type: this.classifyIPType(ipStr),
            source: 'forwarded',
            confidence: 75
          });
        }
      }
    });

    return result;
  }

  private static normalizeIP(ipStr: string): string {
    // Remove IPv6 brackets and normalize
    return ipStr.replace(/^\[|\]$/g, '');
  }

  private static classifyIPType(ipStr: string): IPAddress['type'] {
    if (ip.isPrivate(ipStr)) return 'private';
    if (ip.isLoopback(ipStr)) return 'loopback';

    // Check for reserved ranges
    if (this.isReservedIP(ipStr)) return 'reserved';
    if (this.isMulticastIP(ipStr)) return 'multicast';
    if (this.isBroadcastIP(ipStr)) return 'broadcast';

    return 'public';
  }

  private static isReservedIP(ipStr: string): boolean {
    // Common reserved IP ranges
    const reservedRanges = [
      '0.0.0.0/8', // "This" network
      '169.254.0.0/16', // Link-local
      '224.0.0.0/4', // Multicast
      '240.0.0.0/4', // Reserved for future use
      '255.255.255.255/32' // Broadcast
    ];

    return reservedRanges.some(range => {
      try {
        return ip.cidrSubnet(range).contains(ipStr);
      } catch {
        return false;
      }
    });
  }

  private static isMulticastIP(ipStr: string): boolean {
    try {
      return ip.cidrSubnet('224.0.0.0/4').contains(ipStr);
    } catch {
      return false;
    }
  }

  private static isBroadcastIP(ipStr: string): boolean {
    return ipStr === '255.255.255.255';
  }

  private static deduplicateIPs(ips: IPAddress[]): IPAddress[] {
    const seen = new Set<string>();
    return ips.filter(ipObj => {
      if (seen.has(ipObj.address)) {
        return false;
      }
      seen.add(ipObj.address);
      return true;
    });
  }

  private static sanitizeHeaders(headers: any): Record<string, string> {
    const sanitized: Record<string, string> = {};

    // Only include safe headers
    const safeHeaders = [
      'user-agent',
      'accept',
      'accept-language',
      'accept-encoding',
      'cache-control',
      'connection',
      'dnt',
      'upgrade-insecure-requests'
    ];

    safeHeaders.forEach(header => {
      if (headers[header]) {
        sanitized[header] = String(headers[header]);
      }
    });

    return sanitized;
  }
}
