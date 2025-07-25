import { logger } from '@/utils/logger';
import { Request } from 'express';
import { isIP } from 'net';
import { DNSAnalysisService } from './dnsAnalysisService';
import { FingerprintingService, NetworkFingerprint } from './fingerprintingService';
import { GeolocationService } from './geolocationService';

export interface ThreatIntelligence {
  isMalicious: boolean;
  threatTypes: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  lastSeen?: string;
  sources: string[];
}

export interface VulnerabilityAssessment {
  openPorts?: number[];
  services?: string[];
  vulnerabilities: {
    cve?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
    recommendation: string;
  }[];
  securityScore: number;
}

export interface BehaviorAnalysis {
  isBot: boolean;
  isSuspicious: boolean;
  activityPattern: 'normal' | 'scanning' | 'brute_force' | 'ddos' | 'unknown';
  requestFrequency?: number;
  userAgentConsistency: boolean;
  geolocationConsistency: boolean;
  riskIndicators: string[];
}

export interface ComprehensiveSecurityAssessment {
  ipAddress: string;
  overallRiskScore: number;
  riskLevel: 'very_low' | 'low' | 'medium' | 'high' | 'critical';
  threatIntelligence: ThreatIntelligence;
  vulnerabilityAssessment: VulnerabilityAssessment;
  behaviorAnalysis: BehaviorAnalysis;
  networkFingerprint?: NetworkFingerprint;
  dnsAnalysis?: any; // Will be populated by DNS service
  recommendations: string[];
  analysisTimestamp: string;
  analysisVersion: string;
}

export class SecurityAssessmentService {
  private static readonly ANALYSIS_VERSION = '1.0.0';

  // Known malicious IP ranges (simplified for demo) - currently unused but kept for future expansion
  // private static readonly MALICIOUS_RANGES = [
  //   { start: '0.0.0.0', end: '0.255.255.255', type: 'reserved' },
  //   { start: '127.0.0.0', end: '127.255.255.255', type: 'loopback' },
  //   // Add more known malicious ranges here
  // ];

  // Known bot user agents
  private static readonly BOT_PATTERNS = [
    /bot/i,
    /crawler/i,
    /spider/i,
    /scraper/i,
    /curl/i,
    /wget/i,
    /python-requests/i,
    /scanner/i,
    /probe/i,
    /test/i
  ];

  /**
   * Perform comprehensive security assessment
   */
  static async performSecurityAssessment(req: Request, ipAddress: string): Promise<ComprehensiveSecurityAssessment> {
    if (!isIP(ipAddress)) {
      throw new Error(`Invalid IP address: ${ipAddress}`);
    }

    try {
      logger.info('Starting comprehensive security assessment', { ipAddress });

      // Perform parallel analysis
      const [threatIntelligence, vulnerabilityAssessment, behaviorAnalysis, networkFingerprint, dnsAnalysis] =
        await Promise.all([
          this.analyzeThreatIntelligence(ipAddress),
          this.performVulnerabilityAssessment(ipAddress),
          this.analyzeBehavior(req, ipAddress),
          FingerprintingService.performFingerprinting(req, ipAddress),
          DNSAnalysisService.analyzeDNS(ipAddress).catch(() => null) // Don't fail if DNS analysis fails
        ]);

      // Calculate overall risk score
      const overallRiskScore = this.calculateOverallRiskScore(
        threatIntelligence,
        vulnerabilityAssessment,
        behaviorAnalysis,
        dnsAnalysis
      );

      const riskLevel = this.determineRiskLevel(overallRiskScore);
      const recommendations = this.generateRecommendations(
        threatIntelligence,
        vulnerabilityAssessment,
        behaviorAnalysis,
        riskLevel
      );

      const assessment: ComprehensiveSecurityAssessment = {
        ipAddress,
        overallRiskScore,
        riskLevel,
        threatIntelligence,
        vulnerabilityAssessment,
        behaviorAnalysis,
        networkFingerprint,
        dnsAnalysis,
        recommendations,
        analysisTimestamp: new Date().toISOString(),
        analysisVersion: this.ANALYSIS_VERSION
      };

      logger.info('Security assessment completed', {
        ipAddress,
        overallRiskScore,
        riskLevel,
        threatTypes: threatIntelligence.threatTypes,
        isBot: behaviorAnalysis.isBot
      });

      return assessment;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Security assessment failed', { ipAddress, error: errorMessage });
      throw error;
    }
  }

