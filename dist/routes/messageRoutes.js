import { Router } from 'express';
import { MessageController } from '@/controllers/index.js';
import { authenticateApiKey } from '@/middleware/index.js';
const router = Router();
console.log('MessageRoutes: Setting up routes...');
router.post('/:sessionId/messages/send', authenticateApiKey, MessageController.sendMessage);
router.post('/:sessionId/messages/send/bulk', authenticateApiKey, MessageController.sendBulkMessages);
router.post('/:sessionId/messages/poll', authenticateApiKey, MessageController.sendPoll);
router.get('/:sessionId/chats/:jid?', authenticateApiKey, MessageController.getChatHistory);
router.get('/:sessionId/contacts', authenticateApiKey, MessageController.getContacts);
console.log('About to register groups route...');
console.log('MessageController.getGroups exists:', typeof MessageController.getGroups);
router.get('/:sessionId/groups', authenticateApiKey, MessageController.getGroups);
console.log('Groups route registered successfully');
console.log('MessageRoutes: Groups route registered at /:sessionId/groups');
export { router as messageRoutes };
//# sourceMappingURL=messageRoutes.js.map