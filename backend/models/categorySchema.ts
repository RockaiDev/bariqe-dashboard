// models/categorySchema.js
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    categoryNameAr: {
      type: String,
      required: [true, "Arabic category name is required"],
      trim: true,
    },
    categoryNameEn: {
      type: String,
      required: [true, "English category name is required"],
      trim: true,
    },
    categoryImage: {
      type: String,
    },
    categoryPublicId: {
      type: String,
    },
    categoryDescriptionAr: {
      type: String,

      trim: true,
    },
    categoryDescriptionEn: {
      type: String,
    
      trim: true,
    },
    categoryStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // هذا يضيف createdAt و updatedAt تلقائياً
  }
);

// Virtual للحصول على الاسم حسب اللغة (للتوافق مع الكود القديم)
categorySchema.virtual("categoryName").get(function () {
  return this.categoryNameEn || this.categoryNameAr;
});

categorySchema.virtual("categoryDescription").get(function () {
  return this.categoryDescriptionEn || this.categoryDescriptionAr;
});

categorySchema.index({ categoryNameAr: 1 });
categorySchema.index({ categoryNameEn: 1 });
categorySchema.index({ categoryStatus: 1 });
const Category = mongoose.model("Category", categorySchema);
export default Category;
