// src/models/eventSchema.ts
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const eventSchema = new Schema(
  {
    // العناوين بالعربية والإنجليزية
    titleAr: {
      type: String,
      required: true,
      trim: true,
    },
    titleEn: {
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
    // المحتوى بالعربية والإنجليزية
    contentAr: {
      type: String,
      required: true,
    },
    contentEn: {
      type: String,
      required: true,
    },
    // صورة الحدث الرئيسية
    eventImage: {
      type: String,
    },
    eventImagePublicId: {
      type: String,
    },
    // ملفات إضافية (PDF, DOC, etc.)
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

// Virtual للحصول على العنوان حسب اللغة (للتوافق مع الكود القديم)
eventSchema.virtual('title').get(function() {
  return this.titleEn || this.titleAr;
});

eventSchema.virtual('content').get(function() {
  return this.contentEn || this.contentAr;
});

const Event = mongoose.model("Event", eventSchema);
export default Event;