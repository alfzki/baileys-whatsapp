import express from 'express';
import { config } from 'dotenv';
import { sessionRoutes, messageRoutes, legacyRoutes } from '@/routes/index.js';
import { errorHandler, notFoundHandler, requestLogger, corsHeaders } from '@/middleware/index.js';
import { DatabaseService } from '@/services/index.js';
import { WhatsAppService } from '@/services/index.js';
config();
const app = express();
app.use(express.json());
app.use(requestLogger);
app.use(corsHeaders);
app.use('/', sessionRoutes);
app.use('/', messageRoutes);
app.use('/', legacyRoutes);
console.log('=== REGISTERED ROUTES ===');
app._router.stack.forEach((middleware) => {
    if (middleware.route) {
        console.log(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    }
    else if (middleware.name === 'router') {
        middleware.handle.stack.forEach((handler) => {
            if (handler.route) {
                console.log(`${Object.keys(handler.route.methods).join(',').toUpperCase()} ${handler.route.path}`);
            }
        });
    }
});
console.log('========================');
app.use(notFoundHandler);
app.use(errorHandler);
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, async () => {
    console.log(`WhatsApp Multi-Session API Server running on port ${PORT}`);
    console.log('Server ready for session management');
    try {
        const sessionsHistory = await DatabaseService.getSessionsHistory(1, 100);
        const activeSessions = sessionsHistory.data.filter(session => session.status === 'connected' || session.status === 'authenticated');
        if (activeSessions.length > 0) {
            console.log(`Found ${activeSessions.length} previously active sessions, attempting to restore...`);
            for (const session of activeSessions) {
                try {
                    console.log(`Restoring session: ${session.sessionId}`);
                    await WhatsAppService.createConnection(session.sessionId);
                }
                catch (error) {
                    console.error(`Failed to restore session ${session.sessionId}:`, error);
                }
            }
        }
    }
    catch (error) {
        console.error('Error during auto-restore:', error);
    }
});
const gracefulShutdown = async () => {
    console.log('Shutting down gracefully...');
    server.close(async () => {
        console.log('HTTP server closed');
        try {
            await DatabaseService.disconnect();
            console.log('Database connection closed');
            process.exit(0);
        }
        catch (error) {
            console.error('Error during shutdown:', error);
            process.exit(1);
        }
    });
    setTimeout(() => {
        console.error('Could not close connections in time, forcefully shutting down');
        process.exit(1);
    }, 10000);
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown();
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    gracefulShutdown();
});
export default app;
//# sourceMappingURL=app.js.map