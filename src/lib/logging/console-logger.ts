/**
 * Console logger implementation (MVP).
 * Emits structured JSON in production and pretty output in development.
 */

type LogLevel = 'info' | 'warn' | 'error';

export interface LogMetadata {
  [key: string]: unknown;
}

export interface Logger {
  info(message: string, meta?: LogMetadata): void;
  warn(message: string, meta?: LogMetadata): void;
  error(message: string, meta?: LogMetadata): void;
}

function output(level: LogLevel, message: string, meta?: LogMetadata) {
  const payload = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...meta,
  };

  if (process.env.NODE_ENV === 'development') {
    const pretty = `${payload.timestamp} [${level.toUpperCase()}] ${message}`;
    console[level](pretty, meta ?? '');
  } else {
    console[level](JSON.stringify(payload));
  }
}

export const consoleLogger: Logger = {
  info: (message, meta) => output('info', message, meta),
  warn: (message, meta) => output('warn', message, meta),
  error: (message, meta) => output('error', message, meta),
};
