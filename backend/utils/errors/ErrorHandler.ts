import ApiError from "./ApiError";
import { Response, Request, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();

const env = process.env.NODE_ENV || "development";

export default function ErrorHandler(
  err: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status: any = err?.status || 500;
  const location = env === "development" ? { location: err.stack } : {};
  return res
    .status(status)
    .json({ message: "error", result: { ...err, ...location } });
}
