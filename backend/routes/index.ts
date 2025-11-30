import { Router } from "express";
import AuthController from "../controllers/auth";
import protectedRouter from "./protected";
import publicRouter from "./public";
import { authentication } from "../middlewares/authentication";

const router = Router();
const auth = new AuthController();

// ✅ Public routes
// router.post("/auth/signup", auth.signUp.bind(auth));
router.post("/auth/signin", auth.signIn.bind(auth));
router.get("/auth/verify", auth.verifyToken.bind(auth));
router.post("/auth/signout", authentication, auth.signOut.bind(auth));

// Admin cover image endpoints
import { upload } from '../controllers/auth';
router.post('/auth/cover-image', authentication, upload.single('coverImage'), auth.changeCoverImage.bind(auth));
router.delete('/auth/cover-image', authentication, auth.removeCoverImage.bind(auth));

// 🟢 UPDATED: Support both GET and PATCH for /auth/me with avatar upload
router.get('/auth/me', authentication, auth.me.bind(auth));
router.patch('/auth/me', authentication, upload.single('avatar'), auth.me.bind(auth));

// Keep old profile endpoint for backward compatibility
router.patch('/auth/profile', authentication, auth.updateProfile.bind(auth));

// ✅ Public routes (accessible without authentication)
router.use("/api/public", publicRouter);
router.use("/public", publicRouter); // Keep for backward compatibility

// ✅ Protected routes require token
router.use("/api", authentication, protectedRouter);
router.use("/", authentication, protectedRouter); // Keep for backward compatibility

export default router;
