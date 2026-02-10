/**
 * ============================================================================
 * ORDER FACADE SERVICE
 * ============================================================================
 * 
 * Implements the Facade Design Pattern to orchestrate the complex order flow:
 * - Order creation
 * - Payment gateway integration (PayLink)
 * - Shipping (J&T Express)
 * - Email notifications
 * 
 * This facade provides a simplified interface to the frontend, hiding the
 * complexity of coordinating multiple services.
 */

import OrderModel from "../../models/orderSchema";
import CustomerModel from "../../models/customerSchema";
import ProductModel from "../../models/productSchema";
import PayLinkService from "../paylink";
import JTExpressService from "../shipping/jt-express";
import { sendOrderConfirmation, sendShipmentNotification } from "../email";
import ApiError from "../../utils/errors/ApiError";

// ============================================================================
// TYPES
// ============================================================================

export interface OrderInput {
  customer?: string; // Customer ID (optional for guests)
  products: Array<{ product: string; quantity: number; itemDiscount?: number }>;
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    country?: string;
  };
  customerEmail?: string; // For guest orders
  paymentMethod?: "paylink" | "cod";
  orderDiscount?: number;
  notes?: string;
}

export interface InitiateOrderResult {
  order: any;
  paymentUrl?: string; // Only for PayLink payments
  message: string;
}

export interface ShipOrderResult {
  order: any;
  trackingNumber: string;
  labelUrl?: string;
  message: string;
}

// ============================================================================
// FACADE CLASS
// ============================================================================

class OrderFacade {

