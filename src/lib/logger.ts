type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogContext {
  userId?: string;
  empresaId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private redactSecrets(obj: unknown): unknown {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(item => this.redactSecrets(item));

    const sensitiveKeys = ['password', 'token', 'cookie', 'authorization', 'apikey', 'secret', 'key'];
    const redacted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(s => lowerKey.includes(s))) {
        redacted[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        redacted[key] = this.redactSecrets(value);
      } else {
        redacted[key] = value;
      }
    }
    return redacted;
  }

  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: unknown) {
    const timestamp = new Date().toISOString();
    const isProd = process.env.NODE_ENV === 'production';

    const logPayload: Record<string, unknown> = {
      timestamp,
      level,
      message,
      env: process.env.NODE_ENV,
    };

    if (context) {
      const redactedContext = this.redactSecrets(context) as LogContext;
      const { userId, empresaId, requestId, ...meta } = redactedContext;
      if (userId) logPayload.userId = userId;
      if (empresaId) logPayload.empresaId = empresaId;
      if (requestId) logPayload.requestId = requestId;
      if (Object.keys(meta).length > 0) logPayload.metadata = meta;
    }

    if (error) {
      logPayload.error = {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      };
    }

    if (isProd) {
      // In production, print a single JSON line to stdout/stderr
      return JSON.stringify(logPayload);
    } else {
      // In development, print a human-readable, colorized output
      const colors = {
        INFO: '\x1b[36m',  // Cyan
        WARN: '\x1b[33m',  // Yellow
        ERROR: '\x1b[31m', // Red
        DEBUG: '\x1b[90m', // Gray
        RESET: '\x1b[0m',
      };

      const color = colors[level] || colors.RESET;
      const cleanContext = context ? (this.redactSecrets(context) as LogContext) : null;
      const contextStr = cleanContext && Object.keys(cleanContext).length > 0 
        ? ` | Context: ${JSON.stringify(cleanContext)}` 
        : '';
      const errorStr = error 
        ? `\n${colors.ERROR}${error instanceof Error ? error.stack : String(error)}${colors.RESET}` 
        : '';

      return `[${timestamp}] ${color}${level.padEnd(5)}${colors.RESET} - ${message}${contextStr}${errorStr}`;
    }
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog('INFO', message, context));
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog('WARN', message, context));
  }

  error(message: string, error?: unknown, context?: LogContext) {
    console.error(this.formatLog('ERROR', message, context, error));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGS === 'true') {
      console.log(this.formatLog('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();
