import { Router } from 'express';
import { SessionController } from '@/controllers/index.js';
import { authenticateApiKey } from '@/middleware/index.js';

const router = Router();

// Session management routes
router.get('/sessions', authenticateApiKey, SessionController.listSessions);
router.get('/sessions/:sessionId', authenticateApiKey, SessionController.findSession);
router.get('/sessions/:sessionId/status', authenticateApiKey, SessionController.getSessionStatus);
router.get('/sessions/:sessionId/qr', authenticateApiKey, SessionController.getQRCode);
router.get('/sessions/:sessionId/credentials', authenticateApiKey, SessionController.getCredentials);
router.post('/sessions/add', authenticateApiKey, SessionController.addSession);
router.delete('/sessions/:sessionId', authenticateApiKey, SessionController.deleteSession);

// Session history route
router.get('/sessions-history', authenticateApiKey, SessionController.getSessionsHistory);

export { router as sessionRoutes }; 