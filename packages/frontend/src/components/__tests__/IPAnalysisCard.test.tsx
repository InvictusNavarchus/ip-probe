import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IPAnalysisCard } from '../IPAnalysisCard';
import { IPProbeAPI } from '../../services/api';
import type { IPAnalysis } from '../../types/api';

// Mock the API
vi.mock('../../services/api');

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 minutes ago'),
}));

// Mock lucide-react icons
vi.mock('lucide-react', () => ({
  Globe: () => <div data-testid="globe-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  Network: () => <div data-testid="network-icon" />,
  MapPin: () => <div data-testid="mappin-icon" />,
  Server: () => <div data-testid="server-icon" />,
  Clock: () => <div data-testid="clock-icon" />,
}));

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
    geolocation: {
      country: 'United States',
      countryCode: 'US',
      region: 'California',
      city: 'Mountain View',
      latitude: 37.4056,
      longitude: -122.0775,
      timezone: 'America/Los_Angeles',
      accuracy: 'city',
    },
    network: {
      isp: 'Google LLC',
      organization: 'Google Public DNS',
      asn: 15169,
      asnOrganization: 'Google LLC',
      connectionType: 'hosting',
    },
    security: {
      isVPN: false,
      isProxy: false,
      isTor: false,
      isHosting: true,
      isMalicious: false,
      riskScore: 10,
    },
  },
  connection: {
    protocol: 'HTTPS',
    port: 443,
    secure: true,
    userAgent: 'Test User Agent',
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

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('IPAnalysisCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    renderWithQueryClient(<IPAnalysisCard />);

    expect(screen.getByText('Analyzing your connection...')).toBeInTheDocument();
  });

  it('renders IP analysis data correctly', async () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });

    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('Mountain View')).toBeInTheDocument();
    expect(screen.getByText('Google LLC')).toBeInTheDocument();
    expect(screen.getByText('Google Public DNS')).toBeInTheDocument();
  });

  it('displays security information correctly', async () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });

    expect(screen.getByText('VPN: No')).toBeInTheDocument();
    expect(screen.getByText('Proxy: No')).toBeInTheDocument();
    expect(screen.getByText('Tor: No')).toBeInTheDocument();
    expect(screen.getByText('Hosting: Yes')).toBeInTheDocument();
  });

  it('displays connection information correctly', async () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });

    expect(screen.getByText('HTTPS:443')).toBeInTheDocument();
    expect(screen.getByText('Secure')).toBeInTheDocument();
  });

  it('handles error state correctly', async () => {
    const errorMessage = 'Failed to fetch IP analysis';
    vi.mocked(IPProbeAPI.getCurrentIP).mockRejectedValue(new Error(errorMessage));

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    });

    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('displays confidence badge correctly', async () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });

    expect(screen.getByText('Very High (95%)')).toBeInTheDocument();
  });

  it('shows coordinates when available', async () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });

    expect(screen.getByText('37.4056, -122.0775')).toBeInTheDocument();
  });

  it('displays ASN information correctly', async () => {
    vi.mocked(IPProbeAPI.getCurrentIP).mockResolvedValue(mockIPAnalysis);

    renderWithQueryClient(<IPAnalysisCard />);

    await waitFor(() => {
      expect(screen.getByText('8.8.8.8')).toBeInTheDocument();
    });

    expect(screen.getByText(/AS15169/)).toBeInTheDocument();
    expect(screen.getByText(/Google LLC/)).toBeInTheDocument();
  });
});
