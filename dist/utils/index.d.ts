export * from './phoneNumber.js';
export * from './session.js';
export * from './databaseAuth.js';
export declare function sleep(ms: number): Promise<void>;
export declare function randomDelay(minMs: number, maxMs: number): number;
export declare function getBulkMessageDelayConfig(): {
    minDelay: number;
    maxDelay: number;
};
export declare function generateRandomString(length?: number): string;
export declare function sanitizeString(str: string): string;
export declare function safeJsonParse<T>(jsonString: string, fallback: T): T;
//# sourceMappingURL=index.d.ts.map