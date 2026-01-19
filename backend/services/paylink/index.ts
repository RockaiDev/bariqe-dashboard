import axios from "axios";
import ApiError from "../../utils/errors/ApiError";

const PAYLINK_APP_ID = process.env.PAYLINK_APP_ID;
const PAYLINK_SECRET_KEY = process.env.PAYLINK_SECRET_KEY;
const PAYLINK_BASE_URL = process.env.PAYLINK_BASE_URL || "https://restpilot.paylink.sa"; // Default to sandbox

export class PayLinkService {
  private async getAuthHeader() {
    // PayLink relies on App ID and Secret Key being valid. 
    // Usually sent as headers or part of the auth flow. 
    // According to docs, we get a bearer token first.
    
    try {
      const response = await axios.post(`${PAYLINK_BASE_URL}/api/auth`, {
        apiId: PAYLINK_APP_ID,
        secretKey: PAYLINK_SECRET_KEY,
        persistToken: false
      });
      return response.data.id_token;
    } catch (error: any) {
      console.error("PayLink Auth Error:", error.response?.data || error.message);
      throw new ApiError("INTERNAL_SERVER_ERROR", "Payment gateway authentication failed");
    }
  }

  public async createInvoice(order: any, customer: any, callbackUrl: string) {
    try {
      const token = await this.getAuthHeader();
     
      // ✅ Resolve customer info (Auth Customer OR Shipping Address for guests)
      const customerName = customer?.customerName || order.shippingAddress?.fullName || "Customer";
      const customerEmail = customer?.customerEmail || order.customerEmail || "customer@example.com";
      const customerPhone = (customer?.customerPhone || order.shippingAddress?.phone || "0500000000")
        .replace(/^\+966/, "0"); // Convert to local format
      
      // ✅ Calculate total if not set (sum of product prices * quantities)
      let orderTotal = order.total || order.orderTotal || 0;
      if (!orderTotal && order.products?.length > 0) {
        orderTotal = order.products.reduce((sum: number, p: any) => {
          const product = p.product || p._productData || {};
          const price = product.productNewPrice || product.productOldPrice || product.price || 0;
          const qty = p.quantity || 1;
          return sum + (price * qty);
        }, 0);
      }

      // ✅ Map products to PayLink format
      const paylinkProducts = (order.products || []).map((p: any) => {
        const product = p.product || p._productData || {};
        const price = product.productNewPrice || product.productOldPrice || product.price || 0;
        return {
          title: product.productNameEn || product.productNameAr || product.name || "Product",
          description: product.productDescriptionEn || product.productDescriptionAr || "",
          price: price,
          qty: p.quantity || 1,
          imageSrc: product.productImage || "",
          isDigital: false,
          productCost: 0,
          specificVat: 0,
        };
      });

      const payload = {
        amount: orderTotal,
        callBackUrl: callbackUrl,
        cancelUrl: `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/cancelled`,
        clientEmail: customerEmail,
        clientMobile: customerPhone,
        clientName: customerName,
        currency: "SAR",
        note: `Order #${order._id}`,
        orderNumber: order._id?.toString() || `ORDER-${Date.now()}`,
        products: paylinkProducts.length > 0 ? paylinkProducts : [{
          title: "Order Payment",
          description: "Payment for your order",
          price: orderTotal,
          qty: 1,
          isDigital: false,
          productCost: 0,
          specificVat: 0,
        }]
      };
      
      console.log("[PayLinkService] Full Payload:", JSON.stringify(payload, null, 2));

      const response = await axios.post(`${PAYLINK_BASE_URL}/api/addInvoice`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          accept: "application/json"
        }
      });

      console.log("[PayLinkService] Invoice created:", response.data.transactionNo);
      return response.data; // Should return { transactionNo: "...", url: "..." }
    } catch (error: any) {
      const errorDetail = error.response?.data?.title || error.response?.data?.detail || JSON.stringify(error.response?.data) || error.message;
      console.error("PayLink Create Invoice Error:", errorDetail);
      throw new ApiError("BAD_REQUEST", `Failed to initiate payment: ${errorDetail}`);
    }
  }

  public async getInvoice(transactionNo: string) {
    try {
      const token = await this.getAuthHeader();
      
      const response = await axios.get(`${PAYLINK_BASE_URL}/api/getInvoice/${transactionNo}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      return response.data;
    } catch (error: any) {
      console.error("PayLink Get Invoice Error:", error.response?.data || error.message);
      throw new ApiError("NOT_FOUND", "Payment details not found");
    }
  }
}

export default new PayLinkService();
