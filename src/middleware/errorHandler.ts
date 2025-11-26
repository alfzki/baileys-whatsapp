import { Request, Response, NextFunction } from 'express';
import { ErrorResponse } from '@/types/index.js';

/**
 * Global Error Handler Middleware
 * Catches and formats all unhandled errors
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Unhandled error:', error);
  
  const errorResponse: ErrorResponse = {
    success: false,
    message: 'Internal server error',
    error: error.message
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.debug = {
      stack: error.stack,
      url: req.url,
      method: req.method,
      body: req.body,
      params: req.params,
      query: req.query
    };
  }
  
  res.status(500).json(errorResponse);
};

/**
 * Async Error Handler Wrapper
 * Wraps async route handlers to catch promises rejections
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found Handler
 * Handles requests to non-existent routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
}; 