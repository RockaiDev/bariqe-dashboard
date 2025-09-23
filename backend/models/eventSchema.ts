// src/models/eventSchema.ts
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    date: {
      type: Date,
      required: true,
    },
    tags: [{
      type: String,
      trim: true,
    }],
    content: {
      type: String,
      required: true,
    },
    files: [{
      filename: {
        type: String,
        required: true,
      },
      originalName: {
        type: String,
        required: true,
      },
      mimetype: {
        type: String,
        required: true,
      },
      size: {
        type: Number,
        required: true,
      },
      path: {
        type: String,
        required: true,
      },
    }],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    author: {
      type: String,
      default: "System",
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;