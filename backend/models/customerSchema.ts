import mongoose from "mongoose";
const Schema = mongoose.Schema;
const addressSchema = new Schema({
  label: { type: String, default: "Home" },
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  street: { type: String, required: true },
  city: { type: String, required: true },
  region: { type: String, required: true },
  postalCode: { type: String },
  country: { type: String, default: "Saudi Arabia" },
  isDefault: { type: Boolean, default: false },
}, { _id: true });

const customerSchema = new Schema(
  {
    // === Auth Fields (NEW) ===
    password: { 
      type: String,
      select: false // Hide by default
    },
    isGuest: { 
      type: Boolean, 
      default: false 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    authProvider: { 
      type: String, 
      enum: ["local", "google", "apple"], 
      default: "local" 
    },
    socialId: { 
      type: String,
      select: false
    },
    
    // === Existing Fields ===
    customerName: {
      type: String,
      required: false,
    },
    customerEmail: {
      type: String,
      match: [/.+@.+\..+/, "Please fill a valid email address"],
      sparse: true, // Allow multiple nulls/unique only if present
      unique: true,
      set: (v: any) => (v === "" || v === null ? undefined : v),
    },
    customerPhone: {
      type: String,
      required: false,
      match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
      set: (v: any) => (v === "" || v === null ? undefined : v),
    },
    customerAddress: {
      type: String,
        required: false
, // ✅ أصبح مطلوب
    },
    customerNotes: {
      type: String,
    },
    customerSource: {
      type: String,
      required: false,
      enum: ["order", "consultation", "material_request","contact", "other"],
      default: "other"
    },
    customerLocation:{
      type: String,
      default:""
    },
    avatar: { 
      type: String 
    },

    // === New Fields ===
    addresses: {
      type: [addressSchema],
      default: []
    },
    favorites: [{ 
      type: Schema.Types.ObjectId, 
      ref: "Product" 
    }],

    // === OTP & Password Reset ===
    otp: { 
      type: String,
      select: false
    },
    otpExpires: { 
      type: Date,
      select: false
    },
    resetPasswordOtp: { 
      type: String,
      select: false
    },
    resetPasswordOtpExpires: { 
      type: Date,
      select: false
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const customers = mongoose.model("Customer", customerSchema);

// =========================================================================
// AUTO-FIX: Drop customerPhone_1 index if it exists (runs once on first use)
// This fixes the E11000 duplicate key error for null customerPhone values
// =========================================================================
(async () => {
  try {
    if (mongoose.connection.readyState === 1) {
      const collection = mongoose.connection.collection('customers');
      const indexes = await collection.indexes();
      const phoneIndex = indexes.find((idx: any) => idx.name === 'customerPhone_1');
      if (phoneIndex) {
        await collection.dropIndex('customerPhone_1');
        console.log('✅ [CustomerSchema] Dropped obsolete customerPhone_1 index');
      }
    }
  } catch (err: any) {
    // Silently ignore if index doesn't exist or connection not ready
    if (err.code !== 27 && err.code !== 26) {
      console.warn('⚠️ [CustomerSchema] Index cleanup:', err.message);
    }
  }
})();

export default customers;
