import { Request, Response } from 'express';
export declare class SessionController {
    static listSessions: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static findSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionStatus: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getCredentials: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getQRCode: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteSession: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getSessionsHistory: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
//# sourceMappingURL=sessionController.d.ts.map