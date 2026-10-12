import type { LoggerService } from '@nestjs/common';
import { pino } from 'pino';
import type { Logger, DestinationStream } from 'pino';

/** Paths redacted from every log record (credentials, tokens, PII). */
export const REDACT_PATHS = [
  'req.headers.authorization',
  'headers.authorization',
  'authorization',
  'password',
  'token',
  'secret',
  'apiKey',
  'email',
  'phone',
  'fullName',
  '*.password',
  '*.token',
  '*.secret',
  '*.apiKey',
  '*.email',
  '*.phone',
  '*.fullName',
];

export interface LoggerOptions {
  /** Custom destination (tests). When omitted pino writes to stdout. */
  stream?: DestinationStream;
  level?: string;
}

const isPrettyDev = (): boolean => {
  const env = process.env.NODE_ENV;
  return env === undefined || env === 'development';
};

/** Builds the pino logger used by Nest and the GraphQL lifecycle plugin. */
export function createPino(options: LoggerOptions = {}): Logger {
  const pretty = isPrettyDev() && !options.stream;
  const pinoOptions: pino.LoggerOptions = {
    level: options.level ?? 'info',
    base: { service: 'foundly-api' },
    timestamp: pino.stdTimeFunctions.isoTime,
    redact: {
      paths: REDACT_PATHS,
      censor: '[REDACTED]',
    },
    ...(pretty
      ? {
          transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:standard' },
          },
        }
      : {}),
  };
  return options.stream ? pino(pinoOptions, options.stream) : pino(pinoOptions);
}

interface LoggableError {
  message?: string;
  stack?: string;
}

/** Nest `LoggerService` adapter over pino, with sink-level redaction. */
export class FoundlyLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(logger: Logger = createPino()) {
    this.logger = logger;
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.info(message, ...optionalParams);
  }

  info(message: unknown, ...optionalParams: unknown[]): void {
    this.write(this.logger.info.bind(this.logger), message, optionalParams, 'info');
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write(this.logger.error.bind(this.logger), message, optionalParams, 'error');
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write(this.logger.warn.bind(this.logger), message, optionalParams, 'warn');
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write(this.logger.debug.bind(this.logger), message, optionalParams, 'debug');
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write(this.logger.trace.bind(this.logger), message, optionalParams, 'trace');
  }

  private write(
    sink: (obj: Record<string, unknown>, msg?: string) => void,
    message: unknown,
    optionalParams: unknown[],
    level: string,
  ): void {
    const context = typeof optionalParams[optionalParams.length - 1] === 'string'
      ? (optionalParams[optionalParams.length - 1] as string)
      : undefined;

    if (message instanceof Error) {
      const err: LoggableError = { message: message.message, stack: message.stack };
      sink({ err, context, level }, message.message);
      return;
    }
    if (typeof message === 'object' && message !== null) {
      const label = typeof optionalParams[0] === 'string' ? (optionalParams[0] as string) : undefined;
      sink({ ...(message as Record<string, unknown>), context, level }, label);
      return;
    }
    sink({ context, level }, String(message));
  }
}

/** Convenience: the structured Nest-compatible logger for the whole app. */
export function createLogger(options: LoggerOptions = {}): FoundlyLogger {
  return new FoundlyLogger(createPino(options));
}