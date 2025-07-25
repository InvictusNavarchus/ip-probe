import { logger } from '@/utils/logger';
import { promises as dns } from 'dns';
import { isIP } from 'net';

export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'PTR' | 'SOA';
  value: string;
  ttl?: number;
}

export interface DNSAnalysis {
  ipAddress: string;
  reverseDNS?: {
    hostname?: string;
    verified: boolean;
    forwardMatch: boolean;
  };
  dnsRecords: DNSRecord[];
  dnsServers?: string[];
  responseTime: number;
  dnssecEnabled?: boolean;
  dnsLeaks: {
    detected: boolean;
    leakedServers: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  reputation: {
    isMalicious: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    isSpam: boolean;
    riskScore: number;
  };
  analysisTimestamp: string;
}

export class DNSAnalysisService {
  // Common malicious domains patterns (simplified for demo)
  private static readonly MALICIOUS_PATTERNS = [
    /\.tk$/i,
    /\.ml$/i,
    /\.ga$/i,
    /\.cf$/i,
    /[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}-[0-9]{1,3}/,
    /bit\.ly|tinyurl|t\.co/i,
    /temp-mail|10minutemail|guerrillamail/i
  ];

  // Known good DNS servers
  private static readonly TRUSTED_DNS_SERVERS = [
    '8.8.8.8',
    '8.8.4.4', // Google
    '1.1.1.1',
    '1.0.0.1', // Cloudflare
    '208.67.222.222',
    '208.67.220.220', // OpenDNS
    '9.9.9.9',
    '149.112.112.112' // Quad9
  ];

  /**
   * Perform comprehensive DNS analysis
   */
  static async analyzeDNS(ipAddress: string): Promise<DNSAnalysis> {
    const startTime = Date.now();

    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      logger.info('Starting DNS analysis', { ipAddress });

      // Perform reverse DNS lookup
      const reverseDNS = await this.performReverseDNS(ipAddress);

      // Get DNS records if we have a hostname
      const dnsRecords = reverseDNS.hostname ? await this.getDNSRecords(reverseDNS.hostname) : [];

      // Analyze DNS servers (simplified - would need more complex detection)
      const dnsServers = await this.detectDNSServers();

      // Check for DNS leaks
      const dnsLeaks = await this.checkDNSLeaks(ipAddress, dnsServers);

      // Analyze reputation
      const reputation = await this.analyzeReputation(reverseDNS.hostname, ipAddress);

      const responseTime = Date.now() - startTime;

      const analysis: DNSAnalysis = {
        ipAddress,
        reverseDNS,
        dnsRecords,
        dnsServers,
        responseTime,
        dnsLeaks,
        reputation,
        analysisTimestamp: new Date().toISOString()
      };

      logger.info('DNS analysis completed', {
        ipAddress,
        hostname: reverseDNS.hostname,
        responseTime,
        riskScore: reputation.riskScore,
        dnsLeaksDetected: dnsLeaks.detected
      });

      return analysis;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('DNS analysis failed', { ipAddress, error: errorMessage });
      throw error;
    }
  }

  /**
   * Perform reverse DNS lookup
   */
  private static async performReverseDNS(ipAddress: string): Promise<{
    hostname?: string;
    verified: boolean;
    forwardMatch: boolean;
  }> {
    try {
      // Reverse DNS lookup
      const hostnames = await dns.reverse(ipAddress);
      const hostname = hostnames[0];

      if (!hostname) {
        return { verified: false, forwardMatch: false };
      }

      // Verify forward lookup matches
      let forwardMatch = false;
      try {
        const version = isIP(ipAddress);
        const forwardIPs = version === 4 ? await dns.resolve4(hostname) : await dns.resolve6(hostname);

        forwardMatch = forwardIPs.includes(ipAddress);
      } catch {
        // Forward lookup failed
      }

      return {
        hostname,
        verified: true,
        forwardMatch
      };
    } catch {
      return { verified: false, forwardMatch: false };
    }
  }

  /**
   * Get DNS records for a hostname
   */
  private static async getDNSRecords(hostname: string): Promise<DNSRecord[]> {
    const records: DNSRecord[] = [];

    try {
      // A records
      try {
        const aRecords = await dns.resolve4(hostname, { ttl: true });
        aRecords.forEach(record => {
          const recordData: DNSRecord = {
            type: 'A',
            value: typeof record === 'string' ? record : record.address
          };
          if (typeof record === 'object' && record.ttl !== undefined) {
            recordData.ttl = record.ttl;
          }
          records.push(recordData);
        });
      } catch {}

      // AAAA records
      try {
        const aaaaRecords = await dns.resolve6(hostname, { ttl: true });
        aaaaRecords.forEach(record => {
          const recordData: DNSRecord = {
            type: 'AAAA',
            value: typeof record === 'string' ? record : record.address
          };
          if (typeof record === 'object' && record.ttl !== undefined) {
            recordData.ttl = record.ttl;
          }
          records.push(recordData);
        });
      } catch {}

      // MX records
      try {
        const mxRecords = await dns.resolveMx(hostname);
        mxRecords.forEach(record => {
          records.push({
            type: 'MX',
            value: `${record.priority} ${record.exchange}`
          });
        });
      } catch {}

      // TXT records
      try {
        const txtRecords = await dns.resolveTxt(hostname);
        txtRecords.forEach(record => {
          records.push({
            type: 'TXT',
            value: Array.isArray(record) ? record.join('') : record
          });
        });
      } catch {}

      // NS records
      try {
        const nsRecords = await dns.resolveNs(hostname);
        nsRecords.forEach(record => {
          records.push({
            type: 'NS',
            value: record
          });
        });
      } catch {}

      // CNAME records
      try {
        const cnameRecords = await dns.resolveCname(hostname);
        cnameRecords.forEach(record => {
          records.push({
            type: 'CNAME',
            value: record
          });
        });
      } catch {}
    } catch (error) {
      logger.warn('Failed to get some DNS records', { hostname, error });
    }

    return records;
  }

