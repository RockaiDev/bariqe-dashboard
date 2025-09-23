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
    productName: {
      type: String,
      required: true,
    },
    productDescription: {
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
    productCategory: {
      ref: "Category",
      type: Schema.Types.ObjectId,
      required: true,
    },
    productImage: {
      type: String,
    },
    productImagePublicId: {
      type: String,
    },
    productStatus: {
      type: Boolean,
      default: true,
    },
    productPurity: {
      type: Number,
      required: true,
    },
    productGrade: {
      type: String,
      required: true,
      enum: ["Technical", "Analytical", "USP", "FCC", "Cosmetic Grade"],
      default: "Technical",
    },
    productForm: {
      type: String,
      required: true,
      enum: ["Solid", "Liquid", "Gas", "Powder", "Granular"],
      default: "Solid",
    },
    // خصم واحد عام (اختياري)
    productDiscount: {
      type: Number,
      default: 0
    },
    // نظام الخصومات المتدرج - الطريقة الصحيحة
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

// Validation للتأكد من أن code في discountTiers يطابق productCode
productSchema.pre('save', function(next) {
  if (this.discountTiers && this.discountTiers.length > 0) {
    const invalidTiers = this.discountTiers.filter((tier: any) => tier.code !== this.productCode);
    if (invalidTiers.length > 0) {
      return next(new Error('All discount tier codes must match the product code'));
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
    
    // ترتيب الخصومات تصاعدياً حسب الكمية
    const sortedTiers = this.discountTiers.sort((a: any, b: any) => a.quantity - b.quantity);
    
    // البحث عن أكبر خصم ممكن للكمية المطلوبة
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