  /**
   * Analyze threat intelligence
   */
  private static async analyzeThreatIntelligence(ipAddress: string): Promise<ThreatIntelligence> {
    const threatTypes: string[] = [];
    let isMalicious = false;
    let severity: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let confidence = 50;
    const sources: string[] = ['local_analysis'];

    // Check against known malicious ranges
    if (this.isInMaliciousRange(ipAddress)) {
      isMalicious = true;
      threatTypes.push('malicious_range');
      severity = 'high';
      confidence = 80;
    }

    // Get geolocation for additional context
    try {
      const { security } = await GeolocationService.getComprehensiveAnalysis(ipAddress);
      if (security) {
        if (security.isProxy) {
          threatTypes.push('proxy');
          confidence += 10;
        }
        if (security.isVPN) {
          threatTypes.push('vpn');
          confidence += 10;
        }
        if (security.isTor) {
          threatTypes.push('tor');
          severity = 'medium';
          confidence += 20;
        }
        if (security.isThreat) {
          isMalicious = true;
          threatTypes.push(...security.threatTypes);
        }
      }
    } catch {
      // Geolocation analysis failed, continue with other checks
    }

    // Additional threat analysis based on IP characteristics
    const ipParts = ipAddress.split('.');
    const firstOctet = parseInt(ipParts[0] || '0', 10);

    // Check for suspicious IP patterns
    if (firstOctet === 0 || firstOctet >= 224) {
      threatTypes.push('suspicious_range');
      confidence += 15;
    }

    return {
      isMalicious,
      threatTypes,
      severity,
      confidence: Math.min(confidence, 100),
      sources
    };
  }

  /**
   * Perform vulnerability assessment
   */
  private static async performVulnerabilityAssessment(ipAddress: string): Promise<VulnerabilityAssessment> {
    const vulnerabilities: VulnerabilityAssessment['vulnerabilities'] = [];
    let securityScore = 100; // Start with perfect score

    // Check for common vulnerabilities based on IP characteristics
    const version = isIP(ipAddress);

    if (version === 4) {
      // IPv4 specific checks
      const ipParts = ipAddress.split('.');
      const firstOctet = parseInt(ipParts[0] || '0', 10);

      // Check for RFC 1918 private addresses exposed publicly
      if (
        firstOctet === 10 ||
        (firstOctet === 172 && parseInt(ipParts[1] || '0', 10) >= 16 && parseInt(ipParts[1] || '0', 10) <= 31) ||
        (firstOctet === 192 && parseInt(ipParts[1] || '0', 10) === 168)
      ) {
        vulnerabilities.push({
          severity: 'medium',
          description: 'Private IP address detected in public context',
          recommendation: 'Verify network configuration and NAT setup'
        });
        securityScore -= 20;
      }
    }

    // Simulated port scan results (in real implementation, this would be actual scanning)
    const commonPorts = [22, 23, 25, 53, 80, 110, 143, 443, 993, 995];
    const openPorts = commonPorts.filter(() => Math.random() < 0.1); // Randomly simulate some open ports

    if (openPorts.includes(23)) {
      // Telnet
      vulnerabilities.push({
        severity: 'high',
        description: 'Telnet service detected (unencrypted)',
        recommendation: 'Disable Telnet and use SSH instead'
      });
      securityScore -= 30;
    }

    if (openPorts.includes(25)) {
      // SMTP
      vulnerabilities.push({
        severity: 'medium',
        description: 'SMTP service detected',
        recommendation: 'Ensure SMTP relay is properly configured'
      });
      securityScore -= 10;
    }

    return {
      openPorts,
      vulnerabilities,
      securityScore: Math.max(securityScore, 0)
    };
  }

  /**
   * Analyze behavior patterns
   */
  private static async analyzeBehavior(req: Request, ipAddress: string): Promise<BehaviorAnalysis> {
    const userAgent = req.get('User-Agent') || '';
    const riskIndicators: string[] = [];

    // Bot detection
    const isBot = this.BOT_PATTERNS.some(pattern => pattern.test(userAgent));
    if (isBot) {
      riskIndicators.push('bot_user_agent');
    }

    // Suspicious behavior detection
    let isSuspicious = false;
    let activityPattern: BehaviorAnalysis['activityPattern'] = 'normal';

    // Check for scanning behavior
    if (
      userAgent.toLowerCase().includes('scan') ||
      userAgent.toLowerCase().includes('probe') ||
      userAgent.toLowerCase().includes('test')
    ) {
      isSuspicious = true;
      activityPattern = 'scanning';
      riskIndicators.push('scanning_behavior');
    }

    // Check for automation tools
    if (
      userAgent.toLowerCase().includes('curl') ||
      userAgent.toLowerCase().includes('wget') ||
      userAgent.toLowerCase().includes('python')
    ) {
      riskIndicators.push('automation_tool');
    }

    // User agent consistency check
    const userAgentConsistency = this.checkUserAgentConsistency(req);
    if (!userAgentConsistency) {
      riskIndicators.push('inconsistent_user_agent');
    }

    // Geolocation consistency (simplified)
    const geolocationConsistency = await this.checkGeolocationConsistency(req, ipAddress);
    if (!geolocationConsistency) {
      riskIndicators.push('geolocation_inconsistency');
    }

    return {
      isBot,
      isSuspicious,
      activityPattern,
      userAgentConsistency,
      geolocationConsistency,
      riskIndicators
    };
  }

