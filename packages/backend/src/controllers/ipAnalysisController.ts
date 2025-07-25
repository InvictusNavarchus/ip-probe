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

      // Add classification details for primary IP
      if (analysis.ip.primaryIP) {
        const ipDetails = IPClassificationService.getIPDetails(analysis.ip.primaryIP.address);
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
}
