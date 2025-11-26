import { Router } from 'express';
import { LegacyController } from '@/controllers/index.js';
import { authenticateApiKey } from '@/middleware/index.js';
const router = Router();
router.get('/status', LegacyController.getStatus);
router.get('/qr', authenticateApiKey, LegacyController.getQR);
export { router as legacyRoutes };
//# sourceMappingURL=legacyRoutes.js.map