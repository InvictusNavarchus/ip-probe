import { COUNTRY_INFO, GEOIP_RANGES, GeoIPRange } from '@/data/geoipDatabase';
import { GeoLocation, NetworkInfo, SecurityInfo } from '@/types/ip';
import { logger } from '@/utils/logger';
import { isIP } from 'net';

export class GeolocationService {
  /**
   * Get geolocation information for an IP address
   */
  static async getGeolocation(ipAddress: string): Promise<GeoLocation | null> {
    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      const geoData = this.findGeoIPRange(ipAddress);

      if (!geoData) {
        // Return default location for unknown IPs
        return this.getDefaultLocation(ipAddress);
      }

      return {
        country: geoData.country,
        countryCode: geoData.countryCode,
        region: geoData.region || 'Unknown',
        city: geoData.city || 'Unknown',
        latitude: geoData.latitude || 0,
        longitude: geoData.longitude || 0,
        timezone: geoData.timezone || 'UTC',
        accuracy: this.calculateAccuracy(geoData)
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Geolocation lookup failed', { ipAddress, error: errorMessage });
      return null;
    }
  }

  /**
   * Get network information for an IP address
   */
  static async getNetworkInfo(ipAddress: string): Promise<NetworkInfo | null> {
    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      const geoData = this.findGeoIPRange(ipAddress);

      if (!geoData) {
        return this.getDefaultNetworkInfo(ipAddress);
      }

      return {
        isp: geoData.isp || 'Unknown ISP',
        organization: geoData.organization || 'Unknown Organization',
        asn: geoData.asn || 0,
        asnOrganization: geoData.asnOrganization || 'Unknown',
        connectionType: geoData.connectionType || 'unknown'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Network info lookup failed', { ipAddress, error: errorMessage });
      return null;
    }
  }

