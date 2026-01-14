import { consoleLogger, Logger, LogMetadata } from './console-logger';

/**
 * Central logging utility.
 * Swap implementations here to integrate third-party services (Sentry, log drain, etc.).
 */
class LoggingService implements Logger {
  private impl: Logger;

  constructor(impl: Logger) {
    this.impl = impl;
  }

  info(message: string, meta?: LogMetadata) {
    this.impl.info(message, meta);
  }

  warn(message: string, meta?: LogMetadata) {
    this.impl.warn(message, meta);
  }

  error(message: string, meta?: LogMetadata) {
    this.impl.error(message, meta);
  }
}

export const logger = new LoggingService(consoleLogger);

export type { Logger, LogMetadata } from './console-logger';
