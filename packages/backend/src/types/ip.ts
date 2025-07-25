export interface IPAddress {
  address: string;
  version: 4 | 6;
  type: 'public' | 'private' | 'reserved' | 'loopback' | 'multicast' | 'broadcast';
  source: 'socket' | 'x-forwarded-for' | 'x-real-ip' | 'cf-connecting-ip' | 'x-cluster-client-ip' | 'forwarded';
  confidence: number; // 0-100, how confident we are this is the real IP
}

export interface IPAnalysis {
  primaryIP: IPAddress;
  allDetectedIPs: IPAddress[];
  geolocation?: {
    country?: string;
    countryCode?: string;
    region?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    accuracy?: number;
  };
  network?: {
    isp?: string;
    organization?: string;
    asn?: number;
    asnOrganization?: string;
    connectionType?: 'residential' | 'business' | 'mobile' | 'hosting' | 'unknown';
  };
  security?: {
    isProxy?: boolean;
    isVPN?: boolean;
    isTor?: boolean;
    isThreat?: boolean;
    threatTypes?: string[];
    riskScore?: number; // 0-100
  };
  technical?: {
    subnet?: string;
    cidr?: string;
    reverseDNS?: string;
    ports?: number[];
    protocols?: string[];
  };
}

export interface NetworkConnection {
  protocol: 'HTTP' | 'HTTPS' | 'WebSocket' | 'Unknown';
  port: number;
  encrypted: boolean;
  userAgent?: string | undefined;
  acceptLanguage?: string | undefined;
  acceptEncoding?: string | undefined;
  dnt?: boolean; // Do Not Track
  headers: Record<string, string>;
}

export interface ConnectionAnalysis {
  ip: IPAnalysis;
  connection: NetworkConnection;
  performance?: {
    latency?: number;
    bandwidth?: number;
    quality?: 'excellent' | 'good' | 'fair' | 'poor';
  };
  fingerprint?: {
    tcpFingerprint?: string;
    httpFingerprint?: string;
    tlsFingerprint?: string;
    osGuess?: string;
    browserGuess?: string;
  };
  timestamp: string;
  requestId: string;
}

export interface IPRange {
  start: string;
  end: string;
  cidr: string;
  type: 'public' | 'private' | 'reserved';
  description?: string;
}

export interface GeoLocation {
  country: string;
  countryCode: string;
  region: string;
  city: string;
  latitude: number;
  longitude: number;
  timezone: string;
  accuracy: number;
}

export interface NetworkInfo {
  isp: string;
  organization: string;
  asn: number;
  asnOrganization: string;
  connectionType: 'residential' | 'business' | 'mobile' | 'hosting' | 'unknown';
}

export interface SecurityInfo {
  isProxy: boolean;
  isVPN: boolean;
  isTor: boolean;
  isThreat: boolean;
  threatTypes: string[];
  riskScore: number;
  lastSeen?: string;
  reputation?: 'good' | 'neutral' | 'suspicious' | 'malicious';
}
