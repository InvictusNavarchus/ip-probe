import axios, { AxiosError, AxiosInstance, AxiosResponse } from 'axios';
import type {
  APIError,
  APIResponse,
  DetailedIPAnalysis,
  DNSAnalysis,
  IPAnalysis,
  IPComparison,
  NetworkFingerprint,
  SecurityAssessment,
  SubnetInfo
} from '../types/api';

// Create axios instance with default configuration
const createAPIClient = (): AxiosInstance => {
  // Use environment variables for configuration
  const baseURL = import.meta.env.PROD ? import.meta.env.VITE_API_BASE_URL || '/api' : '/api'; // In development, use proxy

  const timeout = parseInt(import.meta.env.VITE_API_TIMEOUT) || 30000;

  const client = axios.create({
    baseURL,
    timeout,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    }
  });

  // Request interceptor
  client.interceptors.request.use(
    config => {
      // Add request ID for tracking
      config.headers['x-request-id'] = crypto.randomUUID();

      // Log request in development or when API logging is enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_API_LOGGING === 'true') {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          params: config.params,
          data: config.data
        });
      }

      return config;
    },
    error => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // Response interceptor
  client.interceptors.response.use(
    (response: AxiosResponse<APIResponse>) => {
      // Log response in development or when API logging is enabled
      if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_API_LOGGING === 'true') {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data
        });
      }

      return response;
    },
    (error: AxiosError<APIError>) => {
      // Enhanced error handling
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error occurred';
      const errorDetails = {
        status: error.response?.status,
        statusText: error.response?.statusText,
        url: error.config?.url,
        method: error.config?.method,
        message: errorMessage,
        timestamp: new Date().toISOString()
      };

      console.error('❌ API Error:', errorDetails);

      // Create standardized error object
      const apiError: APIError = {
        success: false,
        error: error.response?.data?.error || 'API_ERROR',
        message: errorMessage,
        timestamp: error.response?.data?.timestamp || new Date().toISOString(),
        details: errorDetails
      };

      return Promise.reject(apiError);
    }
  );

  return client;
};

// Create the API client instance
const apiClient = createAPIClient();

// API Service Class
export class IPProbeAPI {
  /**
   * Get current IP analysis
   */
  static async getCurrentIP(): Promise<IPAnalysis> {
    const response = await apiClient.get<APIResponse<IPAnalysis>>('/ip');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get current IP analysis');
    }

    return response.data.data;
  }

  /**
   * Get detailed IP analysis with all detected IPs
   */
  static async getDetailedAnalysis(): Promise<DetailedIPAnalysis> {
    const response = await apiClient.get<APIResponse<DetailedIPAnalysis>>('/ip/detailed');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get detailed IP analysis');
    }

    return response.data.data;
  }

  /**
   * Analyze a specific IP address
   */
  static async analyzeSpecificIP(ipAddress: string): Promise<IPAnalysis> {
    const response = await apiClient.get<APIResponse<IPAnalysis>>('/ip/analyze', {
      params: { ip: ipAddress }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to analyze specific IP');
    }

    return response.data.data;
  }

  /**
   * Get IP classification
   */
  static async getIPClassification(ipAddress: string): Promise<any> {
    const response = await apiClient.get<APIResponse<any>>('/ip/classify', {
      params: { ip: ipAddress }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to classify IP');
    }

    return response.data.data;
  }

  /**
   * Calculate subnet information
   */
  static async calculateSubnet(ipAddress: string, subnetMask: string): Promise<SubnetInfo> {
    const response = await apiClient.get<APIResponse<SubnetInfo>>('/ip/subnet', {
      params: { ip: ipAddress, mask: subnetMask }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to calculate subnet');
    }

    return response.data.data;
  }

  /**
   * Get comprehensive network analysis
   */
  static async getNetworkAnalysis(ipAddress: string): Promise<any> {
    const response = await apiClient.get<APIResponse<any>>('/ip/network', {
      params: { ip: ipAddress }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get network analysis');
    }

    return response.data.data;
  }

  /**
   * Compare two IP addresses
   */
  static async compareIPs(ip1: string, ip2: string): Promise<IPComparison> {
    const response = await apiClient.get<APIResponse<IPComparison>>('/ip/compare', {
      params: { ip1, ip2 }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to compare IPs');
    }

    return response.data.data;
  }

  /**
   * Get network fingerprinting analysis
   */
  static async getNetworkFingerprint(): Promise<NetworkFingerprint> {
    const response = await apiClient.get<APIResponse<NetworkFingerprint>>('/ip/fingerprint');

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get network fingerprint');
    }

    return response.data.data;
  }

  /**
   * Get DNS analysis
   */
  static async getDNSAnalysis(ipAddress: string): Promise<DNSAnalysis> {
    const response = await apiClient.get<APIResponse<DNSAnalysis>>('/ip/dns', {
      params: { ip: ipAddress }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get DNS analysis');
    }

    return response.data.data;
  }

  /**
   * Get comprehensive security assessment
   */
  static async getSecurityAssessment(ipAddress: string): Promise<SecurityAssessment> {
    const response = await apiClient.get<APIResponse<SecurityAssessment>>('/ip/security', {
      params: { ip: ipAddress }
    });

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || 'Failed to get security assessment');
    }

    return response.data.data;
  }
}

// Export the API client for direct use if needed
export { apiClient };
export default IPProbeAPI;
