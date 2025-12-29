// middlewares/optionalAuthentication.ts
import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";

const JWT = process.env.JWT!;

export function optionalAuthentication(req: Request, res: Response, next: NextFunction) {
    try {
        let token: string | undefined;

        if (req.headers.authorization?.startsWith("Bearer ")) {
            token = req.headers.authorization.split(" ")[1];
        } else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }

        if (!token) {
            return next(); // No token, but that's okay here
        }

        const decoded = verify(token, JWT) as any;
        (req as any).user = decoded;
        next();
    } catch (error) {
        // If token is invalid/expired, we just proceed as unauthenticated
        // instead of throwing a 401 that triggers browser console logs
        next();
    }
}
