import { asyncHandler } from '@/middleware/errorHandler';
import { IPClassificationService } from '@/services/ipClassification';
import { IPDetectionService } from '@/services/ipDetection';
import { logger } from '@/utils/logger';
import { Request, Response } from 'express';

export class IPAnalysisController {
  /**
   * Get basic IP analysis for the current request
   */
  static getCurrentIP = asyncHandler(async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Perform connection analysis
      const analysis = await IPDetectionService.analyzeConnection(req);

      // Add comprehensive analysis for primary IP
      if (analysis.ip.primaryIP) {
        const ipDetails = IPClassificationService.getIPDetails(analysis.ip.primaryIP.address);

        // Get geolocation and network info
        const { GeolocationService } = await import('@/services/geolocationService');
        const { geolocation, network, security } = await GeolocationService.getComprehensiveAnalysis(
          analysis.ip.primaryIP.address
        );

        // Add to analysis
        if (geolocation) analysis.ip.geolocation = geolocation;
        if (network) analysis.ip.network = network;
        if (security) analysis.ip.security = security;

        analysis.ip.technical = {
          ...(ipDetails.subnet && { subnet: ipDetails.subnet }),
          ...(ipDetails.cidr && { cidr: ipDetails.cidr })
          // reverseDNS will be implemented in next phase
        };
      }

      logger.info('IP analysis request completed', {
        requestId,
        ip: analysis.ip.primaryIP?.address,
        userAgent: req.get('User-Agent')
      });

      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('IP analysis failed', {
        requestId,
        error: errorMessage,
        stack: errorStack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to analyze IP address',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get detailed IP analysis with all detected IPs
   */
  static getDetailedAnalysis = asyncHandler(async (req: Request, res: Response) => {
    const requestId = req.headers['x-request-id'] as string;

    try {
      // Perform connection analysis
      const analysis = await IPDetectionService.analyzeConnection(req);

      // Add detailed classification for all detected IPs
      const detailedIPs = analysis.ip.allDetectedIPs.map(ipAddr => {
        try {
          const details = IPClassificationService.getIPDetails(ipAddr.address);
          return {
            ...ipAddr,
            details: {
              binary: details.binary,
              decimal: details.decimal,
              subnet: details.subnet,
              cidr: details.cidr,
              range: details.range
            }
          };
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          logger.warn('Failed to get details for IP', {
            ip: ipAddr.address,
            error: errorMessage
          });
          return ipAddr;
        }
      });

      // Enhanced analysis response
      const detailedAnalysis = {
        ...analysis,
        ip: {
          ...analysis.ip,
          allDetectedIPs: detailedIPs
        },
        metadata: {
          totalIPsDetected: analysis.ip.allDetectedIPs.length,
          publicIPs: analysis.ip.allDetectedIPs.filter(ip => ip.type === 'public').length,
          privateIPs: analysis.ip.allDetectedIPs.filter(ip => ip.type === 'private').length,
          sources: [...new Set(analysis.ip.allDetectedIPs.map(ip => ip.source))],
          highestConfidence: Math.max(...analysis.ip.allDetectedIPs.map(ip => ip.confidence)),
          lowestConfidence: Math.min(...analysis.ip.allDetectedIPs.map(ip => ip.confidence))
        }
      };

      logger.info('Detailed IP analysis completed', {
        requestId,
        totalIPs: detailedAnalysis.metadata.totalIPsDetected,
        primaryIP: analysis.ip.primaryIP?.address
      });

      res.json({
        success: true,
        data: detailedAnalysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;

      logger.error('Detailed IP analysis failed', {
        requestId,
        error: errorMessage,
        stack: errorStack
      });

      res.status(500).json({
        success: false,
        error: 'Failed to perform detailed IP analysis',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Analyze a specific IP address (from query parameter)
   */
  static analyzeSpecificIP = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    if (!targetIP || typeof targetIP !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing or invalid IP parameter',
        message: 'Please provide a valid IP address in the "ip" query parameter',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      // Validate and analyze the specific IP
      const ipDetails = IPClassificationService.getIPDetails(targetIP);

      // Create a mock IP address object for consistency
      const ipAnalysis = {
        address: targetIP,
        version: ipDetails.version,
        type: ipDetails.type,
        source: 'query-parameter' as const,
        confidence: 100
      };

      const analysis = {
        ip: {
          primaryIP: ipAnalysis,
          allDetectedIPs: [ipAnalysis],
          technical: {
            subnet: ipDetails.subnet,
            cidr: ipDetails.cidr,
            binary: ipDetails.binary,
            decimal: ipDetails.decimal,
            range: ipDetails.range
          }
        },
        requestId,
        timestamp: new Date().toISOString()
      };

      logger.info('Specific IP analysis completed', {
        requestId,
        targetIP,
        type: ipDetails.type
      });

      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Specific IP analysis failed', {
        requestId,
        targetIP,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'Invalid IP address',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Calculate subnet information
   */
  static calculateSubnet = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP, mask } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    if (!targetIP || typeof targetIP !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing IP parameter',
        message: 'Please provide a valid IP address in the "ip" query parameter',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (!mask || typeof mask !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing mask parameter',
        message: 'Please provide a subnet mask or CIDR in the "mask" query parameter',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      let subnetMask = mask;

      // Convert CIDR to subnet mask if needed
      if (mask.includes('/')) {
        const cidrPart = mask.split('/')[1];
        if (cidrPart) {
          const cidr = parseInt(cidrPart, 10);
          subnetMask = IPClassificationService.cidrToSubnetMask(cidr);
        }
      } else if (!mask.includes('.')) {
        // Assume it's just the CIDR number
        const cidr = parseInt(mask, 10);
        subnetMask = IPClassificationService.cidrToSubnetMask(cidr);
      }

      const subnetInfo = IPClassificationService.calculateSubnet(targetIP, subnetMask);

      logger.info('Subnet calculation completed', {
        requestId,
        targetIP,
        mask,
        network: subnetInfo.network
      });

      res.json({
        success: true,
        data: {
          input: {
            ip: targetIP,
            mask: mask,
            subnetMask: subnetMask
          },
          subnet: subnetInfo
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Subnet calculation failed', {
        requestId,
        targetIP,
        mask,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'Subnet calculation failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get IP classification information
   */
  static getIPClassification = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    if (!targetIP || typeof targetIP !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing IP parameter',
        message: 'Please provide a valid IP address in the "ip" query parameter',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const classification = IPClassificationService.classifyIP(targetIP);
      const details = IPClassificationService.getIPDetails(targetIP);

      logger.info('IP classification completed', {
        requestId,
        targetIP,
        classification
      });

      res.json({
        success: true,
        data: {
          ip: targetIP,
          classification,
          details,
          isPublic: classification === 'public',
          isPrivate: classification === 'private',
          isReserved: classification === 'reserved',
          isLoopback: classification === 'loopback'
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('IP classification failed', {
        requestId,
        targetIP,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'IP classification failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get comprehensive network analysis for a specific IP
   */
  static getNetworkAnalysis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    if (!targetIP || typeof targetIP !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing IP parameter',
        message: 'Please provide a valid IP address in the "ip" query parameter',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { NetworkAnalysisService } = await import('@/services/networkAnalysisService');
      const analysis = await NetworkAnalysisService.analyzeNetwork(targetIP);

      logger.info('Network analysis completed', {
        requestId,
        targetIP,
        analysisTime: analysis.metadata.analysisTime,
        confidence: analysis.metadata.confidence
      });

      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Network analysis failed', {
        requestId,
        targetIP,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'Network analysis failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Compare two IP addresses
   */
  static compareIPs = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip1, ip2 } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    if (!ip1 || typeof ip1 !== 'string' || !ip2 || typeof ip2 !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing IP parameters',
        message: 'Please provide both ip1 and ip2 query parameters',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { NetworkAnalysisService } = await import('@/services/networkAnalysisService');
      const comparison = await NetworkAnalysisService.compareIPs(ip1, ip2);

      logger.info('IP comparison completed', {
        requestId,
        ip1,
        ip2,
        sameCountry: comparison.comparison.sameCountry,
        distanceKm: comparison.comparison.distanceKm
      });

      res.json({
        success: true,
        data: comparison,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('IP comparison failed', {
        requestId,
        ip1,
        ip2,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'IP comparison failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get network fingerprinting analysis
   */
  static getNetworkFingerprint = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    // Use target IP or detect from request
    const ipAddress = (targetIP as string) || (await IPDetectionService.analyzeConnection(req)).ip.primaryIP?.address;

    if (!ipAddress) {
      res.status(400).json({
        success: false,
        error: 'No IP address available',
        message: 'Could not determine IP address for fingerprinting',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { FingerprintingService } = await import('@/services/fingerprintingService');
      const fingerprint = await FingerprintingService.performFingerprinting(req, ipAddress);

      logger.info('Network fingerprinting completed', {
        requestId,
        ipAddress,
        osGuess: fingerprint.overallOsGuess,
        browserGuess: fingerprint.overallBrowserGuess,
        deviceType: fingerprint.deviceType
      });

      res.json({
        success: true,
        data: {
          ipAddress,
          fingerprint,
          metadata: {
            analysisTime: Date.now() - new Date(fingerprint.analysisTimestamp).getTime(),
            confidence: fingerprint.overallConfidence
          }
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Network fingerprinting failed', {
        requestId,
        ipAddress,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'Network fingerprinting failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get DNS analysis
   */
  static getDNSAnalysis = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    if (!targetIP || typeof targetIP !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Missing IP parameter',
        message: 'Please provide a valid IP address in the "ip" query parameter',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { DNSAnalysisService } = await import('@/services/dnsAnalysisService');
      const analysis = await DNSAnalysisService.analyzeDNS(targetIP);

      logger.info('DNS analysis completed', {
        requestId,
        targetIP,
        hostname: analysis.reverseDNS?.hostname,
        responseTime: analysis.responseTime,
        riskScore: analysis.reputation.riskScore
      });

      res.json({
        success: true,
        data: analysis,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('DNS analysis failed', {
        requestId,
        targetIP,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'DNS analysis failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });

  /**
   * Get comprehensive security assessment
   */
  static getSecurityAssessment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { ip: targetIP } = req.query;
    const requestId = req.headers['x-request-id'] as string;

    // Use target IP or detect from request
    const ipAddress = (targetIP as string) || (await IPDetectionService.analyzeConnection(req)).ip.primaryIP?.address;

    if (!ipAddress) {
      res.status(400).json({
        success: false,
        error: 'No IP address available',
        message: 'Could not determine IP address for security assessment',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const { SecurityAssessmentService } = await import('@/services/securityAssessmentService');
      const assessment = await SecurityAssessmentService.performSecurityAssessment(req, ipAddress);

      logger.info('Security assessment completed', {
        requestId,
        ipAddress,
        overallRiskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel,
        threatTypes: assessment.threatIntelligence.threatTypes
      });

      res.json({
        success: true,
        data: assessment,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      logger.error('Security assessment failed', {
        requestId,
        ipAddress,
        error: errorMessage
      });

      res.status(400).json({
        success: false,
        error: 'Security assessment failed',
        message: errorMessage,
        timestamp: new Date().toISOString()
      });
    }
  });
}