  /**
   * Detect DNS servers being used (simplified implementation)
   */
  private static async detectDNSServers(): Promise<string[]> {
    // In a real implementation, this would detect the actual DNS servers
    // being used by the client. For now, return common ones.
    return ['8.8.8.8', '1.1.1.1'];
  }

  /**
   * Check for DNS leaks
   */
  private static async checkDNSLeaks(
    ipAddress: string,
    dnsServers: string[]
  ): Promise<{
    detected: boolean;
    leakedServers: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    const leakedServers: string[] = [];

    // Check if DNS servers are from different geographic regions than the IP
    // This is a simplified implementation
    for (const server of dnsServers) {
      if (!this.TRUSTED_DNS_SERVERS.includes(server)) {
        // Check if server is in a different region (simplified)
        const serverRegion = await this.getIPRegion(server);
        const ipRegion = await this.getIPRegion(ipAddress);

        if (serverRegion !== ipRegion && serverRegion !== 'unknown' && ipRegion !== 'unknown') {
          leakedServers.push(server);
        }
      }
    }

    const detected = leakedServers.length > 0;
    const riskLevel = leakedServers.length > 2 ? 'high' : leakedServers.length > 0 ? 'medium' : 'low';

    return { detected, leakedServers, riskLevel };
  }

  /**
   * Get IP region (simplified)
   */
  private static async getIPRegion(ipAddress: string): Promise<string> {
    // This would use the geolocation service in a real implementation
    // For now, return a simplified region based on IP ranges
    const firstOctet = parseInt(ipAddress.split('.')[0] || '0', 10);

    if (firstOctet >= 1 && firstOctet <= 126) return 'americas';
    if (firstOctet >= 128 && firstOctet <= 191) return 'americas';
    if (firstOctet >= 192 && firstOctet <= 223) return 'global';

    return 'unknown';
  }

  /**
   * Analyze reputation of hostname/IP
   */
  private static async analyzeReputation(
    hostname?: string,
    ipAddress?: string
  ): Promise<{
    isMalicious: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    isSpam: boolean;
    riskScore: number;
  }> {
    let riskScore = 0;
    let isMalicious = false;
    let isPhishing = false;
    let isMalware = false;
    let isSpam = false;

    // Check hostname against malicious patterns
    if (hostname) {
      for (const pattern of this.MALICIOUS_PATTERNS) {
        if (pattern.test(hostname)) {
          riskScore += 30;
          isMalicious = true;
          break;
        }
      }

      // Check for suspicious patterns
      if (hostname.includes('phishing') || hostname.includes('scam')) {
        isPhishing = true;
        riskScore += 40;
      }

      if (hostname.includes('malware') || hostname.includes('virus')) {
        isMalware = true;
        riskScore += 50;
      }

      if (hostname.includes('spam') || hostname.includes('bulk')) {
        isSpam = true;
        riskScore += 20;
      }

      // Check for suspicious TLDs
      const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.pw'];
      if (suspiciousTlds.some(tld => hostname.endsWith(tld))) {
        riskScore += 25;
        isMalicious = true;
      }

      // Check for domain generation algorithm patterns
      if (this.isDGA(hostname)) {
        riskScore += 35;
        isMalicious = true;
      }
    }

    // Check IP-based reputation (simplified)
    if (ipAddress) {
      // Check for known bad IP ranges (simplified)
      const firstOctet = parseInt(ipAddress.split('.')[0] || '0', 10);

      // Some ranges are more commonly associated with malicious activity
      if (firstOctet === 0 || firstOctet >= 224) {
        riskScore += 15;
      }
    }

    return {
      isMalicious,
      isPhishing,
      isMalware,
      isSpam,
      riskScore: Math.min(riskScore, 100)
    };
  }

  /**
   * Check if hostname matches Domain Generation Algorithm patterns
   */
  private static isDGA(hostname: string): boolean {
    const domain = hostname.split('.')[0];

    if (!domain) return false;

    // Check for random-looking strings
    const vowels = (domain.match(/[aeiou]/gi) || []).length;
    const vowelRatio = vowels / domain.length;

    // DGA domains often have unusual vowel/consonant ratios
    if (vowelRatio < 0.1 || vowelRatio > 0.8) return true;

    // Check for excessive consonant clusters
    const consonantClusters = (domain.match(/[bcdfghjklmnpqrstvwxyz]{4,}/gi) || []).length;
    if (consonantClusters > 0) return true;

    // Check for numeric patterns common in DGA
    const numericRatio = (domain.match(/[0-9]/g) || []).length / domain.length;
    if (numericRatio > 0.3) return true;

    return false;
  }

  /**
   * Batch DNS analysis for multiple IPs
   */
  static async analyzeBatch(ipAddresses: string[]): Promise<DNSAnalysis[]> {
    const results: DNSAnalysis[] = [];

    for (const ipAddress of ipAddresses) {
      try {
        const analysis = await this.analyzeDNS(ipAddress);
        results.push(analysis);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Batch DNS analysis failed for IP', { ipAddress, error: errorMessage });

        // Add error result
        results.push({
          ipAddress,
          dnsRecords: [],
          responseTime: 0,
          dnsLeaks: { detected: false, leakedServers: [], riskLevel: 'low' },
          reputation: { isMalicious: false, isPhishing: false, isMalware: false, isSpam: false, riskScore: 0 },
          analysisTimestamp: new Date().toISOString()
        });
      }
    }

    return results;
  }
}
