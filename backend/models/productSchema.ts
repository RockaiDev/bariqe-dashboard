// productSchema.js
import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Schema للخصومات المتدرجة
const discountTierSchema = new Schema({
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  discount: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  code: {
    type: String,
    required: true
  }
}, { _id: false });

const productSchema = new Schema(
  {
    // أسماء المنتج بالعربية والإنجليزية
    productNameAr: {
      type: String,
      required: true,
    },
    productNameEn: {
      type: String,
      required: true,
    },
    // أوصاف المنتج بالعربية والإنجليزية
    productDescriptionAr: {
      type: String,
      required: true,
    },
    productDescriptionEn: {
      type: String,
      required: true,
    },
    productCode: {
      type: String,
      required: true,
      unique: true,
    },
    productPrice: {
      type: Number,
      required: true,
    },
    // ✅ الحل الصحيح: حفظ معرف الفئة والفئة الفرعية معاً
    productCategory: {
      ref: "Category",
      type: Schema.Types.ObjectId,
      required: true,
    },
    productSubCategory: {
      type: Schema.Types.ObjectId,
      required: true,
    },
    productImage: {
      type: String,
       default: "https://res.cloudinary.com/dh6z6gsjk/image/upload/v1759126342/d-koi-5nI9N2wNcBU-unsplash_dj9qql.jpg",
    },
    productImagePublicId: {
      type: String,
    },
    productStatus: {
      type: Boolean,
      default: true,
    },
    productForm: {
      type: String,
      enum: ["Solid", "Liquid", "Gas", "Powder", "Granular"],
      default: "Solid",
    },
    productDiscount: {
      type: Number,
      default: 0
    },
    discountTiers: {
      type: [discountTierSchema],
      default: []
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

// Virtual للحصول على الاسم حسب اللغة
productSchema.virtual('productName').get(function() {
  return this.productNameEn || this.productNameAr;
});

productSchema.virtual('productDescription').get(function() {
  return this.productDescriptionEn || this.productDescriptionAr;
});

// ✅ Validation للتأكد من أن الـ SubCategory موجودة في الـ Category المحددة
productSchema.pre('save', async function(next) {
  // التحقق من discount tiers
  if (this.discountTiers && this.discountTiers.length > 0) {
    const invalidTiers = this.discountTiers.filter((tier: any) => tier.code !== this.productCode);
    if (invalidTiers.length > 0) {
      return next(new Error('All discount tier codes must match the product code'));
    }
  }

  // ✅ التحقق من أن الـ SubCategory موجودة في الـ Category
  if (this.isModified('productCategory') || this.isModified('productSubCategory')) {
    try {
      const Category = mongoose.model('Category');
      const category = await Category.findById(this.productCategory);
      
      if (!category) {
        return next(new Error('Category not found'));
      }

      if (!category.subCategories || category.subCategories.length === 0) {
        return next(new Error('No subcategories found in this category'));
      }

      const subCategoryExists = category.subCategories.some((sub: any) => 
        sub._id.toString() === this.productSubCategory.toString()
      );

      if (!subCategoryExists) {
        return next(new Error('SubCategory does not belong to the selected category'));
      }
    } catch (error) {
      return next(error);
    }
  }

  next();
});

// Virtual لحساب الخصم بناءً على الكمية
productSchema.virtual('getDiscountForQuantity').get(function() {
  return function(quantity: number) {
    if (!this.discountTiers || this.discountTiers.length === 0) {
      return this.productDiscount || 0;
    }
    
    const sortedTiers = this.discountTiers.sort((a: any, b: any) => a.quantity - b.quantity);
    
    let applicableDiscount = this.productDiscount || 0;
    
    for (const tier of sortedTiers) {
      if (quantity >= tier.quantity) {
        applicableDiscount = tier.discount;
      } else {
        break;
      }
    }
    
    return applicableDiscount;
  };
});

// Method لحساب السعر بعد الخصم
productSchema.methods.calculatePriceWithDiscount = function(quantity: number) {
  const discount = this.getDiscountForQuantity(quantity);
  const discountAmount = (this.productPrice * discount) / 100;
  return this.productPrice - discountAmount;
};

const products = mongoose.model("Product", productSchema);
export default products;