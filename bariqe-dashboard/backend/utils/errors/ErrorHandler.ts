import ApiError from "./ApiError";
import { Response, Request, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "development";

export default function ErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  let status: any = err?.status || 500;
  let message = err.message || "Internal Server Error";

  // Handle Mongoose Validation Errors
  if (err.name === "ValidationError") {
    status = 400;
    message = Object.values(err.errors).map((val: any) => val.message).join(', ');
  }
  
  // Handle Mongoose Cast Errors (Invalid ID)
  if (err.name === "CastError") {
    status = 400;
    message = `Invalid Resource ID: ${err.path}`;
  }

  // Handle Mongoose Duplicate Key Errors
  if (err.code === 11000) {
    status = 409;
    message = `Duplicate field value entered: ${Object.keys(err.keyValue)}`;
  }

  // Handle JWT Errors
  if (err.name === "JsonWebTokenError") {
    status = 401;
    message = "Invalid Token";
  }
  if (err.name === "TokenExpiredError") {
    status = 401;
    message = "Token Expired";
  }

  const location = env === "development" ? { stack: err.stack } : {};
  
  return res
    .status(status)
    .json({ 
      success: false,
      message, 
      error: { ...err, ...location } 
    });
}