  /**
   * Get security information for an IP address
   */
  static async getSecurityInfo(ipAddress: string): Promise<SecurityInfo | null> {
    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      // Basic security analysis based on IP characteristics
      const securityInfo: SecurityInfo = {
        isProxy: this.isKnownProxy(ipAddress),
        isVPN: this.isKnownVPN(ipAddress),
        isTor: this.isKnownTor(ipAddress),
        isThreat: false,
        threatTypes: [],
        riskScore: 0,
        reputation: 'neutral'
      };

      // Calculate risk score
      securityInfo.riskScore = this.calculateRiskScore(ipAddress, securityInfo);

      // Determine reputation
      securityInfo.reputation = this.determineReputation(securityInfo.riskScore);

      // Check for threats
      const threats = this.checkForThreats(ipAddress);
      securityInfo.isThreat = threats.length > 0;
      securityInfo.threatTypes = threats;

      return securityInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Security info lookup failed', { ipAddress, error: errorMessage });
      return null;
    }
  }

  /**
   * Get comprehensive location and network analysis
   */
  static async getComprehensiveAnalysis(ipAddress: string): Promise<{
    geolocation: GeoLocation | null;
    network: NetworkInfo | null;
    security: SecurityInfo | null;
  }> {
    const [geolocation, network, security] = await Promise.all([
      this.getGeolocation(ipAddress),
      this.getNetworkInfo(ipAddress),
      this.getSecurityInfo(ipAddress)
    ]);

    return { geolocation, network, security };
  }

  // Private helper methods

  private static findGeoIPRange(ipAddress: string): GeoIPRange | null {
    // Convert IP to decimal for range comparison
    const ipDecimal = this.ipToDecimal(ipAddress);

    for (const range of GEOIP_RANGES) {
      const startDecimal = this.ipToDecimal(range.startIP);
      const endDecimal = this.ipToDecimal(range.endIP);

      if (ipDecimal >= startDecimal && ipDecimal <= endDecimal) {
        return range;
      }
    }

    // Try CIDR-based matching for broader ranges
    return this.findByCIDRMatch(ipAddress);
  }

  private static findByCIDRMatch(ipAddress: string): GeoIPRange | null {
    // Check if IP falls within any of the broader ranges
    const version = isIP(ipAddress);

    if (version === 4) {
      // Check common regional allocations
      const firstOctet = parseInt(ipAddress.split('.')[0] || '0', 10);

      // North America (ARIN) - simplified
      if ((firstOctet >= 3 && firstOctet <= 126) || (firstOctet >= 128 && firstOctet <= 191)) {
        return this.createRegionalRange('US', 'North America');
      }

      // Europe (RIPE NCC) - simplified
      if (firstOctet >= 80 && firstOctet <= 95) {
        return this.createRegionalRange('DE', 'Europe');
      }

      // Asia Pacific (APNIC) - simplified
      if (firstOctet >= 1 && firstOctet <= 2) {
        return this.createRegionalRange('SG', 'Asia');
      }
    }

    return null;
  }

  private static createRegionalRange(countryCode: string, region: string): GeoIPRange {
    const countryInfo = COUNTRY_INFO[countryCode as keyof typeof COUNTRY_INFO];

    return {
      startIP: '0.0.0.0',
      endIP: '255.255.255.255',
      country: countryInfo?.name || 'Unknown',
      countryCode,
      region,
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      isp: 'Unknown ISP',
      organization: 'Regional Internet Registry',
      asn: 0,
      asnOrganization: 'Unknown',
      connectionType: 'unknown'
    };
  }

  private static getDefaultLocation(_ipAddress: string): GeoLocation {
    // Provide a default location based on IP characteristics

    return {
      country: 'Unknown',
      countryCode: 'XX',
      region: 'Unknown',
      city: 'Unknown',
      latitude: 0,
      longitude: 0,
      timezone: 'UTC',
      accuracy: 0
    };
  }

  private static getDefaultNetworkInfo(_ipAddress: string): NetworkInfo {
    return {
      isp: 'Unknown ISP',
      organization: 'Unknown Organization',
      asn: 0,
      asnOrganization: 'Unknown',
      connectionType: 'unknown'
    };
  }

  private static calculateAccuracy(geoData: GeoIPRange): number {
    // Calculate accuracy based on data completeness
    let accuracy = 50; // Base accuracy

    if (geoData.latitude && geoData.longitude) accuracy += 20;
    if (geoData.city && geoData.city !== 'Unknown') accuracy += 15;
    if (geoData.region && geoData.region !== 'Unknown') accuracy += 10;
    if (geoData.timezone && geoData.timezone !== 'UTC') accuracy += 5;

    return Math.min(accuracy, 100);
  }

  private static isKnownProxy(ipAddress: string): boolean {
    // Simple proxy detection based on known patterns
    const geoData = this.findGeoIPRange(ipAddress);
    return geoData?.connectionType === 'hosting' || false;
  }

  private static isKnownVPN(ipAddress: string): boolean {
    // Basic VPN detection - in production, you'd use a VPN database
    const geoData = this.findGeoIPRange(ipAddress);

    // Check for common VPN providers
    const vpnKeywords = ['vpn', 'proxy', 'tunnel', 'private'];
    const orgName = (geoData?.organization || '').toLowerCase();

    return vpnKeywords.some(keyword => orgName.includes(keyword));
  }

  private static isKnownTor(_ipAddress: string): boolean {
    // Tor detection - in production, you'd use the Tor exit node list
    // This is a simplified implementation
    return false; // Would need real Tor exit node database
  }

  private static calculateRiskScore(ipAddress: string, securityInfo: SecurityInfo): number {
    let riskScore = 0;

    if (securityInfo.isProxy) riskScore += 30;
    if (securityInfo.isVPN) riskScore += 20;
    if (securityInfo.isTor) riskScore += 50;

    // Check for suspicious patterns
    const geoData = this.findGeoIPRange(ipAddress);
    if (geoData?.connectionType === 'hosting') riskScore += 10;

    return Math.min(riskScore, 100);
  }

  private static determineReputation(riskScore: number): 'good' | 'neutral' | 'suspicious' | 'malicious' {
    if (riskScore >= 70) return 'malicious';
    if (riskScore >= 40) return 'suspicious';
    if (riskScore >= 20) return 'neutral';
    return 'good';
  }

  private static checkForThreats(ipAddress: string): string[] {
    const threats: string[] = [];

    // Basic threat detection
    if (this.isKnownProxy(ipAddress)) threats.push('proxy');
    if (this.isKnownVPN(ipAddress)) threats.push('vpn');
    if (this.isKnownTor(ipAddress)) threats.push('tor');

    return threats;
  }

  private static ipToDecimal(ipAddress: string): number {
    if (!isIP(ipAddress)) return 0;

    const version = isIP(ipAddress);
    if (version === 4) {
      return (
        ipAddress.split('.').reduce((acc, octet, index) => acc + (parseInt(octet, 10) << (8 * (3 - index))), 0) >>> 0
      );
    }

    // IPv6 handling would be more complex
    return 0;
  }
}
