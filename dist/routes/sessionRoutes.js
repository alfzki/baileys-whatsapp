import { Router } from 'express';
import { SessionController } from '@/controllers/index.js';
import { authenticateApiKey } from '@/middleware/index.js';
const router = Router();
router.get('/sessions', authenticateApiKey, SessionController.listSessions);
router.get('/sessions/:sessionId', authenticateApiKey, SessionController.findSession);
router.get('/sessions/:sessionId/status', authenticateApiKey, SessionController.getSessionStatus);
router.get('/sessions/:sessionId/qr', authenticateApiKey, SessionController.getQRCode);
router.post('/sessions/add', authenticateApiKey, SessionController.addSession);
router.delete('/sessions/:sessionId', authenticateApiKey, SessionController.deleteSession);
router.get('/sessions-history', authenticateApiKey, SessionController.getSessionsHistory);
export { router as sessionRoutes };
//# sourceMappingURL=sessionRoutes.js.map