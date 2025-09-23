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
      required: true,
      unique: true,
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
    },

    customerNotes: {
      type: String,
      required: true,
    },
    customerSource: {
      type: String,
      required: true,
      enum: ["order", "consultation", "material_request", "other"],
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
