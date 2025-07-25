import { logger } from '@/utils/logger';
import { Request } from 'express';

export interface TCPFingerprint {
  windowSize?: number;
  maxSegmentSize?: number;
  windowScaling?: boolean;
  selectiveAck?: boolean;
  timestamp?: boolean;
  ttl?: number;
  osGuess?: string;
  confidence?: number;
}

export interface HTTPFingerprint {
  userAgent: string;
  acceptLanguage?: string;
  acceptEncoding?: string;
  acceptCharset?: string;
  connection?: string;
  cacheControl?: string;
  pragma?: string;
  dnt?: boolean;
  upgradeInsecureRequests?: boolean;
  secFetchSite?: string;
  secFetchMode?: string;
  secFetchUser?: string;
  secFetchDest?: string;
  browserGuess?: string;
  osGuess?: string;
  confidence?: number;
}

export interface TLSFingerprint {
  version?: string;
  cipherSuites?: string[];
  extensions?: string[];
  curves?: string[];
  pointFormats?: string[];
  signatureAlgorithms?: string[];
  ja3Hash?: string;
  confidence?: number;
}

export interface NetworkFingerprint {
  tcp?: TCPFingerprint;
  http?: HTTPFingerprint;
  tls?: TLSFingerprint;
  overallOsGuess?: string;
  overallBrowserGuess?: string;
  overallConfidence?: number;
  deviceType?: 'desktop' | 'mobile' | 'tablet' | 'server' | 'bot' | 'unknown';
  analysisTimestamp: string;
}

export class FingerprintingService {
  /**
   * Perform comprehensive network fingerprinting
   */
  static async performFingerprinting(req: Request, ipAddress: string): Promise<NetworkFingerprint> {
    try {
      logger.info('Starting network fingerprinting', { ipAddress });

      // Analyze HTTP headers for fingerprinting
      const httpFingerprint = this.analyzeHTTPHeaders(req);

      // Analyze TCP characteristics (limited in HTTP context)
      const tcpFingerprint = this.analyzeTCPCharacteristics(req, ipAddress);

      // Analyze TLS characteristics if available
      const tlsFingerprint = this.analyzeTLSCharacteristics(req);

      // Combine fingerprints for overall assessment
      const overallAssessment = this.combineFingerprints(httpFingerprint, tcpFingerprint, tlsFingerprint);

      const fingerprint: NetworkFingerprint = {
        http: httpFingerprint,
        tcp: tcpFingerprint,
        tls: tlsFingerprint,
        ...overallAssessment,
        analysisTimestamp: new Date().toISOString()
      };

      logger.info('Network fingerprinting completed', {
        ipAddress,
        osGuess: fingerprint.overallOsGuess,
        browserGuess: fingerprint.overallBrowserGuess,
        deviceType: fingerprint.deviceType,
        confidence: fingerprint.overallConfidence
      });

      return fingerprint;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Network fingerprinting failed', { ipAddress, error: errorMessage });
      throw error;
    }
  }

  /**
   * Analyze HTTP headers for fingerprinting
   */
  private static analyzeHTTPHeaders(req: Request): HTTPFingerprint {
    const userAgent = req.get('User-Agent') || '';
    const acceptLanguage = req.get('Accept-Language');
    const acceptEncoding = req.get('Accept-Encoding');
    const acceptCharset = req.get('Accept-Charset');
    const connection = req.get('Connection');
    const cacheControl = req.get('Cache-Control');
    const pragma = req.get('Pragma');
    const dnt = req.get('DNT') === '1';
    const upgradeInsecureRequests = req.get('Upgrade-Insecure-Requests') === '1';
    const secFetchSite = req.get('Sec-Fetch-Site');
    const secFetchMode = req.get('Sec-Fetch-Mode');
    const secFetchUser = req.get('Sec-Fetch-User');
    const secFetchDest = req.get('Sec-Fetch-Dest');

    // Analyze User-Agent for OS and browser detection
    const { browserGuess, osGuess, confidence } = this.analyzeUserAgent(userAgent);

    const fingerprint: HTTPFingerprint = {
      userAgent,
      dnt,
      upgradeInsecureRequests,
      confidence
    };

    if (browserGuess) fingerprint.browserGuess = browserGuess;
    if (osGuess) fingerprint.osGuess = osGuess;

    if (acceptLanguage) fingerprint.acceptLanguage = acceptLanguage;
    if (acceptEncoding) fingerprint.acceptEncoding = acceptEncoding;
    if (acceptCharset) fingerprint.acceptCharset = acceptCharset;
    if (connection) fingerprint.connection = connection;
    if (cacheControl) fingerprint.cacheControl = cacheControl;
    if (pragma) fingerprint.pragma = pragma;
    if (secFetchSite) fingerprint.secFetchSite = secFetchSite;
    if (secFetchMode) fingerprint.secFetchMode = secFetchMode;
    if (secFetchUser) fingerprint.secFetchUser = secFetchUser;
    if (secFetchDest) fingerprint.secFetchDest = secFetchDest;

    return fingerprint;
  }

