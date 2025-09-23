import mongoose from "mongoose";
const Schema = mongoose.Schema;

const materialRequestSchema = new Schema({
  materialName: {
    type: String,
    required: true,
  },
  materialEmail: {
    type: String,
    required: true,
    match: [/.+@.+\..+/, "Please fill a valid email address"],
  },
  materialPhone: {
    type: String,
    required: true,
    match: [/^\+?[1-9]\d{1,14}$/, "Please fill a valid phone number"],
  },
  materialQuantity: {
    type: Number,
    required: true,
  },
  materialIntendedUse: {
    type: String,
    required: true,
  },
  materialActions: {
    type: String,
    enum: ["pending", "approve", "denied"],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

const materialRequests = mongoose.model(
  "MaterialRequest",
  materialRequestSchema
);
export default materialRequests;
