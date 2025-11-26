export function getSessionStatus(sessionId, sessions) {
    const session = sessions.get(sessionId);
    if (!session)
        return 'DISCONNECTED';
    if (session.isAuthenticated)
        return 'AUTHENTICATED';
    if (session.socket?.ws) {
        const wsState = session.socket.ws?.readyState;
        switch (wsState) {
            case 0: return 'CONNECTING';
            case 1: return 'CONNECTED';
            case 2: return 'CLOSING';
            case 3: return 'DISCONNECTED';
            default: return 'DISCONNECTED';
        }
    }
    return 'DISCONNECTED';
}
export function generateSessionId(prefix = 'session') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
}
export function isValidSessionId(sessionId) {
    const sessionIdRegex = /^[a-zA-Z0-9_-]+$/;
    return sessionIdRegex.test(sessionId) && sessionId.length >= 3 && sessionId.length <= 50;
}
export function getSessionUptime(session) {
    return Date.now() - session.startTime;
}
export function formatSessionUptime(session) {
    const uptime = getSessionUptime(session);
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    else {
        return `${seconds}s`;
    }
}
//# sourceMappingURL=session.js.map