  /**
   * Analyze User-Agent string for OS and browser detection
   */
  private static analyzeUserAgent(userAgent: string): {
    browserGuess?: string;
    osGuess?: string;
    confidence: number;
  } {
    if (!userAgent) {
      return { confidence: 0 };
    }

    const ua = userAgent.toLowerCase();
    let browserGuess = 'Unknown';
    let osGuess = 'Unknown';
    let confidence = 50;

    // Browser detection
    if (ua.includes('chrome') && !ua.includes('edg')) {
      browserGuess = 'Chrome';
      confidence += 20;
    } else if (ua.includes('firefox')) {
      browserGuess = 'Firefox';
      confidence += 20;
    } else if (ua.includes('safari') && !ua.includes('chrome')) {
      browserGuess = 'Safari';
      confidence += 20;
    } else if (ua.includes('edg')) {
      browserGuess = 'Edge';
      confidence += 20;
    } else if (ua.includes('opera') || ua.includes('opr')) {
      browserGuess = 'Opera';
      confidence += 15;
    } else if (ua.includes('curl')) {
      browserGuess = 'cURL';
      confidence += 25;
    } else if (ua.includes('wget')) {
      browserGuess = 'Wget';
      confidence += 25;
    } else if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
      browserGuess = 'Bot/Crawler';
      confidence += 30;
    }

    // OS detection
    if (ua.includes('windows nt 10.0')) {
      osGuess = 'Windows 10/11';
      confidence += 15;
    } else if (ua.includes('windows nt 6.3')) {
      osGuess = 'Windows 8.1';
      confidence += 15;
    } else if (ua.includes('windows nt 6.1')) {
      osGuess = 'Windows 7';
      confidence += 15;
    } else if (ua.includes('windows')) {
      osGuess = 'Windows';
      confidence += 10;
    } else if (ua.includes('mac os x') || ua.includes('macos')) {
      osGuess = 'macOS';
      confidence += 15;
    } else if (ua.includes('iphone os')) {
      osGuess = 'iOS';
      confidence += 15;
    } else if (ua.includes('android')) {
      osGuess = 'Android';
      confidence += 15;
    } else if (ua.includes('linux')) {
      osGuess = 'Linux';
      confidence += 10;
    } else if (ua.includes('ubuntu')) {
      osGuess = 'Ubuntu Linux';
      confidence += 15;
    } else if (ua.includes('centos')) {
      osGuess = 'CentOS Linux';
      confidence += 15;
    }

    const result: { browserGuess?: string; osGuess?: string; confidence: number } = {
      confidence: Math.min(confidence, 100)
    };

    if (browserGuess !== 'Unknown') result.browserGuess = browserGuess;
    if (osGuess !== 'Unknown') result.osGuess = osGuess;

