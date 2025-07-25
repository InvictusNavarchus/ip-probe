// API Response Types for IP Probe Frontend
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// IP Analysis Types
export interface IPAddress {
  address: string;
  version: 4 | 6;
  type: 'public' | 'private' | 'reserved' | 'loopback' | 'multicast';
  source: 'x-forwarded-for' | 'x-real-ip' | 'cf-connecting-ip' | 'socket' | 'query-parameter';
  confidence: number;
}

export interface IPDetails {
  binary?: string;
  decimal?: number;
  subnet?: string;
  cidr?: string;
  range?: {
    start: string;
    end: string;
    total: number;
  };
}

export interface Geolocation {
  country?: string;
  countryCode?: string;
  region?: string;
  regionCode?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  timezone?: string;
  accuracy?: 'country' | 'region' | 'city';
  source?: string;
}

export interface NetworkInfo {
  isp?: string;
  organization?: string;
  asn?: number;
  asnOrganization?: string;
  connectionType?: 'residential' | 'business' | 'mobile' | 'hosting' | 'unknown';
  domain?: string;
}

export interface SecurityInfo {
  isVPN?: boolean;
  isProxy?: boolean;
  isTor?: boolean;
  isHosting?: boolean;
  isMalicious?: boolean;
  riskScore?: number;
  threats?: string[];
}

export interface TechnicalInfo {
  subnet?: string;
  cidr?: string;
  binary?: string;
  decimal?: number;
  range?: {
    start: string;
    end: string;
    total: number;
  };
  reverseDNS?: string;
}

export interface ConnectionInfo {
  protocol: string;
  port?: number;
  secure: boolean;
  userAgent?: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
}

export interface IPAnalysis {
  ip: {
    primaryIP?: IPAddress;
    allDetectedIPs: IPAddress[];
    geolocation?: Geolocation;
    network?: NetworkInfo;
    security?: SecurityInfo;
    technical?: TechnicalInfo;
  };
  connection: ConnectionInfo;
  requestId: string;
  timestamp: string;
}

export interface DetailedIPAnalysis extends IPAnalysis {
  metadata: {
    totalIPsDetected: number;
    publicIPs: number;
    privateIPs: number;
    sources: string[];
    highestConfidence: number;
    lowestConfidence: number;
  };
}

// DNS Analysis Types
export interface DNSRecord {
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'PTR' | 'SOA';
  value: string;
  ttl?: number;
}

export interface DNSAnalysis {
  ipAddress: string;
  reverseDNS?: {
    hostname?: string;
    verified: boolean;
    forwardMatch: boolean;
  };
  dnsRecords: DNSRecord[];
  dnsServers?: string[];
  responseTime: number;
  dnssecEnabled?: boolean;
  dnsLeaks: {
    detected: boolean;
    leakedServers: string[];
    riskLevel: 'low' | 'medium' | 'high';
  };
  reputation: {
    isMalicious: boolean;
    isPhishing: boolean;
    isMalware: boolean;
    isSpam: boolean;
    riskScore: number;
  };
  analysisTimestamp: string;
}

// Network Fingerprinting Types
export interface NetworkFingerprint {
  ipAddress: string;
  httpFingerprint: {
    headers: Record<string, string>;
    serverSignature?: string;
    technologies: string[];
    securityHeaders: {
      present: string[];
      missing: string[];
      score: number;
    };
  };
  tcpFingerprint?: {
    osGuess?: string;
    confidence?: number;
    details?: Record<string, any>;
  };
  tlsFingerprint?: {
    version?: string;
    cipherSuites?: string[];
    extensions?: string[];
    certificateInfo?: {
      subject?: string;
      issuer?: string;
      validFrom?: string;
      validTo?: string;
      fingerprint?: string;
    };
  };
  analysisTimestamp: string;
}

// Security Assessment Types
export interface SecurityAssessment {
  ipAddress: string;
  overallRiskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  categories: {
    network: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
    dns: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
    reputation: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
    privacy: {
      score: number;
      issues: string[];
      recommendations: string[];
    };
  };
  summary: {
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  analysisTimestamp: string;
}

// Subnet Calculation Types
export interface SubnetInfo {
  network: string;
  broadcast: string;
  firstHost: string;
  lastHost: string;
  totalHosts: number;
  usableHosts: number;
  subnetMask: string;
  wildcardMask: string;
  cidr: string;
  binarySubnetMask: string;
}

// IP Comparison Types
export interface IPComparison {
  ip1: string;
  ip2: string;
  sameNetwork: boolean;
  sameCountry: boolean;
  sameISP: boolean;
  distance?: number;
  similarities: string[];
  differences: string[];
  analysisTimestamp: string;
}

// Error Types
export interface APIError {
  success: false;
  error: string;
  message: string;
  timestamp: string;
  details?: any;
}
