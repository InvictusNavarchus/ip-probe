import { Request, Response, NextFunction } from 'express';
import { logRequest, logSecurity } from '@/utils/logger';

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();

  // Generate request ID
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-ID', requestId);

  // Log security events
  const suspiciousPatterns = [
    /\.\./,  // Directory traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /javascript:/i,  // JavaScript protocol
    /vbscript:/i,  // VBScript protocol
    /onload=/i,  // Event handlers
    /onerror=/i,  // Event handlers
    /eval\(/i,  // Code evaluation
    /expression\(/i,  // CSS expression
    /import\(/i  // Dynamic imports
  ];

  const url = req.url.toLowerCase();
  const userAgent = req.get('User-Agent') ?? '';
  const referer = req.get('Referer') ?? '';

  // Check for suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)
  );

  if (isSuspicious) {
    logSecurity('Suspicious request detected', {
      url: req.url,
      userAgent,
      referer,
      patterns: suspiciousPatterns.filter(pattern => 
        pattern.test(url) || pattern.test(userAgent) || pattern.test(referer)
      ).map(p => p.toString())
    }, req);
  }

  // Check for unusual request sizes
  const contentLength = parseInt(req.get('Content-Length') ?? '0', 10);
  if (contentLength > 10 * 1024 * 1024) { // 10MB
    logSecurity('Large request detected', {
      contentLength,
      maxAllowed: '10MB'
    }, req);
  }

  // Check for unusual headers
  const suspiciousHeaders = [
    'x-forwarded-for',
    'x-real-ip',
    'x-cluster-client-ip',
    'x-forwarded',
    'forwarded-for',
    'forwarded'
  ];

  const forwardedHeaders = suspiciousHeaders.filter(header => req.get(header));
  if (forwardedHeaders.length > 2) {
    logSecurity('Multiple forwarded headers detected', {
      headers: forwardedHeaders.map(h => ({ [h]: req.get(h) }))
    }, req);
  }

  // Override res.end to capture response time and status
  const originalEnd = res.end;
  res.end = function(chunk?: any, encoding?: any): Response {
    const responseTime = Date.now() - startTime;
    
    // Log the request
    logRequest(req, res, responseTime);

    // Log slow requests
    if (responseTime > 5000) { // 5 seconds
      logSecurity('Slow request detected', {
        responseTime: `${responseTime}ms`,
        threshold: '5000ms'
      }, req);
    }

    // Call original end method
    return originalEnd.call(this, chunk, encoding);
  };

  next();
};
