import mongoose from "mongoose";
const Schema = mongoose.Schema;

const materialRequestSchema = new Schema({
  materialName: {
    type: String,
    required: true,
  },
  materialEmail: {
    type: String,
    required: function() {
      return !this.customer; // مطلوب فقط إذا لم يكن هناك customer
    },
    match: [/.+@.+\..+/, "Please fill a valid email address"],
  },
  materialPhone: {
    type: String,
    required: function() {
      return !this.customer; // مطلوب فقط إذا لم يكن هناك customer
    },
    match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
  },
  materialQuantity: {
    type: Number,
    required: true,
    min: 1,
  },
  materialIntendedUse: {
    type: String,
    required: true,
  },
  materialLocation: { // ✅ إضافة materialLocation
    type: String,
    default: "",
  },
  customer: { // ✅ إضافة customer reference
    type: Schema.Types.ObjectId,
    ref: "Customer",
    required: false,
  },
  materialActions: {
    type: String,
    enum: ["pending", "approve", "denied"],
    default: "pending",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

const materialRequests = mongoose.model(
  "MaterialRequest",
  materialRequestSchema
);
export default materialRequests;