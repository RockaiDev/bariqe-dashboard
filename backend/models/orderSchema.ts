import mongoose from "mongoose";
const Schema = mongoose.Schema;

const orderSchema = new Schema(
  {
    customer: {
      type: Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
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
    orderQuantity: {
      type: String,
      required: true,
    },
    orderDiscount: {
      // يجب أن يكون orderDiscount
      type: Number,
      default: 0,
    },
    orderStatus: {
      // يجب أن يكون orderStatus
      type: String,
      enum: ["pending", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
