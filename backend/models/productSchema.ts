// productSchema.js
import mongoose from "mongoose";

const Schema = mongoose.Schema;

// Schema للخصومات المتدرجة
// const discountTierSchema = new Schema({
//   quantity: {
//     type: Number,
//     required: true,
//     min: 1
//   },
//   discount: {
//     type: Number,
//     required: true,
//     min: 0,
//     max: 100
//   },
//   code: {
//     type: String,
//     required: true
//   }
// }, { _id: false });

const productSchema = new Schema(
  {
    // أسماء المنتج بالعربية والإنجليزية
    productNameAr: {
      type: String,
      required: true,
    },
    moreSale: {
      type: Boolean,
      default: false,
    },
    amount: {
      type: Number,
      
      default: 0,
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
    // productSubCategory: {
    //   type: Schema.Types.ObjectId,
    //   required: false,
    // },
    productImage: {
      type: String,
       default: "https://res.cloudinary.com/dh6z6gsjk/image/upload/v1760606981/d-koi-5nI9N2wNcBU-unsplash_1_iofavw.jpg",
    },
    productImagePublicId: {
      type: String,
    },
    productMoreSale: {
      type: Boolean,
      default: true,
    },
   
    productDiscount: {
      type: String,
      default:"Offer 20%" 
    },
    // discountTiers: {
    //   type: [discountTierSchema],
    //   default: []
    // },
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


  // // ✅ التحقق من أن الـ SubCategory موجودة في الـ Category
  // if (this.isModified('productCategory') || this.isModified('productSubCategory')) {
  //   try {
  //     const Category = mongoose.model('Category');
  //     const category = await Category.findById(this.productCategory);
      
  //     if (!category) {
  //       return next(new Error('Category not found'));
  //     }

  //     if (!category.subCategories || category.subCategories.length === 0) {
  //       return next(new Error('No subcategories found in this category'));
  //     }

  //     const subCategoryExists = category.subCategories.some((sub: any) => 
  //       sub._id.toString() === this.productSubCategory.toString()
  //     );

  //     if (!subCategoryExists) {
  //       return next(new Error('SubCategory does not belong to the selected category'));
  //     }
  //   } catch (error) {
  //     return next(error);
  //   }
  // }

  next();
});



// Method لحساب السعر بعد الخصم


const products = mongoose.model("Product", productSchema);
export default products;