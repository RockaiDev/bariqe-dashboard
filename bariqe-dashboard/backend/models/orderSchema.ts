import mongoose from "mongoose";
const Schema = mongoose.Schema;

const orderItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  itemDiscount: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
});

const orderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: false, // ✅ Guest orders allowed (No Customer Doc)
    },
    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v: any[]) {
          return v && v.length > 0;
        },
        message: "Order must have at least one product",
      },
    },

    // === Shipping Address (Snapshot at time of order) ===
    shippingAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      region: String,
      postalCode: String,
      nationalAddress: {
        type: String,
        maxlength: [8, "National Address must be at most 8 characters"]
      },
      country: { type: String, default: "Saudi Arabia" },
    },

    // === Payment Info ===
    payment: {
      method: {
        type: String,
        enum: ["paylink", "cod"],
        default: "cod"
      },
      status: {
        type: String,
        enum: ["pending", "paid", "failed", "refunded"],
        default: "pending"
      },
      transactionId: String,
      paidAt: Date,
      paymentUrl: String,   // PayLink checkout URL
      invoiceId: String,    // PayLink invoice ID
    },

    // === Shipping Info (J&T Express) ===
    shipping: {
      carrier: { type: String, default: "jt_express" },
      trackingNumber: String,
      status: String,
      shippingCost: Number,
      estimatedDelivery: Date,
      labelUrl: String, // PDF label from J&T
    },

    // === Order Totals ===
    orderQuantity: { // Total item count
      type: String,
      required: true,
    },
    subtotal: { type: Number, default: 0 },
    shippingCost: { type: Number, default: 0 },
    orderDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    total: { type: Number, default: 0 },

    orderStatus: {
      type: String,
      enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;