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
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://bariqealtamyoz.com",
      "https://www.bariqealtamyoz.com",
      "https://dashboard.bariqealtamyoz.com",
      "https://bariqeeltamioz.com",
      "https://www.bariqeeltamioz.com",
      "https://dashboard.bariqeeltamioz.com",
      "https://attractive-happiness-production-a8a5.up.railway.app",
      "https://attractive-happiness-production-4918.up.railway.app",
      "https://bariqe-dashboard-production.up.railway.app",
      // Regex for preview environments
      /^https:\/\/.*\.vercel\.app$/,
      /^https:\/\/.*\.railway\.app$/,
      /^https:\/\/.*\.onrender\.com$/,
    ];

    // Check if origin matches any allowed origin (string or regex)
    const isAllowed = !origin || origin.includes('localhost') || allowedOrigins.some((allowedOrigin) => {
      if (typeof allowedOrigin === "string") {
        return origin === allowedOrigin;
      } else if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return false;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "lang", "Accept", "Cache-Control"],
  exposedHeaders: ["set-cookie"],
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false,
}));
app.use(logger("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));
app.use(cookieParser());

// Session Configuration
import session from "express-session";
import passport from "./config/passport";

app.use(session({
  secret: process.env.SESSION_SECRET || "default_session_secret",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  }
}));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// connect Database
connectDB();

// health check or root route
app.get("/", (req: Request, res: Response) => {
  res.send("🚀 API is running..");
});
// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// main routes
app.use("/", router);


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
