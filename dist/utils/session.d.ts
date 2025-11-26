import { SessionData, SessionStatus } from '@/types/index.js';
export declare function getSessionStatus(sessionId: string, sessions: Map<string, SessionData>): SessionStatus;
export declare function generateSessionId(prefix?: string): string;
export declare function isValidSessionId(sessionId: string): boolean;
export declare function getSessionUptime(session: SessionData): number;
export declare function formatSessionUptime(session: SessionData): string;
//# sourceMappingURL=session.d.ts.map