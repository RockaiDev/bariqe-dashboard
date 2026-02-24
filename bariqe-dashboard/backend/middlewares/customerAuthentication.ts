import { Request, Response, NextFunction } from "express";
import { verify } from "jsonwebtoken";
import ApiError from "../utils/errors/ApiError";

const JWT_CUSTOMER = process.env.JWT_CUSTOMER ;

export function customerAuthentication(req: Request, res: Response, next: NextFunction) {
  try {
    let token: string | undefined;
    // Prefer Authorization header (Bearer)
    if (req.headers.authorization?.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
      
    }

    if (!token) {
      throw new ApiError("UNAUTHORIZED", "hererer No token provided");
    }

    const decoded = verify(token, JWT_CUSTOMER) as any;
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
