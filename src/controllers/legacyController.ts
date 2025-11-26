import { Request, Response } from 'express';
import { WhatsAppService } from '@/services/index.js';
import { getSessionStatus } from '@/utils/index.js';
import { asyncHandler } from '@/middleware/index.js';

/**
 * Legacy Controller
 * Handles backward compatibility endpoints
 */
export class LegacyController {
  /**
   * GET /status - Backward compatibility status endpoint
   */
  static getStatus = asyncHandler(async (req: Request, res: Response) => {
    const sessions = WhatsAppService.getSessions();
    const activeSessions = Array.from(sessions.entries()).map(([id, data]) => ({
      id,
      status: getSessionStatus(id, sessions),
      isAuthenticated: data.isAuthenticated
    }));
    
    res.json({
      success: true,
      sessions: activeSessions,
      totalSessions: sessions.size
    });
  });

  /**
   * GET /qr - Backward compatibility QR endpoint
   */
  static getQR = asyncHandler(async (req: Request, res: Response) => {
    const { sessionId } = req.query;
    
    if (!sessionId || typeof sessionId !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }
    
    const sessions = WhatsAppService.getSessions();
    const sessionQRs = WhatsAppService.getSessionQRs();
    const qr = sessionQRs.get(sessionId);
    
    if (qr) {
      res.json({
        success: true,
        qr,
        message: 'Scan QR code dengan WhatsApp Anda',
        sessionId
      });
    } else if (sessions.has(sessionId) && sessions.get(sessionId)!.isAuthenticated) {
      res.json({
        success: true,
        message: 'WhatsApp sudah terhubung',
        sessionId
      });
    } else {
      res.json({
        success: false,
        message: 'QR code belum tersedia, tunggu sebentar...',
        sessionId
      });
    }
  });
} 