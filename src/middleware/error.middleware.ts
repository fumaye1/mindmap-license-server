import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.utils';

export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public details?: unknown;
  public isOperational: boolean;

  constructor(
    code: string,
    message: string,
    statusCode: number = 500,
    details?: unknown,
    isOperational: boolean = true
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const statusCode = err instanceof AppError ? err.statusCode : 500;
  const message = err.message || 'Internal Server Error';
  const code = err instanceof AppError ? err.code : 'INTERNAL_ERROR';
  const details = err instanceof AppError ? err.details : undefined;

  logger.error({
    error: message,
    code,
    stack: err.stack,
    url: req.url,
    method: req.method,
  });

  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Cannot ${req.method} ${req.url}`,
      details: {
        method: req.method,
        url: req.url,
      },
    },
  });
}
