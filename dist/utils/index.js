export * from './phoneNumber.js';
export * from './session.js';
export * from './databaseAuth.js';
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function generateRandomString(length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}
export function sanitizeString(str) {
    return str.replace(/[<>\"'&]/g, '');
}
export function safeJsonParse(jsonString, fallback) {
    try {
        return JSON.parse(jsonString);
    }
    catch {
        return fallback;
    }
}
//# sourceMappingURL=index.js.map