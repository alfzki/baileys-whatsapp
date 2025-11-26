import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '@/types/index.js';

/**
 * API Key Authentication Middleware
 * Validates API key from headers before allowing access to protected routes
 */
export const authenticateApiKey = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string || 
                 req.headers['authorization']?.toString().replace('Bearer ', '');
  
  if (!apiKey) {
    res.status(401).json({
      success: false,
      message: 'API key is required'
    });
    return;
  }
  
  const validApiKeys = process.env.API_KEYS ? 
    process.env.API_KEYS.split(',') : 
    ['farabimusic'];
  
  if (!validApiKeys.includes(apiKey)) {
    res.status(401).json({
      success: false,
      message: 'Invalid API key'
    });
    return;
  }
  
  // Add API key to request for later use
  (req as AuthenticatedRequest).apiKey = apiKey;
  next();
};

/**
 * Optional API Key Authentication Middleware
 * Validates API key if present but doesn't require it
 */
export const optionalAuth = (
  req: Request, 
  res: Response, 
  next: NextFunction
): void => {
  const apiKey = req.headers['x-api-key'] as string || 
                 req.headers['authorization']?.toString().replace('Bearer ', '');
  
  if (apiKey) {
    const validApiKeys = process.env.API_KEYS ? 
      process.env.API_KEYS.split(',') : 
      ['farabimusic'];
    
    if (validApiKeys.includes(apiKey)) {
      (req as AuthenticatedRequest).apiKey = apiKey;
    }
  }
  
  next();
}; 