  /**
   * Check if IP is in malicious range
   */
  private static isInMaliciousRange(ipAddress: string): boolean {
    // Simplified implementation - in production, use proper IP range checking
    const ipParts = ipAddress.split('.');
    const firstOctet = parseInt(ipParts[0] || '0', 10);

    // Check for obviously malicious ranges
    return firstOctet === 0 || firstOctet >= 240;
  }

  /**
   * Check user agent consistency
   */
  private static checkUserAgentConsistency(req: Request): boolean {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language') || '';
    const acceptEncoding = req.get('Accept-Encoding') || '';

    // Basic consistency checks
    if (userAgent.includes('Chrome') && !acceptEncoding.includes('gzip')) {
      return false; // Chrome always supports gzip
    }

    if (userAgent.includes('Firefox') && !acceptLanguage) {
      return false; // Firefox typically sends Accept-Language
    }

    return true;
  }

  /**
   * Check geolocation consistency
   */
  private static async checkGeolocationConsistency(req: Request, ipAddress: string): Promise<boolean> {
    try {
      const acceptLanguage = req.get('Accept-Language') || '';
      const { geolocation } = await GeolocationService.getComprehensiveAnalysis(ipAddress);

      if (!geolocation || !acceptLanguage) return true; // Can't check without data

      // Simple check: if IP is from non-English speaking country but only accepts English
      const nonEnglishCountries = ['DE', 'FR', 'ES', 'IT', 'RU', 'CN', 'JP', 'KR'];
      if (
        (nonEnglishCountries.includes(geolocation.countryCode) && acceptLanguage === 'en-US') ||
        acceptLanguage === 'en'
      ) {
        return false;
      }

      return true;
    } catch {
      return true; // Default to consistent if we can't check
    }
  }

  /**
   * Calculate overall risk score
   */
  private static calculateOverallRiskScore(
    threat: ThreatIntelligence,
    vuln: VulnerabilityAssessment,
    behavior: BehaviorAnalysis,
    dns: any
  ): number {
    let score = 0;

    // Threat intelligence weight: 40%
    if (threat.isMalicious) {
      score +=
        threat.severity === 'critical' ? 40 : threat.severity === 'high' ? 30 : threat.severity === 'medium' ? 20 : 10;
    }

    // Vulnerability assessment weight: 30%
    const vulnScore = (100 - vuln.securityScore) * 0.3;
    score += vulnScore;

    // Behavior analysis weight: 20%
    if (behavior.isSuspicious) score += 15;
    if (behavior.isBot) score += 5;
    score += behavior.riskIndicators.length * 2;

    // DNS analysis weight: 10%
    if (dns?.reputation?.riskScore) {
      score += dns.reputation.riskScore * 0.1;
    }

    return Math.min(Math.round(score), 100);
  }

  /**
   * Determine risk level from score
   */
  private static determineRiskLevel(score: number): 'very_low' | 'low' | 'medium' | 'high' | 'critical' {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 40) return 'medium';
    if (score >= 20) return 'low';
    return 'very_low';
  }

  /**
   * Generate security recommendations
   */
  private static generateRecommendations(
    threat: ThreatIntelligence,
    vuln: VulnerabilityAssessment,
    behavior: BehaviorAnalysis,
    riskLevel: string
  ): string[] {
    const recommendations: string[] = [];

    if (threat.isMalicious) {
      recommendations.push('Block or closely monitor this IP address');
      recommendations.push('Review access logs for suspicious activity');
    }

    if (threat.threatTypes.includes('proxy') || threat.threatTypes.includes('vpn')) {
      recommendations.push('Consider implementing additional verification for proxy/VPN traffic');
    }

    if (vuln.vulnerabilities.length > 0) {
      recommendations.push('Address identified vulnerabilities immediately');
      vuln.vulnerabilities.forEach(v => {
        if (v.severity === 'high' || v.severity === 'critical') {
          recommendations.push(`Priority: ${v.recommendation}`);
        }
      });
    }

    if (behavior.isBot) {
      recommendations.push('Implement bot detection and rate limiting');
    }

    if (behavior.isSuspicious) {
      recommendations.push('Enable enhanced logging and monitoring');
    }

    if (riskLevel === 'critical' || riskLevel === 'high') {
      recommendations.push('Consider immediate blocking or quarantine');
      recommendations.push('Escalate to security team for investigation');
    }

    if (recommendations.length === 0) {
      recommendations.push('No immediate security concerns identified');
      recommendations.push('Continue regular monitoring');
    }

    return recommendations;
  }
}
