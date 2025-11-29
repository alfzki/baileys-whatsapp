export * from './phoneNumber.js';
export * from './session.js';
export * from './databaseAuth.js';
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
export function randomDelay(minMs, maxMs) {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}
export function getBulkMessageDelayConfig() {
    const DEFAULT_MIN_DELAY = 10000;
    const DEFAULT_MAX_DELAY = 15000;
    let minDelay = parseInt(process.env.BULK_MESSAGE_MIN_DELAY || '', 10);
    let maxDelay = parseInt(process.env.BULK_MESSAGE_MAX_DELAY || '', 10);
    if (isNaN(minDelay) || minDelay <= 0) {
        minDelay = DEFAULT_MIN_DELAY;
    }
    if (isNaN(maxDelay) || maxDelay <= 0) {
        maxDelay = DEFAULT_MAX_DELAY;
    }
    if (minDelay > maxDelay) {
        console.warn(`[Config] BULK_MESSAGE_MIN_DELAY (${minDelay}) > BULK_MESSAGE_MAX_DELAY (${maxDelay}), swapping values`);
        [minDelay, maxDelay] = [maxDelay, minDelay];
    }
    const ABSOLUTE_MIN_DELAY = 5000;
    if (minDelay < ABSOLUTE_MIN_DELAY) {
        console.warn(`[Config] BULK_MESSAGE_MIN_DELAY too low, enforcing minimum of ${ABSOLUTE_MIN_DELAY}ms`);
        minDelay = ABSOLUTE_MIN_DELAY;
    }
    return { minDelay, maxDelay };
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