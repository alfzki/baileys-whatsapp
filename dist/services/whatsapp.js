import { DisconnectReason, makeWASocket, fetchLatestBaileysVersion } from '@whiskeysockets/baileys';
import qrcode from 'qrcode';
import fs from 'fs';
import P from 'pino';
import { extractPhoneNumber } from '@/utils/index.js';
import { useDatabaseAuthState } from '@/utils/databaseAuth.js';
import { DatabaseService } from './database.js';
const logger = P({ level: 'silent' });
export class WhatsAppService {
    static getSessions() {
        return this.sessions;
    }
    static getSessionQRs() {
        return this.sessionQRs;
    }
    static async createConnection(sessionId, options = {}) {
        try {
            if (this.sessions.has(sessionId)) {
                const existingSession = this.sessions.get(sessionId);
                if (existingSession.isAuthenticated) {
                    console.log(`[${sessionId}] Session already authenticated, skipping creation`);
                    return existingSession;
                }
                console.log(`[${sessionId}] Cleaning up existing socket before recreating`);
                if (existingSession.socket) {
                    try {
                        existingSession.socket.end(undefined);
                        existingSession.socket.ws.close();
                        await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                    catch (error) {
                        console.error(`[${sessionId}] Error ending existing socket:`, error);
                    }
                }
                this.sessions.delete(sessionId);
                this.sessionQRs.delete(sessionId);
            }
            const authDir = `auth_info_${sessionId}`;
            if (fs.existsSync(authDir)) {
                console.log(`[${sessionId}] Removing legacy auth directory: ${authDir}`);
                fs.rmSync(authDir, { recursive: true, force: true });
            }
            const { state, saveCreds, clearAuth, cleanup } = await useDatabaseAuthState(sessionId);
            await DatabaseService.createSessionRecord(sessionId);
            const { version, isLatest } = await fetchLatestBaileysVersion();
            console.log(`[${sessionId}] Using WA version ${version.join('.')}, isLatest: ${isLatest}`);
            const socket = makeWASocket({
                auth: state,
                logger,
                browser: ['WhatsApp Multi-Session API', 'Chrome', '4.0.0'],
                version,
                defaultQueryTimeoutMs: 60000,
                keepAliveIntervalMs: 30000,
                connectTimeoutMs: 60000,
                qrTimeout: 60000,
                emitOwnEvents: true,
                fireInitQueries: true,
                generateHighQualityLinkPreview: true,
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: false,
                retryRequestDelayMs: 250,
                maxMsgRetryCount: 5,
                getMessage: async () => undefined,
                ...options
            });
            const sessionData = {
                socket,
                isAuthenticated: false,
                authDir: `db_auth_${sessionId}`,
                status: 'connecting',
                startTime: Date.now(),
                cleanup
            };
            this.sessions.set(sessionId, sessionData);
            this.setupEventHandlers(sessionId, socket, sessionData, saveCreds, clearAuth);
            return sessionData;
        }
        catch (error) {
            console.error(`[${sessionId}] Error creating WhatsApp connection:`, error);
            this.sessions.delete(sessionId);
            this.sessionQRs.delete(sessionId);
            throw error;
        }
    }
    static setupEventHandlers(sessionId, socket, sessionData, saveCreds, clearAuth) {
        let reconnectAttempts = 0;
        const maxReconnectAttempts = 3;
        socket.ev.on('connection.update', async (update) => {
            const { connection, lastDisconnect, qr, isNewLogin, isOnline } = update;
            console.log(`[${sessionId}] Connection update:`, {
                connection,
                isNewLogin,
                isOnline,
                hasQR: !!qr,
                lastDisconnect: lastDisconnect?.error?.message
            });
            if (qr) {
                console.log(`[${sessionId}] QR Code received, generating data URL...`);
                try {
                    const qrImage = await qrcode.toDataURL(qr, {
                        margin: 2,
                        width: 256,
                        color: {
                            dark: '#000000',
                            light: '#FFFFFF'
                        }
                    });
                    this.sessionQRs.set(sessionId, qrImage);
                    await DatabaseService.updateSessionStatus(sessionId, 'waiting_qr_scan');
                    console.log(`[${sessionId}] QR Code generated and stored`);
                }
                catch (qrError) {
                    console.error(`[${sessionId}] Error generating QR code:`, qrError);
                }
            }
            if (connection === 'close') {
                const statusCode = lastDisconnect?.error?.output?.statusCode;
                const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
                console.log(`[${sessionId}] Connection closed:`, {
                    statusCode,
                    reason: Object.keys(DisconnectReason).find(key => DisconnectReason[key] === statusCode),
                    shouldReconnect,
                    error: lastDisconnect?.error?.message
                });
                await DatabaseService.updateSessionStatus(sessionId, 'disconnected');
                sessionData.isAuthenticated = false;
                this.sessionQRs.delete(sessionId);
                if (shouldReconnect && reconnectAttempts < maxReconnectAttempts) {
                    reconnectAttempts++;
                    console.log(`[${sessionId}] Attempting reconnection ${reconnectAttempts}/${maxReconnectAttempts} in 5 seconds...`);
                    setTimeout(async () => {
                        console.log(`[${sessionId}] Reconnecting...`);
                        try {
                            const existingSession = this.sessions.get(sessionId);
                            if (existingSession?.socket) {
                                try {
                                    existingSession.socket.end(undefined);
                                    existingSession.socket.ws.close();
                                }
                                catch (e) {
                                    console.log(`[${sessionId}] Error closing old socket:`, e);
                                }
                            }
                            await this.createConnection(sessionId, {});
                        }
                        catch (error) {
                            console.error(`[${sessionId}] Reconnection failed:`, error);
                        }
                    }, 5000);
                }
                else if (reconnectAttempts >= maxReconnectAttempts) {
                    console.log(`[${sessionId}] Max reconnection attempts reached, stopping reconnection`);
                    if (sessionData.cleanup)
                        sessionData.cleanup();
                    this.sessions.delete(sessionId);
                    this.sessionQRs.delete(sessionId);
                }
                else {
                    console.log(`[${sessionId}] Session logged out, cleaning up...`);
                    if (sessionData.cleanup)
                        sessionData.cleanup();
                    this.sessions.delete(sessionId);
                    this.sessionQRs.delete(sessionId);
                    await clearAuth();
                }
            }
            else if (connection === 'connecting') {
                console.log(`[${sessionId}] Connecting to WhatsApp...`);
                await DatabaseService.updateSessionStatus(sessionId, 'connecting');
            }
            else if (connection === 'open') {
                console.log(`[${sessionId}] WhatsApp connection opened successfully`);
                sessionData.isAuthenticated = true;
                reconnectAttempts = 0;
                this.sessionQRs.delete(sessionId);
                await DatabaseService.updateSessionStatus(sessionId, 'connected');
                try {
                    const info = socket.user;
                    console.log(`[${sessionId}] Authenticated as:`, {
                        id: info?.id,
                        name: info?.name,
                        isOnline
                    });
                }
                catch (error) {
                    console.log(`[${sessionId}] Could not get user info:`, error.message);
                }
            }
        });
        socket.ev.on('creds.update', async () => {
            try {
                await saveCreds();
                console.log(`[${sessionId}] Credentials updated and saved to database`);
            }
            catch (error) {
                console.error(`[${sessionId}] Error saving credentials:`, error);
            }
        });
        socket.ev.on('lid-mapping.update', async (update) => {
            try {
                console.log(`[${sessionId}] LID mapping update:`, update);
            }
            catch (error) {
                console.error(`[${sessionId}] Error handling LID mapping update:`, error);
            }
        });
        socket.ev.on('messages.upsert', async (messageUpdate) => {
            const { messages } = messageUpdate;
            for (const message of messages) {
                if (message.key.fromMe)
                    continue;
                const jid = message.key.remoteJid;
                const altJid = message.key.remoteJidAlt || message.key.participantAlt;
                const preferredJid = altJid || jid;
                const phoneNumber = preferredJid?.replace('@s.whatsapp.net', '').replace('@g.us', '').replace('@lid', '');
                if (!phoneNumber)
                    continue;
                let messageText = '';
                let messageType = 'unknown';
                let metadata = {};
                if (message.message?.conversation) {
                    messageText = message.message.conversation;
                    messageType = 'text';
                }
                else if (message.message?.extendedTextMessage?.text) {
                    messageText = message.message.extendedTextMessage.text;
                    messageType = 'text';
                }
                else if (message.message?.imageMessage) {
                    messageText = message.message.imageMessage.caption || '[Image]';
                    messageType = 'image';
                    metadata = {
                        mimetype: message.message.imageMessage.mimetype,
                        fileLength: message.message.imageMessage.fileLength
                    };
                }
                else if (message.message?.documentMessage) {
                    messageText = message.message.documentMessage.title || '[Document]';
                    messageType = 'document';
                    metadata = {
                        fileName: message.message.documentMessage.fileName,
                        mimetype: message.message.documentMessage.mimetype,
                        fileLength: message.message.documentMessage.fileLength
                    };
                }
                else if (message.message?.audioMessage) {
                    messageText = '[Audio]';
                    messageType = 'audio';
                    metadata = {
                        mimetype: message.message.audioMessage.mimetype,
                        seconds: message.message.audioMessage.seconds
                    };
                }
                await DatabaseService.saveChatHistory(sessionId, phoneNumber, messageText, messageType, 'incoming', metadata);
            }
        });
    }
    static async sendMessage(sessionId, jid, message, options = {}) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) {
            throw new Error('Session not found. Please create a new session.');
        }
        if (!sessionData.isAuthenticated || !sessionData.socket) {
            throw new Error('Session not authenticated. Please reconnect the session.');
        }
        const socketState = sessionData.socket.ws?.readyState;
        if (socketState !== 1) {
            console.error(`[${sessionId}] Socket not ready, state: ${socketState}`);
            sessionData.isAuthenticated = false;
            throw new Error('WhatsApp connection is not ready. Please wait for reconnection or restart the session.');
        }
        try {
            const result = await sessionData.socket.sendMessage(jid, message, options);
            const phoneNumber = extractPhoneNumber(jid);
            const messageText = message.text || JSON.stringify(message);
            await DatabaseService.saveChatHistory(sessionId, phoneNumber, messageText, 'text', 'outgoing');
            return result;
        }
        catch (error) {
            if (error?.message?.includes('Connection Closed') || error?.output?.statusCode === 428) {
                console.error(`[${sessionId}] Connection closed during message send, marking session as disconnected`);
                sessionData.isAuthenticated = false;
                throw new Error('WhatsApp connection was closed. The session will attempt to reconnect automatically.');
            }
            throw error;
        }
    }
    static async sendPoll(sessionId, jid, name, options, selectableCount = 1) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) {
            throw new Error('Session not found. Please create a new session.');
        }
        if (!sessionData.isAuthenticated || !sessionData.socket) {
            throw new Error('Session not authenticated. Please reconnect the session.');
        }
        const socketState = sessionData.socket.ws?.readyState;
        if (socketState !== 1) {
            console.error(`[${sessionId}] Socket not ready for poll, state: ${socketState}`);
            sessionData.isAuthenticated = false;
            throw new Error('WhatsApp connection is not ready. Please wait for reconnection or restart the session.');
        }
        const pollMessage = {
            poll: {
                name: name,
                values: options,
                selectableCount: selectableCount
            }
        };
        try {
            const result = await sessionData.socket.sendMessage(jid, pollMessage);
            const phoneNumber = extractPhoneNumber(jid);
            const messageText = `Poll: ${name} - Options: ${options.join(', ')}`;
            await DatabaseService.saveChatHistory(sessionId, phoneNumber, messageText, 'poll', 'outgoing');
            return result;
        }
        catch (error) {
            if (error?.message?.includes('Connection Closed') || error?.output?.statusCode === 428) {
                console.error(`[${sessionId}] Connection closed during poll send, marking session as disconnected`);
                sessionData.isAuthenticated = false;
                throw new Error('WhatsApp connection was closed. The session will attempt to reconnect automatically.');
            }
            throw error;
        }
    }
    static async getGroups(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        if (!sessionData) {
            throw new Error('Session not found. Please create a new session.');
        }
        if (!sessionData.isAuthenticated || !sessionData.socket) {
            throw new Error('Session not authenticated. Please reconnect the session.');
        }
        const socketState = sessionData.socket.ws?.readyState;
        if (socketState !== 1) {
            console.error(`[${sessionId}] Socket not ready for getGroups, state: ${socketState}`);
            sessionData.isAuthenticated = false;
            throw new Error('WhatsApp connection is not ready. Please wait for reconnection or restart the session.');
        }
        try {
            const chats = await sessionData.socket.groupFetchAllParticipating();
            const groups = Object.values(chats).map(group => ({
                jid: group.id,
                name: group.subject,
                description: group.desc || '',
                participantsCount: group.participants?.length || 0,
                isAdmin: group.participants?.some(p => {
                    const userId = sessionData.socket?.user?.id;
                    const participantId = p.id || p.phoneNumber;
                    return participantId === userId &&
                        (p.admin === 'admin' || p.admin === 'superadmin');
                }) || false,
                createdAt: group.creation ? new Date(group.creation * 1000) : null,
                owner: group.ownerPn || group.owner || null,
                ownerLid: group.owner || null
            }));
            return groups;
        }
        catch (error) {
            if (error?.message?.includes('Connection Closed') || error?.output?.statusCode === 428) {
                console.error(`[${sessionId}] Connection closed during getGroups, marking session as disconnected`);
                sessionData.isAuthenticated = false;
                throw new Error('WhatsApp connection was closed. The session will attempt to reconnect automatically.');
            }
            console.error('Error fetching groups:', error);
            throw new Error('Failed to fetch groups');
        }
    }
    static async deleteSession(sessionId) {
        const sessionData = this.sessions.get(sessionId);
        if (sessionData) {
            if (sessionData.socket) {
                try {
                    await sessionData.socket.logout();
                    await sessionData.socket.end(undefined);
                }
                catch (error) {
                    console.error(`Error ending session ${sessionId}:`, error);
                }
            }
            await DatabaseService.clearAuthData(sessionId);
            this.sessions.delete(sessionId);
            this.sessionQRs.delete(sessionId);
            await DatabaseService.updateSessionStatus(sessionId, 'logged_out');
        }
    }
    static async waitForQR(sessionId, maxAttempts = 40) {
        let attempts = 0;
        return new Promise((resolve) => {
            const checkQR = () => {
                const session = this.sessions.get(sessionId);
                const qr = this.sessionQRs.get(sessionId);
                if (qr) {
                    console.log(`[${sessionId}] QR code found after ${attempts * 1000}ms`);
                    resolve(qr);
                }
                else if (session && session.isAuthenticated) {
                    console.log(`[${sessionId}] Session authenticated while waiting for QR`);
                    resolve('authenticated');
                }
                else if (attempts < maxAttempts) {
                    attempts++;
                    setTimeout(checkQR, 1000);
                }
                else {
                    console.log(`[${sessionId}] QR wait timeout after ${maxAttempts * 1000}ms`);
                    resolve(null);
                }
            };
            checkQR();
        });
    }
}
WhatsAppService.sessions = new Map();
WhatsAppService.sessionQRs = new Map();
//# sourceMappingURL=whatsapp.js.map