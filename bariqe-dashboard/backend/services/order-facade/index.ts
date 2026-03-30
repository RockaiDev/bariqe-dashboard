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
import { sendOrderConfirmation, sendShipmentNotification, sendNewOrderEmail } from "../email";
import ApiError from "../../utils/errors/ApiError";
import OrderService from "../mongodb/orders";

const orderService = new OrderService();

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
    nationalAddress?: string;
    country?: string;
  };
  customerEmail?: string; // For guest orders
  paymentMethod?: "cod";
  orderDiscount?: number;
  notes?: string;
  callbackUrl?: string; // Optional: override the default PayLink callback URL
}

const parseDiscountPercent = (discount: any): number => {
  if (discount === undefined || discount === null) return 0;
  if (typeof discount === "number") return discount;
  const match = String(discount)
    .replace(",", ".")
    .match(/-?\d+(\.\d+)?/);
  return match ? parseFloat(match[0]) || 0 : 0;
};

const resolveFrontendUrl = (): string => {
  const raw = process.env.FRONTEND_URL || "http://localhost:3000";
  return raw.split(',')[0].trim();
};

export interface InitiateOrderResult {
  order: any;
  message: string;
}

export interface ShipOrderResult {
  order: any;
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

        const originalPrice = (product as any).productOldPrice || 0;
        const itemDiscount = item.itemDiscount || 0;
        const basePrice = itemDiscount > 0 
          ? originalPrice 
          : ((product as any).productNewPrice || originalPrice);
        
        const unitPriceAfterItemDiscount = basePrice * (1 - itemDiscount / 100);
        const itemTotal = unitPriceAfterItemDiscount * item.quantity;
        subtotal += itemTotal;

        populatedProducts.push({
          product: item.product,
          quantity: item.quantity,
          itemDiscount: itemDiscount,
          _productData: {
            name:
              (product as any).productNameEn ||
              (product as any).productNameAr ||
              "Product",
            price: unitPriceAfterItemDiscount,
            productOldPrice: originalPrice,
            productDiscount: itemDiscount > 0 ? itemDiscount : (product as any).productDiscount,
            productDescriptionEn: (product as any).productDescriptionEn,
            productDescriptionAr: (product as any).productDescriptionAr,
            productImage: (product as any).productImage,
          },
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
          nationalAddress: shippingAddress.nationalAddress || "",
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

      // Mark as confirmed immediately
      await OrderModel.findByIdAndUpdate(order._id, {
        orderStatus: "confirmed",
      });

      // 🔄 Decrement stock for the ordered products immediately
      for (const item of orderData.products) {
        if (item.product && item.quantity > 0) {
          await ProductModel.findByIdAndUpdate(item.product, {
            $inc: { amount: -item.quantity }
          }).catch(e => console.error("[OrderFacade] Failed to decrement stock:", e));
        }
      }

      const populatedOrder = await OrderModel.findById(order._id)
        .populate("customer", "customerName customerEmail customerPhone")
        .populate("products.product", "productNameAr productNameEn productNewPrice productOldPrice productImage");

      const customerEmail = (populatedOrder as any)?.customer?.customerEmail || body.customerEmail;
      
      // ✅ 1. Send Order Confirmation to Customer
      if (customerEmail) {
        sendOrderConfirmation(customerEmail, populatedOrder).catch(e => {
          console.error("[OrderFacade] Failed to send order confirmation to customer:", e);
        });
      }

      // ✅ 2. Send New Order Notification to Admin
      try {
        const po: any = populatedOrder as any;
        const emailCustomerName = po?.customer?.customerName || po?.shippingAddress?.fullName || "Guest";
        const emailCustomerPhone = po?.customer?.customerPhone || po?.shippingAddress?.phone || "N/A";
        const emailCustomerAddress = po?.customer?.customerAddress || po?.shippingAddress?.street || "N/A";

        const mailOrder: any = {
          _id: po?._id,
          status: po?.orderStatus || po?.status || "pending",
          createdAt: po?.createdAt,
          notes: po?.notes,
          customer: {
            name: emailCustomerName,
            email: customerEmail || "N/A",
            phone: emailCustomerPhone,
            address: emailCustomerAddress,
          },
          products: [],
          totalAmount: 0,
        };

        const orderLevelDiscount = po?.orderDiscount || 0;
        if (Array.isArray(po?.products)) {
          for (const item of po.products) {
            const prod: any = item.product || {};
            const itemDiscount = item.itemDiscount || 0;
            const originalPrice = prod.productOldPrice || 0;
            const qty = item.quantity || 0;
            const subtotal = originalPrice * qty;
            const afterItemDiscount = subtotal * (1 - itemDiscount / 100); 
            const finalAmount = afterItemDiscount * (1 - orderLevelDiscount / 100);
            mailOrder.products.push({
              product: {
                name: prod.productNameEn || prod.productNameAr || prod.name || prod.productName || "N/A",
              },
              quantity: qty,
              price: originalPrice,
              itemDiscount,
              subtotal,
              afterItemDiscount,
              finalAmount,
            });
            mailOrder.totalAmount += finalAmount;
          }
        }
        sendNewOrderEmail(mailOrder).catch((e) => {
          console.error("[OrderFacade] Failed to send new order email to admin:", e);
        });
      } catch (e) {
        console.error("[OrderFacade] Error triggering admin email:", e);
      }

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
        nationalAddress: address.nationalAddress || "",
        country: address.country || "Saudi Arabia",
      };

      // Update order status (via EditOneOrder for centralized stock management)
      const updatedOrder = await orderService.EditOneOrder(orderId, {
        orderStatus: "shipped",
      });

      // Send shipment notification email
      const customerEmail = (updatedOrder as any)?.customer?.customerEmail;
      if (customerEmail) {
        try {
          // Sending generic shipment email
          await sendShipmentNotification(customerEmail, updatedOrder, {
            carrier: "Local Delivery",
            trackingNumber: "N/A",
            trackingUrl: "",
          });
          console.log(`[OrderFacade] Shipment notification sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error("[OrderFacade] Failed to send shipment email:", emailErr);
        }
      }

      console.log(`[OrderFacade] Order ${orderId} shipped locally.`);

      return {
        order: updatedOrder,
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
