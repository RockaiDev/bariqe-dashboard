import AuthFeatures from "../../../services/auth";
import admin from "../../../models/adminSchema";
import ApiError from "../../../utils/errors/ApiError";

export default class AuthService extends AuthFeatures {
  // SIGN UP
  public async SignUp(body: any): Promise<any> {
    try {
      // Check if admin already exists with the same email
      const existingAdmin = await admin.findOne({ email: body.email });
      if (existingAdmin) {
        throw new ApiError("CONFLICT", "Admin already exists with this email");
      }

      // Hash the password before saving
      const hashedPassword = this.GenerateHash(body.password);

      // Create new admin with hashed password
      const newAdmin = await admin.create({
        ...body,
        password: hashedPassword,
      });

      const token = this.GenerateToken({
        id: newAdmin._id,
        email: newAdmin.email,
        role: newAdmin.role || "admin",
      });

      const { password, ...adminData } = newAdmin.toObject();

      return {
        token,
        admin: adminData
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      console.error("Error signing up:", error);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error signing up");
    }
  }

  // SIGN IN
  public async SignIn(body: any): Promise<any> {
    try {
      if (!body.email || !body.password) {
        throw new ApiError("BAD_REQUEST", "Email and password are required");
      }

      const adminUser = await admin.findOne({ email: body.email });
      if (!adminUser) {
        throw new ApiError("UNAUTHORIZED", "Invalid credentials");
      }

      const isPasswordValid = this.CompareHash(body.password, adminUser.password);
      if (!isPasswordValid) {
        throw new ApiError("UNAUTHORIZED", "Invalid credentials");
      }

      const token = this.GenerateToken({
        id: adminUser._id,
        email: adminUser.email,
        role: adminUser.role || "admin",
      });

      const { password, ...adminData } = adminUser.toObject();

      return {
        token,
        admin: adminData
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("INTERNAL_SERVER_ERROR", "Error signing in");
    }
  }

  // verify Token
  public async VerifyToken(token: string): Promise<any> {
    try {
      const decodedToken = this.VerifyTokenString(token);
      if (!decodedToken) {
        throw new ApiError("UNAUTHORIZED", "Invalid or expired token");
      }
      return decodedToken;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError("UNAUTHORIZED", "Token verification failed");
    }
  }

  // Update admin profile (firstName, email)
  public async UpdateProfile(adminId: string, body: any): Promise<any> {
    try {
      if (!adminId) throw new ApiError('UNAUTHORIZED', 'No admin id provided');

      // If email provided and different, ensure uniqueness
      if (body.email) {
        const existing = await admin.findOne({ email: body.email });
        if (existing && existing._id.toString() !== adminId) {
          throw new ApiError('CONFLICT', 'Email already in use');
        }
      }

      const updateData: any = {};
      if (body.firstName !== undefined) updateData.firstName = body.firstName;
      if (body.email !== undefined) updateData.email = body.email;

      const updated = await admin.findByIdAndUpdate(adminId, updateData, { new: true });
      if (!updated) throw new ApiError('NOT_FOUND', 'Admin not found');

      const { password, ...adminData } = (updated as any).toObject();
      return adminData;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      console.error('UpdateProfile error:', error);
      throw new ApiError('INTERNAL_SERVER_ERROR', 'Failed to update profile');
    }
  }
}
