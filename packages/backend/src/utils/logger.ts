import winston from 'winston';

const NODE_ENV = process.env.NODE_ENV ?? 'development';
const LOG_LEVEL = process.env.LOG_LEVEL ?? (NODE_ENV === 'production' ? 'info' : 'debug');

// Custom log format
const logFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
  }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.prettyPrint()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({
    format: 'HH:mm:ss'
  }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    // Add metadata if present
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta, null, 2)}`;
    }
    
    return log;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: LOG_LEVEL,
  format: logFormat,
  defaultMeta: {
    service: 'ip-probe-backend',
    environment: NODE_ENV
  },
  transports: [
    // Console transport for development
    new winston.transports.Console({
      format: NODE_ENV === 'development' ? consoleFormat : logFormat,
      handleExceptions: true,
      handleRejections: true
    })
  ],
  exitOnError: false
});

// Add file transports for production
if (NODE_ENV === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  }));

  logger.add(new winston.transports.File({
    filename: 'logs/combined.log',
    maxsize: 5242880, // 5MB
    maxFiles: 5,
    format: logFormat
  }));
}

// Create a stream object for Morgan HTTP request logging
export const loggerStream = {
  write: (message: string): void => {
    logger.info(message.trim());
  }
};

// Helper functions for structured logging
export const logRequest = (req: any, res: any, responseTime: number): void => {
  logger.info('HTTP Request', {
    method: req.method,
    url: req.url,
    statusCode: res.statusCode,
    responseTime: `${responseTime}ms`,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    contentLength: res.get('Content-Length')
  });
};

export const logError = (error: Error, req?: any): void => {
  logger.error('Application Error', {
    message: error.message,
    stack: error.stack,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent')
  });
};

export const logSecurity = (event: string, details: Record<string, any>, req?: any): void => {
  logger.warn('Security Event', {
    event,
    ...details,
    url: req?.url,
    method: req?.method,
    ip: req?.ip,
    userAgent: req?.get('User-Agent'),
    timestamp: new Date().toISOString()
  });
};
