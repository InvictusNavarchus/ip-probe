import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { IPProbeAPI } from '../services/api';
import type { APIError } from '../types/api';

// Query Keys
export const queryKeys = {
  currentIP: ['ip', 'current'] as const,
  detailedAnalysis: ['ip', 'detailed'] as const,
  specificIP: (ip: string) => ['ip', 'specific', ip] as const,
  ipClassification: (ip: string) => ['ip', 'classification', ip] as const,
  subnet: (ip: string, mask: string) => ['ip', 'subnet', ip, mask] as const,
  networkAnalysis: (ip: string) => ['ip', 'network', ip] as const,
  ipComparison: (ip1: string, ip2: string) => ['ip', 'compare', ip1, ip2] as const,
  networkFingerprint: ['ip', 'fingerprint'] as const,
  dnsAnalysis: (ip: string) => ['ip', 'dns', ip] as const,
  securityAssessment: (ip: string) => ['ip', 'security', ip] as const
} as const;

// Hook for current IP analysis
export function useCurrentIP() {
  return useQuery({
    queryKey: queryKeys.currentIP,
    queryFn: IPProbeAPI.getCurrentIP,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

// Hook for detailed IP analysis
export function useDetailedAnalysis() {
  return useQuery({
    queryKey: queryKeys.detailedAnalysis,
    queryFn: IPProbeAPI.getDetailedAnalysis,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 3,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
  });
}

// Hook for analyzing specific IP
export function useSpecificIP(ipAddress: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.specificIP(ipAddress),
    queryFn: () => IPProbeAPI.analyzeSpecificIP(ipAddress),
    enabled: enabled && !!ipAddress,
    staleTime: 10 * 60 * 1000, // 10 minutes for specific IPs
    gcTime: 30 * 60 * 1000, // 30 minutes
    retry: 2
  });
}

// Hook for IP classification
export function useIPClassification(ipAddress: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ipClassification(ipAddress),
    queryFn: () => IPProbeAPI.getIPClassification(ipAddress),
    enabled: enabled && !!ipAddress,
    staleTime: 15 * 60 * 1000, // 15 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 2
  });
}

// Hook for subnet calculation
export function useSubnetCalculation(ipAddress: string, subnetMask: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.subnet(ipAddress, subnetMask),
    queryFn: () => IPProbeAPI.calculateSubnet(ipAddress, subnetMask),
    enabled: enabled && !!ipAddress && !!subnetMask,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
    retry: 1
  });
}

// Hook for network analysis
export function useNetworkAnalysis(ipAddress: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.networkAnalysis(ipAddress),
    queryFn: () => IPProbeAPI.getNetworkAnalysis(ipAddress),
    enabled: enabled && !!ipAddress,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2
  });
}

// Hook for IP comparison
export function useIPComparison(ip1: string, ip2: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ipComparison(ip1, ip2),
    queryFn: () => IPProbeAPI.compareIPs(ip1, ip2),
    enabled: enabled && !!ip1 && !!ip2,
    staleTime: 15 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 1
  });
}

// Hook for network fingerprinting
export function useNetworkFingerprint() {
  return useQuery({
    queryKey: queryKeys.networkFingerprint,
    queryFn: IPProbeAPI.getNetworkFingerprint,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000,
    retry: 3
  });
}

// Hook for DNS analysis
export function useDNSAnalysis(ipAddress: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dnsAnalysis(ipAddress),
    queryFn: () => IPProbeAPI.getDNSAnalysis(ipAddress),
    enabled: enabled && !!ipAddress,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2
  });
}

// Hook for security assessment
export function useSecurityAssessment(ipAddress: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.securityAssessment(ipAddress),
    queryFn: () => IPProbeAPI.getSecurityAssessment(ipAddress),
    enabled: enabled && !!ipAddress,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 2
  });
}

// Mutation hook for refreshing current IP analysis
export function useRefreshCurrentIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: IPProbeAPI.getCurrentIP,
    onSuccess: data => {
      queryClient.setQueryData(queryKeys.currentIP, data);
      // Also invalidate related queries
      queryClient.invalidateQueries({ queryKey: queryKeys.detailedAnalysis });
    },
    onError: (error: APIError) => {
      console.error('Failed to refresh current IP:', error);
    }
  });
}

// Mutation hook for analyzing new IP
export function useAnalyzeIP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ipAddress: string) => IPProbeAPI.analyzeSpecificIP(ipAddress),
    onSuccess: (data, ipAddress) => {
      queryClient.setQueryData(queryKeys.specificIP(ipAddress), data);
    },
    onError: (error: APIError) => {
      console.error('Failed to analyze IP:', error);
    }
  });
}

// Utility hook for invalidating all IP-related queries
export function useInvalidateIPQueries() {
  const queryClient = useQueryClient();

  return () => {
    queryClient.invalidateQueries({ queryKey: ['ip'] });
  };
}

// Hook for prefetching related data
export function usePrefetchRelatedData() {
  const queryClient = useQueryClient();

  const prefetchRelatedData = async (ip: string) => {
    // Prefetch DNS analysis
    queryClient.prefetchQuery({
      queryKey: queryKeys.dnsAnalysis(ip),
      queryFn: () => IPProbeAPI.getDNSAnalysis(ip),
      staleTime: 5 * 60 * 1000
    });

    // Prefetch security assessment
    queryClient.prefetchQuery({
      queryKey: queryKeys.securityAssessment(ip),
      queryFn: () => IPProbeAPI.getSecurityAssessment(ip),
      staleTime: 5 * 60 * 1000
    });

    // Prefetch network analysis
    queryClient.prefetchQuery({
      queryKey: queryKeys.networkAnalysis(ip),
      queryFn: () => IPProbeAPI.getNetworkAnalysis(ip),
      staleTime: 10 * 60 * 1000
    });
  };

  return prefetchRelatedData;
}
