import dotenv from "dotenv";
import express, { Application, Request, Response, NextFunction } from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import ErrorHandler from "./utils/errors/ErrorHandler";
import ApiError from "./utils/errors/ApiError";
import logger from "morgan";
import { connectDB } from "./config/db";
import cookieParser from "cookie-parser";
import router from "./routes";

dotenv.config();

const app: Application = express();
const server = http.createServer(app);

const { PORT = 8080, DEV_ORIGIN = "http://localhost:5173" } = process.env;
const port = parseInt(PORT as string, 10) || 8080;

app.use(cors({ origin: DEV_ORIGIN, credentials: true }));
app.use(helmet());
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// connect Database
connectDB();

// main routes
app.use("/", router);

// health check or root route
app.get("/", (req: Request, res: Response) => {
  res.send("🚀 API is running..");
});

// if route not found
app.use((req: Request, res: Response, next: NextFunction) =>
  next(new ApiError("METHOD_NOT_ALLOWED", "Method not allowed!"))
);

// error handler
app.use(ErrorHandler);

// start server
server.listen(port, "0.0.0.0", () => {
  console.log(`🚀 Server running on port ${port}`);
});

export default server;
