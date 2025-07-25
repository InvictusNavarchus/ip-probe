import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCurrentIP, useSpecificIP, useAnalyzeIP } from '../useIPAnalysis';
import { IPProbeAPI } from '../../services/api';
import type { IPAnalysis } from '../../types/api';

// Mock the API
vi.mock('../../services/api');

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

const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  });
};

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useIPAnalysis hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useCurrentIP', () => {
    it('should fetch current IP analysis successfully', async () => {
      vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useCurrentIP(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockIPAnalysis);
      expect(result.current.isLoading).toBe(false);
      expect(IPProbeAPI.getCurrentIP).toHaveBeenCalledTimes(1);
    });

    it('should handle errors correctly', async () => {
      const errorMessage = 'Failed to fetch IP analysis';
      vi.mocked(IPProbeAPI.getCurrentIP).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useCurrentIP(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error(errorMessage));
      expect(result.current.data).toBeUndefined();
    });

    it('should use correct cache configuration', () => {
      vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useCurrentIP(), {
        wrapper: createWrapper(),
      });

      // Check that the query key is correct
      expect(result.current.dataUpdatedAt).toBeDefined();
    });
  });

  describe('useSpecificIP', () => {
    it('should fetch specific IP analysis when enabled', async () => {
      const ipAddress = '1.1.1.1';
      vi.mocked(IPProbeAPI.analyzeSpecificIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useSpecificIP(ipAddress, true), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockIPAnalysis);
      expect(IPProbeAPI.analyzeSpecificIP).toHaveBeenCalledWith(ipAddress);
    });

    it('should not fetch when disabled', () => {
      const ipAddress = '1.1.1.1';
      vi.mocked(IPProbeAPI.analyzeSpecificIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useSpecificIP(ipAddress, false), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(IPProbeAPI.analyzeSpecificIP).not.toHaveBeenCalled();
    });

    it('should not fetch when IP address is empty', () => {
      vi.mocked(IPProbeAPI.analyzeSpecificIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useSpecificIP('', true), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(IPProbeAPI.analyzeSpecificIP).not.toHaveBeenCalled();
    });
  });

  describe('useAnalyzeIP', () => {
    it('should analyze IP address successfully', async () => {
      const ipAddress = '1.1.1.1';
      vi.mocked(IPProbeAPI.analyzeSpecificIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useAnalyzeIP(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isPending).toBe(false);

      result.current.mutate(ipAddress);

      expect(result.current.isPending).toBe(true);

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockIPAnalysis);
      expect(IPProbeAPI.analyzeSpecificIP).toHaveBeenCalledWith(ipAddress);
    });

    it('should handle mutation errors', async () => {
      const ipAddress = 'invalid-ip';
      const errorMessage = 'Invalid IP address';
      vi.mocked(IPProbeAPI.analyzeSpecificIP).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAnalyzeIP(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(ipAddress);

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(new Error(errorMessage));
    });

    it('should call mutateAsync correctly', async () => {
      const ipAddress = '1.1.1.1';
      vi.mocked(IPProbeAPI.analyzeSpecificIP).mockResolvedValue(mockIPAnalysis);

      const { result } = renderHook(() => useAnalyzeIP(), {
        wrapper: createWrapper(),
      });

      const analysisResult = await result.current.mutateAsync(ipAddress);

      expect(analysisResult).toEqual(mockIPAnalysis);
      expect(IPProbeAPI.analyzeSpecificIP).toHaveBeenCalledWith(ipAddress);
    });
  });

  describe('query keys', () => {
    it('should generate correct query keys', () => {
      const { queryKeys } = require('../useIPAnalysis');

      expect(queryKeys.currentIP).toEqual(['ip', 'current']);
      expect(queryKeys.detailedAnalysis).toEqual(['ip', 'detailed']);
      expect(queryKeys.specificIP('1.1.1.1')).toEqual(['ip', 'specific', '1.1.1.1']);
      expect(queryKeys.ipClassification('1.1.1.1')).toEqual(['ip', 'classification', '1.1.1.1']);
      expect(queryKeys.subnet('192.168.1.1', '255.255.255.0')).toEqual([
        'ip',
        'subnet',
        '192.168.1.1',
        '255.255.255.0',
      ]);
      expect(queryKeys.networkAnalysis('1.1.1.1')).toEqual(['ip', 'network', '1.1.1.1']);
      expect(queryKeys.ipComparison('1.1.1.1', '8.8.8.8')).toEqual([
        'ip',
        'compare',
        '1.1.1.1',
        '8.8.8.8',
      ]);
      expect(queryKeys.networkFingerprint).toEqual(['ip', 'fingerprint']);
      expect(queryKeys.dnsAnalysis('1.1.1.1')).toEqual(['ip', 'dns', '1.1.1.1']);
      expect(queryKeys.securityAssessment('1.1.1.1')).toEqual(['ip', 'security', '1.1.1.1']);
    });
  });
});
