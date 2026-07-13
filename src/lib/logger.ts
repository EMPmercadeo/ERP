type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogContext {
  userId?: string;
  empresaId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private formatLog(level: LogLevel, message: string, context?: LogContext, error?: any) {
    const timestamp = new Date().toISOString();
    const isProd = process.env.NODE_ENV === 'production';

    const logPayload: any = {
      timestamp,
      level,
      message,
      env: process.env.NODE_ENV,
    };

    if (context) {
      const { userId, empresaId, requestId, ...meta } = context;
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
      const contextStr = context && Object.keys(context).length > 0 
        ? ` | Context: ${JSON.stringify(context)}` 
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

  error(message: string, error?: any, context?: LogContext) {
    console.error(this.formatLog('ERROR', message, context, error));
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV !== 'production' || process.env.DEBUG_LOGS === 'true') {
      console.log(this.formatLog('DEBUG', message, context));
    }
  }
}

export const logger = new Logger();
