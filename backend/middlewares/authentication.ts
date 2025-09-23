// middlewares/authentication.ts
import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import ApiError from "../utils/errors/ApiError";

const JWT = process.env.JWT!;

export function authentication(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;

    
    // Prefer Authorization header (Bearer) if present (useful for API clients)
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }
 
    // لو مفيش توكن
    if (!token) {
      throw new ApiError("UNAUTHORIZED", "No token provided");
    }

    // تحقّق من التوكن
    const decoded = verify(token, JWT) as any;

    // ضيف بيانات اليوزر في request
    (req as any).user = decoded;

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      next(new ApiError("UNAUTHORIZED", "Token expired"));
    } else if (error.name === "JsonWebTokenError") {
      next(new ApiError("UNAUTHORIZED", "Invalid token"));
    } else if (error instanceof ApiError) {
      next(error);
    } else {
      next(new ApiError("INTERNAL_SERVER_ERROR", "Authentication failed"));
    }
  }
}