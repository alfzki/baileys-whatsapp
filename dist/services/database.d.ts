import { PrismaClient } from '@prisma/client';
import { MessageType, MessageDirection } from '@/types/index.js';
export declare const prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/library").DefaultArgs>;
export declare class DatabaseService {
    static createSessionRecord(sessionId: string): Promise<{
        sessionId: string;
        id: number;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    } | null>;
    static updateSessionStatus(sessionId: string, status: string): Promise<void>;
    static saveChatHistory(sessionId: string, phoneNumber: string, message: string, messageType?: MessageType, direction?: MessageDirection, metadata?: any): Promise<void>;
    static getChatHistory(sessionId: string, phoneNumber?: string, page?: number, limit?: number, cursor?: number): Promise<{
        data: {
            metadata: any;
            sessionId: string;
            id: number;
            phoneNumber: string;
            message: string;
            messageType: string;
            direction: string;
            timestamp: Date;
        }[];
        cursor: number | null;
        total: number;
    }>;
    static getSessionsHistory(page?: number, limit?: number): Promise<{
        data: ({
            _count: {
                chatHistory: number;
            };
        } & {
            sessionId: string;
            id: number;
            status: string;
            createdAt: Date;
            updatedAt: Date;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    static deleteSession(sessionId: string): Promise<void>;
    static saveAuthData(sessionId: string, key: string, value: string): Promise<void>;
    static getAuthData(sessionId: string): Promise<Array<{
        key: string;
        value: string;
    }>>;
    static clearAuthData(sessionId: string): Promise<void>;
    static disconnect(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map