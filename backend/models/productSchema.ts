import mongoose from "mongoose";

const Schema = mongoose.Schema;

/* ================================
   Schema لخيارات المنتج Array of Objects
   ================================= */
const productOptionSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    description: {
      type: String,
    },
  },
  { _id: false }
);

/* ==================================
        Product Schema
   ================================== */
const productSchema = new Schema(
  {
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

    productDescriptionAr: {
      type: String,
      required: true,
    },

    productDescriptionEn: {
      type: String,
      required: true,
    },

    productOldPrice: {
      type: Number,
      required: true,
    },
    productNewPrice: {
      type: Number,
      required: false,
    },

    productCategory: {
      ref: "Category",
      type: Schema.Types.ObjectId,
      required: true,
    },

    productImage: {
      type: String,
      default:
        "https://res.cloudinary.com/db152mwtg/image/upload/v1764588788/products/product_1764588788281_1764588788281.jpg",
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
      default: "Offer 20%",
    },

    /* ==================================
        Array of Objects → productOptions
       ================================== */
    productOptions: {
      type: [productOptionSchema],
      default: [],
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


productSchema.virtual("productName").get(function () {
  return this.productNameEn || this.productNameAr;
});

productSchema.virtual("productDescription").get(function () {
  return this.productDescriptionEn || this.productDescriptionAr;
});


productSchema.pre("save", async function (next) {
  next();
});

/* ================================
        Model Export
   ================================ */
const products = mongoose.model("Product", productSchema);
export default products;
