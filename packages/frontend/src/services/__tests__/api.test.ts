import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import { IPProbeAPI } from '../api';
import type { IPAnalysis, APIResponse } from '../../types/api';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

const mockIPAnalysis: IPAnalysis = {
  ip: {
    primaryIP: {
      address: '8.8.8.8',
      version: 4,
      type: 'public',
      source: 'socket',
      confidence: 95,
    },
    allDetectedIPs: [
      {
        address: '8.8.8.8',
        version: 4,
        type: 'public',
        source: 'socket',
        confidence: 95,
      },
    ],
  },
  connection: {
    protocol: 'HTTPS',
    port: 443,
    secure: true,
  },
  requestId: 'test-request-id',
  timestamp: new Date().toISOString(),
};

const mockAPIResponse: APIResponse<IPAnalysis> = {
  success: true,
  data: mockIPAnalysis,
  timestamp: new Date().toISOString(),
};

describe('IPProbeAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
    };
    
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getCurrentIP', () => {
    it('should fetch current IP analysis successfully', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockAPIResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.getCurrentIP();

      expect(mockGet).toHaveBeenCalledWith('/ip');
      expect(result).toEqual(mockIPAnalysis);
    });

    it('should throw error when API returns unsuccessful response', async () => {
      const errorResponse: APIResponse = {
        success: false,
        error: 'IP_NOT_FOUND',
        message: 'Unable to detect IP address',
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: errorResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      await expect(IPProbeAPI.getCurrentIP()).rejects.toThrow('Unable to detect IP address');
    });

    it('should throw error when API returns no data', async () => {
      const responseWithoutData: APIResponse = {
        success: true,
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: responseWithoutData });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      await expect(IPProbeAPI.getCurrentIP()).rejects.toThrow('Failed to get current IP analysis');
    });
  });

  describe('analyzeSpecificIP', () => {
    it('should analyze specific IP address successfully', async () => {
      const mockGet = vi.fn().mockResolvedValue({ data: mockAPIResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.analyzeSpecificIP('8.8.8.8');

      expect(mockGet).toHaveBeenCalledWith('/ip/analyze', {
        params: { ip: '8.8.8.8' },
      });
      expect(result).toEqual(mockIPAnalysis);
    });

    it('should handle analysis errors', async () => {
      const errorResponse: APIResponse = {
        success: false,
        error: 'INVALID_IP',
        message: 'Invalid IP address format',
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: errorResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      await expect(IPProbeAPI.analyzeSpecificIP('invalid-ip')).rejects.toThrow('Invalid IP address format');
    });
  });

  describe('getDetailedAnalysis', () => {
    it('should fetch detailed analysis successfully', async () => {
      const mockDetailedResponse: APIResponse = {
        success: true,
        data: {
          ...mockIPAnalysis,
          metadata: {
            totalIPsDetected: 1,
            publicIPs: 1,
            privateIPs: 0,
            sources: ['socket'],
            highestConfidence: 95,
            lowestConfidence: 95,
          },
        },
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: mockDetailedResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.getDetailedAnalysis();

      expect(mockGet).toHaveBeenCalledWith('/ip/detailed');
      expect(result).toEqual(mockDetailedResponse.data);
    });
  });

  describe('calculateSubnet', () => {
    it('should calculate subnet information successfully', async () => {
      const mockSubnetResponse: APIResponse = {
        success: true,
        data: {
          network: '192.168.1.0',
          broadcast: '192.168.1.255',
          firstHost: '192.168.1.1',
          lastHost: '192.168.1.254',
          totalHosts: 256,
          usableHosts: 254,
          subnetMask: '255.255.255.0',
          wildcardMask: '0.0.0.255',
          cidr: '192.168.1.0/24',
          binarySubnetMask: '11111111.11111111.11111111.00000000',
        },
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: mockSubnetResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.calculateSubnet('192.168.1.100', '255.255.255.0');

      expect(mockGet).toHaveBeenCalledWith('/ip/subnet', {
        params: { ip: '192.168.1.100', mask: '255.255.255.0' },
      });
      expect(result).toEqual(mockSubnetResponse.data);
    });
  });

  describe('compareIPs', () => {
    it('should compare two IP addresses successfully', async () => {
      const mockComparisonResponse: APIResponse = {
        success: true,
        data: {
          ip1: '8.8.8.8',
          ip2: '8.8.4.4',
          sameNetwork: true,
          sameCountry: true,
          sameISP: true,
          distance: 0,
          similarities: ['Same ISP', 'Same Country', 'Same Network'],
          differences: ['Different IP addresses'],
          analysisTimestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: mockComparisonResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.compareIPs('8.8.8.8', '8.8.4.4');

      expect(mockGet).toHaveBeenCalledWith('/ip/compare', {
        params: { ip1: '8.8.8.8', ip2: '8.8.4.4' },
      });
      expect(result).toEqual(mockComparisonResponse.data);
    });
  });

  describe('getDNSAnalysis', () => {
    it('should get DNS analysis successfully', async () => {
      const mockDNSResponse: APIResponse = {
        success: true,
        data: {
          ipAddress: '8.8.8.8',
          reverseDNS: {
            hostname: 'dns.google',
            verified: true,
            forwardMatch: true,
          },
          dnsRecords: [
            {
              type: 'A',
              value: '8.8.8.8',
              ttl: 300,
            },
          ],
          dnsServers: ['8.8.8.8', '8.8.4.4'],
          responseTime: 25,
          dnsLeaks: {
            detected: false,
            leakedServers: [],
            riskLevel: 'low',
          },
          reputation: {
            isMalicious: false,
            isPhishing: false,
            isMalware: false,
            isSpam: false,
            riskScore: 5,
          },
          analysisTimestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: mockDNSResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.getDNSAnalysis('8.8.8.8');

      expect(mockGet).toHaveBeenCalledWith('/ip/dns', {
        params: { ip: '8.8.8.8' },
      });
      expect(result).toEqual(mockDNSResponse.data);
    });
  });

  describe('getSecurityAssessment', () => {
    it('should get security assessment successfully', async () => {
      const mockSecurityResponse: APIResponse = {
        success: true,
        data: {
          ipAddress: '8.8.8.8',
          overallRiskScore: 15,
          riskLevel: 'low',
          categories: {
            network: {
              score: 85,
              issues: [],
              recommendations: ['Monitor network traffic'],
            },
            dns: {
              score: 90,
              issues: [],
              recommendations: ['Use secure DNS'],
            },
            reputation: {
              score: 95,
              issues: [],
              recommendations: [],
            },
            privacy: {
              score: 80,
              issues: ['Hosting provider'],
              recommendations: ['Consider VPN usage'],
            },
          },
          summary: {
            criticalIssues: 0,
            highIssues: 0,
            mediumIssues: 1,
            lowIssues: 0,
          },
          analysisTimestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      };

      const mockGet = vi.fn().mockResolvedValue({ data: mockSecurityResponse });
      mockedAxios.create.mockReturnValue({ get: mockGet } as any);

      const result = await IPProbeAPI.getSecurityAssessment('8.8.8.8');

      expect(mockGet).toHaveBeenCalledWith('/ip/security', {
        params: { ip: '8.8.8.8' },
      });
      expect(result).toEqual(mockSecurityResponse.data);
    });
  });
});