    return result;
  }

  /**
   * Analyze TCP characteristics (limited in HTTP context)
   */
  private static analyzeTCPCharacteristics(req: Request, _ipAddress: string): TCPFingerprint {
    // In HTTP context, we have limited TCP information
    // This would be more comprehensive with raw socket access

    // const isIPv6 = isIP(ipAddress) === 6; // Not used currently
    let ttlGuess = 64; // Default Linux/Unix TTL
    let osGuess = 'Unknown';
    let confidence = 30; // Low confidence without raw packet data

    // Estimate TTL and OS based on common patterns
    if (req.get('User-Agent')?.toLowerCase().includes('windows')) {
      ttlGuess = 128; // Windows default TTL
      osGuess = 'Windows';
      confidence = 40;
    } else if (req.get('User-Agent')?.toLowerCase().includes('mac')) {
      ttlGuess = 64; // macOS default TTL
      osGuess = 'macOS';
      confidence = 40;
    }

    const fingerprint: TCPFingerprint = {
      ttl: ttlGuess,
      confidence
    };

    if (osGuess !== 'Unknown') fingerprint.osGuess = osGuess;

    return fingerprint;
  }

  /**
   * Analyze TLS characteristics
   */
  private static analyzeTLSCharacteristics(req: Request): TLSFingerprint {
    // TLS analysis is limited in Express.js context
    // This would require access to the TLS handshake data

    const isSecure = req.secure;
    if (!isSecure) {
      return { confidence: 0 };
    }

    // Basic TLS information from request
    const tlsVersion = (req.socket as any).getProtocol?.() || 'Unknown';
    const cipher = (req.socket as any).getCipher?.();

    const fingerprint: TLSFingerprint = {
      confidence: 30 // Low confidence without full handshake data
    };

    if (tlsVersion !== 'Unknown') fingerprint.version = tlsVersion;
    if (cipher) fingerprint.cipherSuites = [cipher.name];

    return fingerprint;
  }

  /**
   * Combine fingerprints for overall assessment
   */
  private static combineFingerprints(
    http?: HTTPFingerprint,
    tcp?: TCPFingerprint,
    tls?: TLSFingerprint
  ): {
    overallOsGuess?: string;
    overallBrowserGuess?: string;
    overallConfidence: number;
    deviceType: 'desktop' | 'mobile' | 'tablet' | 'server' | 'bot' | 'unknown';
  } {
    // Combine OS guesses with confidence weighting
    const osGuesses: { guess: string; confidence: number }[] = [];
    if (http?.osGuess) osGuesses.push({ guess: http.osGuess, confidence: http.confidence || 0 });
    if (tcp?.osGuess) osGuesses.push({ guess: tcp.osGuess, confidence: tcp.confidence || 0 });

    const overallOsGuess = this.selectBestGuess(osGuesses);

    // Browser guess comes primarily from HTTP
    const overallBrowserGuess = http?.browserGuess;

    // Calculate overall confidence
    const confidences = [http?.confidence, tcp?.confidence, tls?.confidence].filter(c => c !== undefined) as number[];
    const overallConfidence =
      confidences.length > 0 ? Math.round(confidences.reduce((sum, c) => sum + c, 0) / confidences.length) : 0;

    // Determine device type
    const deviceType = this.determineDeviceType(http?.userAgent || '', overallOsGuess);

    const result: {
      overallOsGuess?: string;
      overallBrowserGuess?: string;
      overallConfidence: number;
      deviceType: 'desktop' | 'mobile' | 'tablet' | 'server' | 'bot' | 'unknown';
    } = {
      overallConfidence,
      deviceType
    };

    if (overallOsGuess) result.overallOsGuess = overallOsGuess;
    if (overallBrowserGuess) result.overallBrowserGuess = overallBrowserGuess;

    return result;
  }

  /**
   * Select the best guess from multiple options
   */
  private static selectBestGuess(guesses: { guess: string; confidence: number }[]): string | undefined {
    if (guesses.length === 0) return undefined;

    const sorted = guesses.sort((a, b) => b.confidence - a.confidence);
    return sorted[0]?.guess;
  }

  /**
   * Determine device type based on user agent and OS
   */
  private static determineDeviceType(
    userAgent: string,
    osGuess?: string
  ): 'desktop' | 'mobile' | 'tablet' | 'server' | 'bot' | 'unknown' {
    const ua = userAgent.toLowerCase();

    // Bot detection
    if (
      ua.includes('bot') ||
      ua.includes('crawler') ||
      ua.includes('spider') ||
      ua.includes('curl') ||
      ua.includes('wget') ||
      ua.includes('python-requests')
    ) {
      return 'bot';
    }

    // Mobile detection
    if (ua.includes('mobile') || ua.includes('iphone') || (ua.includes('android') && ua.includes('mobile'))) {
      return 'mobile';
    }

    // Tablet detection
    if (ua.includes('tablet') || ua.includes('ipad') || (ua.includes('android') && !ua.includes('mobile'))) {
      return 'tablet';
    }

    // Server detection
    if (
      osGuess?.toLowerCase().includes('linux') &&
      (ua.includes('server') || ua.includes('centos') || ua.includes('ubuntu'))
    ) {
      return 'server';
    }

    // Desktop detection
    if (
      osGuess?.toLowerCase().includes('windows') ||
      osGuess?.toLowerCase().includes('macos') ||
      osGuess?.toLowerCase().includes('linux')
    ) {
      return 'desktop';
    }

    return 'unknown';
  }
}
