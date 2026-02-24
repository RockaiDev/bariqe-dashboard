import { Router } from "express";
import AuthController from "../controllers/auth";
import protectedRouter from "./protected";
import publicRouter from "./public";
import { authentication } from "../middlewares/authentication";
import { optionalAuthentication } from "../middlewares/optionalAuthentication";

const router = Router();
const auth = new AuthController();

// ✅ Public routes
// router.post("/api/auth/signup", auth.signUp.bind(auth));
router.post("/auth/signin", auth.signIn.bind(auth));
router.get("/auth/verify", auth.verifyToken.bind(auth));
router.post("/auth/signout", authentication, auth.signOut.bind(auth));

// Admin cover image endpoints
import { upload } from '../controllers/auth';
router.post('/auth/cover-image', authentication, upload.single('coverImage'), auth.changeCoverImage.bind(auth));
router.delete('/auth/cover-image', authentication, auth.removeCoverImage.bind(auth));

// 🟢 UPDATED: Use optionalAuthentication for a "silent" session check
router.get('/auth/me', optionalAuthentication, auth.me.bind(auth));
router.patch('/auth/me', authentication, upload.single('avatar'), auth.me.bind(auth));

// Keep old profile endpoint for backward compatibility
router.patch('/auth/profile', authentication, auth.updateProfile.bind(auth));

// ✅ New Passport Auth Routes
import passportAuthRouter from "./auth";
router.use("/api/auth", passportAuthRouter);

// ✅ Public routes (accessible without authentication)
// ✅ Public routes (accessible without authentication)
router.use("/public", publicRouter);

// ✅ Customer Protected Routes
import customerRouter from "./customer";
import { customerAuthentication } from "../middlewares/customerAuthentication";

router.use("/customer", customerAuthentication, customerRouter);

// ✅ Admin Protected routes require token
router.use("/", authentication, protectedRouter);

export default router;
