import { logger } from '@/utils/logger';
import ip from 'ip';
import { isIP } from 'net';
import { GeolocationService } from './geolocationService';
import { IPClassificationService } from './ipClassification';

export interface NetworkAnalysisResult {
  ipAddress: string;
  version: 4 | 6;
  classification: {
    type: 'public' | 'private' | 'reserved' | 'loopback' | 'multicast' | 'broadcast';
    isRoutable: boolean;
    isGlobalUnicast: boolean;
  };
  geolocation?: {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    latitude: number;
    longitude: number;
    timezone: string;
    accuracy: number;
  };
  network?: {
    isp: string;
    organization: string;
    asn: number;
    asnOrganization: string;
    connectionType: 'residential' | 'business' | 'mobile' | 'hosting' | 'unknown';
  };
  security?: {
    isProxy: boolean;
    isVPN: boolean;
    isTor: boolean;
    isThreat: boolean;
    threatTypes: string[];
    riskScore: number;
    reputation: 'good' | 'neutral' | 'suspicious' | 'malicious';
  };
  technical: {
    subnet: string;
    cidr: string;
    reverseDNS?: string;
    mtu?: number;
    hopCount?: number;
  };
  performance?: {
    estimatedLatency: number;
    qualityScore: number;
    reliability: 'excellent' | 'good' | 'fair' | 'poor';
  };
  metadata: {
    analysisTime: number;
    dataSource: 'local' | 'cached' | 'external';
    confidence: number;
    lastUpdated: string;
  };
}

