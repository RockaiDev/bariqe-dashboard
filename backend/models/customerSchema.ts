import mongoose from "mongoose";
const Schema = mongoose.Schema;
const customerSchema = new Schema(
  {
    customerName: {
      type: String,
      required: true,
    },
    customerEmail: {
      type: String,
      match: [/.+@.+\..+/, "Please fill a valid email address"],
    },
    customerPhone: {
      type: String,
      required: true,
      unique: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
    },
    customerAddress: {
      type: String,
      required: true, // ✅ أصبح مطلوب
    },
    customerNotes: {
      type: String,
    },
    customerSource: {
      type: String,
      required: true,
      enum: ["order", "consultation", "material_request","contact", "other"],
    },
    customerLocation:{
      type: String,
      default:""
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
export default customers;
