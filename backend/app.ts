import dotenv from "dotenv";
import path from "path";
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

// Load environment variables from the correct path
dotenv.config({ path: path.resolve(__dirname, '.env') });

const app: Application = express();
const server = http.createServer(app);

const { PORT = 8080, DEV_ORIGIN = "http://localhost:5173", NODE_ENV = "development" } = process.env;
const port = parseInt(PORT as string, 10) || 8080;

// Configure CORS for production and development
const corsOptions = {
  origin: NODE_ENV === "production" 
    ? [DEV_ORIGIN, "https://*.vercel.app","http://localhost:3000", 'https://www.alexchemy.com', 'https://alexchemy.com'] 
    : [DEV_ORIGIN, "http://localhost:3000"],
  credentials: true,
  optionsSuccessStatus: 200 
};

app.use(cors(corsOptions));
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