export class NetworkAnalysisService {
  /**
   * Perform comprehensive network analysis on an IP address
   */
  static async analyzeNetwork(ipAddress: string): Promise<NetworkAnalysisResult> {
    const startTime = Date.now();

    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      logger.info('Starting network analysis', { ipAddress });

      // Basic IP classification
      const version = isIP(ipAddress) as 4 | 6;
      const type = IPClassificationService.classifyIP(ipAddress);
      const ipDetails = IPClassificationService.getIPDetails(ipAddress);

      // Classification analysis
      const classification = {
        type,
        isRoutable: this.isRoutableIP(ipAddress, type),
        isGlobalUnicast: this.isGlobalUnicast(ipAddress, type)
      };

      // Get comprehensive geolocation and network info
      const { geolocation, network, security } = await GeolocationService.getComprehensiveAnalysis(ipAddress);

      // Technical analysis
      const reverseDNS = await this.getReverseDNS(ipAddress);
      const technical = {
        subnet: ipDetails.subnet || 'Unknown',
        cidr: ipDetails.cidr || 'Unknown',
        ...(reverseDNS && { reverseDNS }),
        mtu: this.estimateMTU(ipAddress),
        hopCount: this.estimateHopCount(ipAddress)
      };

      // Performance analysis
      const performance = await this.analyzePerformance(ipAddress);

      // Calculate analysis metadata
      const analysisTime = Date.now() - startTime;
      const confidence = this.calculateConfidence(geolocation, network, security);

      const result: NetworkAnalysisResult = {
        ipAddress,
        version,
        classification,
        ...(geolocation && { geolocation }),
        ...(network && { network }),
        ...(security && { security }),
        technical,
        performance,
        metadata: {
          analysisTime,
          dataSource: 'local',
          confidence,
          lastUpdated: new Date().toISOString()
        }
      };

      logger.info('Network analysis completed', {
        ipAddress,
        analysisTime,
        confidence,
        hasGeolocation: !!geolocation,
        hasNetwork: !!network,
        hasSecurity: !!security
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Network analysis failed', { ipAddress, error: errorMessage });
      throw error;
    }
  }

  /**
   * Analyze multiple IP addresses in batch
   */
  static async analyzeBatch(ipAddresses: string[]): Promise<NetworkAnalysisResult[]> {
    const results: NetworkAnalysisResult[] = [];

    for (const ipAddress of ipAddresses) {
      try {
        const result = await this.analyzeNetwork(ipAddress);
        results.push(result);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        logger.warn('Batch analysis failed for IP', { ipAddress, error: errorMessage });

        // Add error result
        results.push(this.createErrorResult(ipAddress, errorMessage));
      }
    }

    return results;
  }

  /**
   * Compare two IP addresses
   */
  static async compareIPs(
    ip1: string,
    ip2: string
  ): Promise<{
    ip1: NetworkAnalysisResult;
    ip2: NetworkAnalysisResult;
    comparison: {
      sameCountry: boolean;
      sameISP: boolean;
      sameASN: boolean;
      distanceKm?: number;
      securityDifference: number;
      performanceDifference?: number;
    };
  }> {
    const [result1, result2] = await Promise.all([this.analyzeNetwork(ip1), this.analyzeNetwork(ip2)]);

    const distanceKm = this.calculateDistance(result1.geolocation, result2.geolocation);
    const performanceDifference =
      result1.performance && result2.performance
        ? Math.abs(result1.performance.qualityScore - result2.performance.qualityScore)
        : undefined;

    const comparison = {
      sameCountry: result1.geolocation?.countryCode === result2.geolocation?.countryCode,
      sameISP: result1.network?.isp === result2.network?.isp,
      sameASN: result1.network?.asn === result2.network?.asn,
      ...(distanceKm !== undefined && { distanceKm }),
      securityDifference: Math.abs((result1.security?.riskScore || 0) - (result2.security?.riskScore || 0)),
      ...(performanceDifference !== undefined && { performanceDifference })
    };

    return { ip1: result1, ip2: result2, comparison };
  }

  // Private helper methods

  private static isRoutableIP(_ipAddress: string, type: string): boolean {
    // Private, loopback, and reserved IPs are not routable on the internet
    return type === 'public';
  }

  private static isGlobalUnicast(_ipAddress: string, type: string): boolean {
    // Only public IPs are globally unique
    return type === 'public';
  }

  private static async getReverseDNS(_ipAddress: string): Promise<string | undefined> {
    // Simplified reverse DNS lookup
    // In production, you'd use dns.reverse() or similar
    try {
      // This is a placeholder - actual implementation would use DNS lookup
      return undefined;
    } catch {
      return undefined;
    }
  }

  private static estimateMTU(ipAddress: string): number {
    // Estimate MTU based on network type
    const version = isIP(ipAddress);

    if (version === 6) {
      return 1280; // IPv6 minimum MTU
    }

    // IPv4 estimates
    if (ip.isPrivate(ipAddress)) {
      return 1500; // Ethernet MTU for local networks
    }

    return 1460; // Conservative estimate for internet traffic
  }

  private static estimateHopCount(ipAddress: string): number {
    // Estimate hop count based on IP characteristics
    if (ip.isPrivate(ipAddress) || ip.isLoopback(ipAddress)) {
      return 1;
    }

    // Estimate based on first octet for IPv4
    const version = isIP(ipAddress);
    if (version === 4) {
      const firstOctet = parseInt(ipAddress.split('.')[0] || '0', 10);

      // Very rough estimates
      if (firstOctet >= 1 && firstOctet <= 126) return 12; // Class A
      if (firstOctet >= 128 && firstOctet <= 191) return 10; // Class B
      if (firstOctet >= 192 && firstOctet <= 223) return 8; // Class C
    }

    return 15; // Default estimate
  }

  private static async analyzePerformance(ipAddress: string): Promise<{
    estimatedLatency: number;
    qualityScore: number;
    reliability: 'excellent' | 'good' | 'fair' | 'poor';
  }> {
    // Estimate performance based on IP characteristics
    let estimatedLatency = 50; // Base latency in ms
    let qualityScore = 70; // Base quality score

    if (ip.isPrivate(ipAddress) || ip.isLoopback(ipAddress)) {
      estimatedLatency = 1;
      qualityScore = 95;
    } else {
      // Estimate based on geolocation if available
      const { geolocation } = await GeolocationService.getComprehensiveAnalysis(ipAddress);

      if (geolocation) {
        // Rough latency estimates based on distance/region
        switch (geolocation.countryCode) {
          case 'US':
          case 'CA':
            estimatedLatency = 20;
            qualityScore = 85;
            break;
          case 'GB':
          case 'DE':
          case 'FR':
            estimatedLatency = 30;
            qualityScore = 80;
            break;
          case 'JP':
          case 'SG':
          case 'AU':
            estimatedLatency = 150;
            qualityScore = 70;
            break;
          default:
            estimatedLatency = 100;
            qualityScore = 60;
        }
      }
    }

    const reliability = this.determineReliability(qualityScore);

    return { estimatedLatency, qualityScore, reliability };
  }

  private static determineReliability(qualityScore: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (qualityScore >= 90) return 'excellent';
    if (qualityScore >= 75) return 'good';
    if (qualityScore >= 50) return 'fair';
    return 'poor';
  }

  private static calculateConfidence(geolocation: any, network: any, security: any): number {
    let confidence = 50; // Base confidence

    if (geolocation) {
      confidence += 20;
      if (geolocation.accuracy > 70) confidence += 10;
    }

    if (network) {
      confidence += 15;
      if (network.asn > 0) confidence += 5;
    }

    if (security) {
      confidence += 10;
    }

    return Math.min(confidence, 100);
  }

  private static calculateDistance(geo1: any, geo2: any): number | undefined {
    if (!geo1 || !geo2 || !geo1.latitude || !geo1.longitude || !geo2.latitude || !geo2.longitude) {
      return undefined;
    }

    // Haversine formula for distance calculation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRadians(geo2.latitude - geo1.latitude);
    const dLon = this.toRadians(geo2.longitude - geo1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(geo1.latitude)) *
        Math.cos(this.toRadians(geo2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c);
  }

  private static toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private static createErrorResult(ipAddress: string, _error: string): NetworkAnalysisResult {
    return {
      ipAddress,
      version: isIP(ipAddress) as 4 | 6,
      classification: {
        type: 'reserved',
        isRoutable: false,
        isGlobalUnicast: false
      },
      technical: {
        subnet: 'Unknown',
        cidr: 'Unknown'
      },
      metadata: {
        analysisTime: 0,
        dataSource: 'local',
        confidence: 0,
        lastUpdated: new Date().toISOString()
      }
    };
  }
}