  /**
   * STEP 1: Initiate Order
   * 
   * Creates an order with status "pending" and initiates payment if PayLink.
   * Returns payment URL for the frontend to redirect the user.
   */
  public async initiateOrder(body: OrderInput): Promise<InitiateOrderResult> {
    // Track created order ID for rollback
    let createdOrderId: string | null = null;

    try {
      // 1. Validate Products
      if (!body.products || body.products.length === 0) {
        throw new ApiError("BAD_REQUEST", "Order must have at least one product");
      }

      // 2. Validate Shipping Address (required for all orders)
      const { shippingAddress } = body;
      if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street) {
        throw new ApiError("BAD_REQUEST", "Shipping address with fullName, phone, and street is required");
      }

      // 3. Validate Customer (if provided)
      let customerId = body.customer;
      if (customerId) {
        const exists = await CustomerModel.exists({ _id: customerId });
        if (!exists) {
          throw new ApiError("NOT_FOUND", "Customer account not found");
        }
      }

      // 4. Calculate Order Totals
      let subtotal = 0;
      const populatedProducts: any[] = [];

      for (const item of body.products) {
        const product = await ProductModel.findById(item.product);
        if (!product) {
          throw new ApiError("NOT_FOUND", `Product ${item.product} not found`);
        }

        const price = (product as any).productNewPrice || (product as any).productOldPrice || 0;
        const itemTotal = price * item.quantity;
        subtotal += itemTotal;

        populatedProducts.push({
          product: item.product,
          quantity: item.quantity,
          itemDiscount: item.itemDiscount || 0,
          // Store for PayLink
          _productData: {
            name: (product as any).productNameEn || (product as any).productNameAr || "Product",
            price: price,
          }
        });
      }

      const orderDiscount = body.orderDiscount || 0;
      const discountAmount = subtotal * (orderDiscount / 100);
      const total = subtotal - discountAmount;

      // 5. Create Order in Database
      const orderData = {
        customer: customerId || undefined,
        products: populatedProducts.map(p => ({
          product: p.product,
          quantity: p.quantity,
          itemDiscount: p.itemDiscount,
        })),
        shippingAddress: {
          fullName: shippingAddress.fullName,
          phone: shippingAddress.phone,
          street: shippingAddress.street,
          city: shippingAddress.city,
          region: shippingAddress.region || "",
          postalCode: shippingAddress.postalCode || "",
          country: shippingAddress.country || "Saudi Arabia",
        },
        payment: {
          method: body.paymentMethod || "cod",
          status: "pending",
        },
        orderQuantity: body.products.reduce((sum, p) => sum + p.quantity, 0).toString(),
        subtotal,
        orderDiscount,
        total,
        orderStatus: "pending",
      };

      const order = await OrderModel.create(orderData);
      createdOrderId = order._id.toString();
      console.log(`[OrderFacade] Order created: ${createdOrderId}`);

      // 6. Handle Payment Method
      if (body.paymentMethod === "paylink") {
        // Create PayLink Invoice
        const customerData = customerId
          ? await CustomerModel.findById(customerId)
          : null;

        // User is redirected here after payment
        const callbackUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/orders/${order._id}/status`;

        let invoiceResult;
        try {
          invoiceResult = await PayLinkService.createInvoice(
            {
              ...order.toObject(),
              products: populatedProducts,
              total
            },
            customerData,
            callbackUrl
          );
        } catch (paymentError: any) {
          // ⚠️ ROLLBACK: PayLink failed — delete the orphaned order
          console.error(`[OrderFacade] PayLink invoice failed, rolling back order ${createdOrderId}:`, paymentError.message);
          if (createdOrderId) {
            await OrderModel.findByIdAndDelete(createdOrderId);
            createdOrderId = null;
          }
          throw new ApiError(
            "BAD_REQUEST",
            `Payment initiation failed: ${paymentError.message || "Payment gateway error"}. Order was not created.`
          );
        }

        // Update order with payment info
        await OrderModel.findByIdAndUpdate(order._id, {
          "payment.transactionId": invoiceResult.transactionNo,
          "payment.paymentUrl": invoiceResult.url,
          "payment.invoiceId": invoiceResult.transactionNo,
        });

        const updatedOrder = await OrderModel.findById(order._id)
          .populate("customer", "customerName customerEmail customerPhone")
          .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice productImage");

        return {
          order: updatedOrder,
          paymentUrl: invoiceResult.url,
          message: "Order created. Please complete payment.",
        };
      }

      // COD - No payment URL needed
      const populatedOrder = await OrderModel.findById(order._id)
        .populate("customer", "customerName customerEmail customerPhone")
        .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice productImage");

      return {
        order: populatedOrder,
        message: "Order created successfully. Cash on delivery.",
      };

    } catch (error: any) {
      console.error("[OrderFacade] initiateOrder error:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError("INTERNAL_SERVER_ERROR", "Failed to create order");
    }
  }

  /**
   * STEP 2: Handle Payment Callback (Webhook)
   * 
   * Called by PayLink when payment is completed/failed.
   * Updates order status and sends confirmation email.
   */
  public async handlePaymentCallback(transactionNo: string, paymentStatus: string): Promise<any> {
    try {
      console.log(`[OrderFacade] Payment callback: ${transactionNo} -> ${paymentStatus}`);

      // 1. Find order by transaction ID
      const order = await OrderModel.findOne({ "payment.transactionId": transactionNo })
        .populate("customer", "customerName customerEmail customerPhone")
        .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice productImage");

      if (!order) {
        console.error(`[OrderFacade] Order not found for transaction: ${transactionNo}`);
        throw new ApiError("NOT_FOUND", "Order not found for this transaction");
      }

      // 2. Idempotency check - already processed
      if ((order as any).payment?.status === "paid" && paymentStatus === "paid") {
        console.log(`[OrderFacade] Order ${order._id} already paid, skipping...`);
        return order;
      }

      // 3. Verify payment with PayLink (security check)
      const invoiceDetails = await PayLinkService.getInvoice(transactionNo);
      const verifiedStatus = invoiceDetails.orderStatus?.toLowerCase() || paymentStatus;

      console.log(`[OrderFacade] PayLink verified status: ${verifiedStatus} (passed: ${paymentStatus})`);

      // 4. Update order based on payment status
      const updateData: any = {};

      if (verifiedStatus === "paid") {
        updateData["payment.status"] = "paid";
        updateData["payment.paidAt"] = new Date();
        updateData["orderStatus"] = "confirmed";
      } else if (verifiedStatus === "pending" || verifiedStatus === "processing") {
        // Payment still processing — keep as pending, don't mark as failed
        updateData["payment.status"] = "pending";
      } else {
        // Explicitly failed/cancelled
        updateData["payment.status"] = "failed";
      }

      const updatedOrder = await OrderModel.findByIdAndUpdate(order._id, updateData, { new: true })
        .populate("customer", "customerName customerEmail customerPhone")
        .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice productImage");

      // 5. Send confirmation email if paid
      if (verifiedStatus === "paid") {
        const customerEmail = (updatedOrder as any)?.customer?.customerEmail ||
          (updatedOrder as any)?.shippingAddress?.email;

        if (customerEmail) {
          try {
            await sendOrderConfirmation(customerEmail, updatedOrder);
            console.log(`[OrderFacade] Confirmation email sent to ${customerEmail}`);
          } catch (emailErr) {
            console.error("[OrderFacade] Failed to send confirmation email:", emailErr);
            // Don't fail the webhook for email errors
          }
        }
      }

      console.log(`[OrderFacade] Order ${order._id} payment updated to ${verifiedStatus}`);
      return updatedOrder;

    } catch (error: any) {
      console.error("[OrderFacade] handlePaymentCallback error:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError("INTERNAL_SERVER_ERROR", "Failed to process payment callback");
    }
  }

  /**
   * STEP 3: Ship Order (Admin action)
   * 
   * Creates shipment with J&T Express and sends tracking email.
   */
  public async shipOrder(orderId: string): Promise<ShipOrderResult> {
    try {
      // 1. Get order
      const order = await OrderModel.findById(orderId)
        .populate("customer", "customerName customerEmail customerPhone customerAddress")
        .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice");

      if (!order) {
        throw new ApiError("NOT_FOUND", "Order not found");
      }

      // 2. Validate order can be shipped
      if ((order as any).orderStatus === "shipped" || (order as any).orderStatus === "delivered") {
        throw new ApiError("BAD_REQUEST", "Order already shipped");
      }

      if ((order as any).orderStatus === "cancelled") {
        throw new ApiError("BAD_REQUEST", "Cannot ship cancelled order");
      }

      // 3. Prepare shipping data
      const customer = (order as any).customer;
      const address = (order as any).shippingAddress || {};

      const shippingAddress = {
        fullName: address.fullName || customer?.customerName || "Customer",
        phone: address.phone || customer?.customerPhone || "",
        street: address.street || customer?.customerAddress || "",
        city: address.city || "",
        region: address.region || "Riyadh",
        postalCode: address.postalCode || "00000",
        country: address.country || "Saudi Arabia",
      };

      // 4. Create shipment with J&T
      const shipmentResult = await JTExpressService.createShipment(order, customer, shippingAddress);

      // Extract tracking info from J&T response
      const data = shipmentResult.data || shipmentResult;
      const trackingNumber = data.billCode || data.logisticId || shipmentResult.billCode || "";
      const labelUrl = data.waybillURL || data.labelUrl || "";

      if (!trackingNumber) {
        console.warn("[OrderFacade] Shipment created but no tracking number received");
      }

      // 5. Update order with shipping info
      const updatedOrder = await OrderModel.findByIdAndUpdate(
        orderId,
        {
          shipping: {
            carrier: "jt_express",
            trackingNumber,
            status: "shipped",
            labelUrl,
          },
          orderStatus: "shipped",
        },
        { new: true }
      )
        .populate("customer", "customerName customerEmail customerPhone")
        .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice productImage");

      // 6. Send shipment notification email
      const customerEmail = (updatedOrder as any)?.customer?.customerEmail;
      if (customerEmail && trackingNumber) {
        try {
          await sendShipmentNotification(customerEmail, updatedOrder, {
            carrier: "J&T Express",
            trackingNumber,
            trackingUrl: `https://www.jtexpress.com/track?billcode=${trackingNumber}`,
          });
          console.log(`[OrderFacade] Shipment notification sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error("[OrderFacade] Failed to send shipment email:", emailErr);
        }
      }

      console.log(`[OrderFacade] Order ${orderId} shipped with tracking: ${trackingNumber}`);

      return {
        order: updatedOrder,
        trackingNumber,
        labelUrl,
        message: "Order shipped successfully",
      };

    } catch (error: any) {
      console.error("[OrderFacade] shipOrder error:", error);
      if (error instanceof ApiError) throw error;
      throw new ApiError("INTERNAL_SERVER_ERROR", "Failed to ship order");
    }
  }
}

export default new OrderFacade();
