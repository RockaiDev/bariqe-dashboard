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
      required: true,
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
    orderQuantity: {
      type: String,
      required: true,
    },
    orderDiscount: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    orderStatus: {
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;