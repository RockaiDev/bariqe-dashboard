import mongoose from "mongoose";
const Schema = mongoose.Schema;

const subCategorySchema = new Schema({
  subCategoryNameAr: {
    type: String,
    required: [true, "Arabic sub-category name is required"],
    trim: true,
  },
  subCategoryNameEn: {
    type: String,
    required: [true, "English sub-category name is required"],
    trim: true,
  },
  subCategoryDescriptionAr: {
    type: String,
    trim: true,
  },
  subCategoryDescriptionEn: {
    type: String,
    trim: true,
  },
  subCategoryStatus: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

const categorySchema = new Schema(
  {
    categoryNameAr: {
      type: String,
      required: [true, "Arabic category name is required"],
      trim: true,
      unique: true,
    },
    categoryNameEn: {
      type: String,
      required: [true, "English category name is required"],
      trim: true,
      unique: true,
    },
    categoryImage: {
      type: String,
      default: "https://res.cloudinary.com/dh6z6gsjk/image/upload/v1760606981/d-koi-5nI9N2wNcBU-unsplash_1_iofavw.jpg",
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
    subCategories: [subCategorySchema],
    categoryStatus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Virtual للحصول على الاسم حسب اللغة
categorySchema.virtual("categoryName").get(function () {
  return this.categoryNameEn || this.categoryNameAr;
});

categorySchema.virtual("categoryDescription").get(function () {
  return this.categoryDescriptionEn || this.categoryDescriptionAr;
});


categorySchema.index({ categoryNameAr: 1 });
categorySchema.index({ categoryNameEn: 1 });
categorySchema.index({ categoryStatus: 1 });
categorySchema.index({ "subCategories.subCategoryNameAr": 1 });
categorySchema.index({ "subCategories.subCategoryNameEn": 1 });


categorySchema.pre('save', function(next) {
  if (this.categoryNameAr) this.categoryNameAr = this.categoryNameAr.trim();
  if (this.categoryNameEn) this.categoryNameEn = this.categoryNameEn.trim();
  if (this.categoryDescriptionAr) this.categoryDescriptionAr = this.categoryDescriptionAr.trim();
  if (this.categoryDescriptionEn) this.categoryDescriptionEn = this.categoryDescriptionEn.trim();
  next();
});

const Category = mongoose.model("Category", categorySchema);
export default Category;