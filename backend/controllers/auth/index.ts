import BaseApi from '../../utils/BaseApi';
import { NextFunction, Request, Response } from 'express';
import AuthService from './services';
import ApiError from '../../utils/errors/ApiError';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import CloudinaryService from '../../services/cloudinary/CloudinaryService';
import adminModel from '../../models/adminSchema';

const authService = new AuthService();

// Cookie options helper to ensure consistent cookie attributes across envs
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
  maxAge: 1000 * 60 * 60, // 1 hour
  path: '/',
} as const;

// Configure multer for temporary uploads (used for avatar and cover image)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/temp/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new Error('Only JPEG, PNG, and WebP images are allowed'));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export { upload };

export default class AuthController extends BaseApi {
  // 🟢 SIGN UP
  public async signUp(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, admin } = await authService.SignUp(req.body);
      res.cookie("accessToken", token, COOKIE_OPTIONS);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      super.send(res, { token, admin, message: "Admin created successfully" });
    } catch (error) {
      next(error);
    }
  }

  // 🟢 SIGN IN
  public async signIn(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { token, admin } = await authService.SignIn(req.body);
      res.cookie("accessToken", token, COOKIE_OPTIONS);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      super.send(res, { token, admin, message: "Sign in successful" });
    } catch (error) {
      next(error);
    }
  }

  // 🟢 SIGN OUT
  public async signOut(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      res.clearCookie("accessToken", COOKIE_OPTIONS as any);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      super.send(res, { message: "Signed out successfully" });
    } catch (error) {
      console.log(error);
      next(error);
    }
  }

  // 🟢 VERIFY TOKEN
  public async verifyToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let token = req.cookies?.accessToken;

      // Also check Authorization header
      if (!token && req.headers.authorization?.startsWith("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
      }

      if (!token) {
        throw new ApiError("UNAUTHORIZED", "No token provided");
      }

      const decodedToken = await authService.VerifyToken(token);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      super.send(res, { valid: true, decoded: decodedToken });
    } catch (error) {
      next(error);
    }
  }

  // Helper to remove temp file
  private cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('Cleaned up temp file:', filePath);
      }
    } catch (error) {
      console.error('Error cleaning up file:', error);
    }
  }

  // Change admin cover image (file upload or base64)
  public async changeCoverImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) throw new ApiError('UNAUTHORIZED', 'No user id in token');

      const existingAdmin = await adminModel.findById(adminId);
      if (!existingAdmin) {
        throw new ApiError('NOT_FOUND', 'Admin not found');
      }

      const oldImageUrl = existingAdmin.coverImage || null;
      let newImageUrl: string | null = null;

      if ((req as any).file) {
        const publicId = `admin_cover_${adminId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadFromPath((req as any).file.path, 'admins', publicId);
        this.cleanupFile((req as any).file.path);
      } else if (req.body.coverImageBase64) {
        const publicId = `admin_cover_${adminId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadImageFromBase64(req.body.coverImageBase64, 'admins', publicId);
      } else {
        throw new ApiError('BAD_REQUEST', 'No image provided');
      }

      const data = await adminModel.findByIdAndUpdate(adminId, { coverImage: newImageUrl }, { new: true });

      if (oldImageUrl && data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: 'Cover image updated successfully',
        data,
        newImageUrl,
      });
    } catch (error) {
      if ((req as any).file) {
        this.cleanupFile((req as any).file.path);
      }
      next(error);
    }
  }

  // Remove admin cover image
  public async removeCoverImage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) throw new ApiError('UNAUTHORIZED', 'No user id in token');

      const existingAdmin = await adminModel.findById(adminId);
      if (!existingAdmin) {
        throw new ApiError('NOT_FOUND', 'Admin not found');
      }

      const oldImageUrl = existingAdmin.coverImage;
      if (!oldImageUrl) {
        throw new ApiError('BAD_REQUEST', 'Admin has no cover image to remove');
      }

      const data = await adminModel.findByIdAndUpdate(adminId, { coverImage: '' }, { new: true });

      if (data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: 'Cover image removed successfully',
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  // 🟢 UPDATED: Handle both GET and PATCH for /auth/me
  public async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) throw new ApiError('UNAUTHORIZED', 'No user id in token');

      if (req.method === 'GET') {
        // Return current admin data
        const existingAdmin = await adminModel.findById(adminId).select('-password');
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        if (!existingAdmin) throw new ApiError('NOT_FOUND', 'Admin not found');

        // Get current token to send back so frontend can store it if needed
        const token = req.cookies?.accessToken || req.headers.authorization?.split(" ")[1];

        super.send(res, { admin: existingAdmin, token });
      } else if (req.method === 'PATCH') {
        // Update admin profile with avatar support
        await this.updateProfileWithAvatar(req, res, next);
      }
    } catch (error) {
      next(error);
    }
  }

  // 🟢 NEW: Update admin profile with avatar support
  private async updateProfileWithAvatar(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) throw new ApiError('UNAUTHORIZED', 'No user id in token');

      const existingAdmin = await adminModel.findById(adminId);
      if (!existingAdmin) {
        throw new ApiError('NOT_FOUND', 'Admin not found');
      }

      // Handle profile updates
      const updateData: any = {};
      if (req.body.firstName !== undefined) updateData.firstName = req.body.firstName;
      if (req.body.email !== undefined) {
        // Check email uniqueness
        const emailExists = await adminModel.findOne({ email: req.body.email });
        if (emailExists && emailExists._id.toString() !== adminId) {
          throw new ApiError('CONFLICT', 'Email already in use');
        }
        updateData.email = req.body.email;
      }

      // Handle avatar upload
      if ((req as any).file) {
        const oldAvatarUrl = existingAdmin.avatar || existingAdmin.profilePicture || null;
        const publicId = `admin_avatar_${adminId}_${Date.now()}`;
        const newAvatarUrl = await CloudinaryService.uploadFromPath((req as any).file.path, 'admins/avatars', publicId);

        updateData.avatar = newAvatarUrl;
        updateData.profilePicture = newAvatarUrl; // Support both field names

        // Clean up temp file
        this.cleanupFile((req as any).file.path);

        // Delete old avatar if exists
        if (oldAvatarUrl) {
          await CloudinaryService.deleteImage(oldAvatarUrl);
        }
      }

      const updated = await adminModel.findByIdAndUpdate(adminId, updateData, { new: true }).select('-password');
      if (!updated) throw new ApiError('NOT_FOUND', 'Admin not found');

      super.send(res, { message: 'Profile updated successfully', admin: updated });
    } catch (error) {
      // Clean up temp file if upload failed
      if ((req as any).file) {
        this.cleanupFile((req as any).file.path);
      }
      next(error);
    }
  }

  // Keep the old updateProfile method for backward compatibility
  public async updateProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adminId = (req as any).user?.id;
      if (!adminId) throw new ApiError('UNAUTHORIZED', 'No user id in token');

      const authService = new AuthService();
      const updated = await authService.UpdateProfile(adminId, req.body);

      super.send(res, { message: 'Profile updated successfully', admin: updated });
    } catch (error) {
      next(error);
    }
  }
}