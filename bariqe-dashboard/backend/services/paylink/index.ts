import axios, { AxiosInstance } from "axios";
import ApiError from "../../utils/errors/ApiError";

const PAYLINK_APP_ID = process.env.PAYLINK_APP_ID;
const PAYLINK_SECRET_KEY = process.env.PAYLINK_SECRET_KEY;
const PAYLINK_BASE_URL = process.env.PAYLINK_BASE_URL || "https://restpilot.paylink.sa"; // Default to sandbox

// Timeout in milliseconds – keeps the browser from dropping the connection.
// PayLink auth must respond within this window; if it doesn't, we fail fast.
const REQUEST_TIMEOUT_MS = parseInt(process.env.PAYLINK_TIMEOUT_MS || "15000", 10);

// Safely resolve the first URL from a potentially comma-separated FRONTEND_URL
const FRONTEND_BASE_URL = (process.env.FRONTEND_URL || "http://localhost:3000")
  .split(",")[0]
  .trim();

// ─── Axios instance with a hard timeout ─────────────────────────────────────
const paylinkAxios: AxiosInstance = axios.create({
  baseURL: PAYLINK_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    accept: "application/json",
  },
});

// ─── Retry helper ────────────────────────────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delayMs = 1500
): Promise<T> {
  let lastError: any;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const isTimeout = err.code === "ECONNABORTED" || err.message?.includes("timeout");
      const isNetworkErr = err.code === "ECONNREFUSED" || err.code === "ENOTFOUND";

      if (attempt < retries && (isTimeout || isNetworkErr)) {
        console.warn(
          `[PayLinkService] Attempt ${attempt}/${retries} failed (${err.code || err.message}). Retrying in ${delayMs}ms…`
        );
        await new Promise((r) => setTimeout(r, delayMs));
        delayMs *= 2; // exponential back-off
      } else {
        break;
      }
    }
  }
  throw lastError;
}

// ─── Service class ────────────────────────────────────────────────────────────
export class PayLinkService {
  /**
   * Authenticates with PayLink and returns a bearer token.
   * Throws ApiError immediately if credentials are missing or auth times out.
   */
  private async getAuthHeader(): Promise<string> {
    if (!PAYLINK_APP_ID || !PAYLINK_SECRET_KEY) {
      console.error("[PayLinkService] PAYLINK_APP_ID or PAYLINK_SECRET_KEY is not set in .env");
      throw new ApiError("INTERNAL_SERVER_ERROR", "Payment gateway is not configured. Please contact support.");
    }

    console.log(`[PayLinkService] Authenticating with ${PAYLINK_BASE_URL} (timeout: ${REQUEST_TIMEOUT_MS}ms)`);
    console.log(`[PayLinkService] App ID: ${PAYLINK_APP_ID?.slice(0, 10)}…`);

    try {
      const response = await withRetry(() =>
        paylinkAxios.post("/api/auth", {
          apiId: PAYLINK_APP_ID,
          secretKey: PAYLINK_SECRET_KEY,
          persistToken: false,
        })
      );

      const token = response.data?.id_token;
      if (!token) {
        console.error("[PayLinkService] Auth succeeded but no id_token in response:", response.data);
        throw new ApiError("INTERNAL_SERVER_ERROR", "Payment gateway returned an invalid auth response.");
      }

      console.log("[PayLinkService] Authentication successful.");
      return token;
    } catch (error: any) {
      // Distinguish between timeout vs. rejected credentials vs. other errors
      if (error instanceof ApiError) throw error;

      const statusCode: number | undefined = error.response?.status;
      const responseData = error.response?.data;
      const isTimeout = error.code === "ECONNABORTED" || error.message?.includes("timeout");
      const isNetworkErr = !error.response;

      if (isTimeout) {
        console.error(
          `[PayLinkService] Auth TIMED OUT after ${REQUEST_TIMEOUT_MS}ms. ` +
          "The VPS IP may be blocked by PayLink, or the PayLink endpoint is unreachable. " +
          `URL: ${PAYLINK_BASE_URL}/api/auth`
        );
        throw new ApiError(
          "INTERNAL_SERVER_ERROR",
          "Payment gateway is unreachable (timeout). Please try again later or contact support."
        );
      }

      if (isNetworkErr) {
        console.error(
          `[PayLinkService] Network error reaching PayLink: ${error.code} – ${error.message}. ` +
          `URL: ${PAYLINK_BASE_URL}/api/auth`
        );
        throw new ApiError(
          "INTERNAL_SERVER_ERROR",
          "Network error connecting to payment gateway. Please try again later."
        );
      }

      if (statusCode === 401 || statusCode === 403) {
        console.error(
          `[PayLinkService] Auth REJECTED by PayLink (${statusCode}). ` +
          "Check PAYLINK_APP_ID and PAYLINK_SECRET_KEY in .env. " +
          "Also verify the correct PAYLINK_BASE_URL (sandbox: restpilot.paylink.sa / production: orderpilot.paylink.sa).",
          responseData
        );
        throw new ApiError(
          "INTERNAL_SERVER_ERROR",
          "Payment gateway rejected the credentials. Please contact support."
        );
      }

      console.error(
        `[PayLinkService] Auth Error (HTTP ${statusCode}):`,
        responseData || error.message
      );
      throw new ApiError("INTERNAL_SERVER_ERROR", "Payment gateway authentication failed.");
    }
  }

  // ─── Create Invoice ────────────────────────────────────────────────────────
  public async createInvoice(order: any, customer: any, callbackUrl: string) {
    try {
      const token = await this.getAuthHeader();

      // ✅ Resolve customer info (Auth Customer OR Shipping Address for guests)
      const customerName =
        customer?.customerName || order.shippingAddress?.fullName || "Customer";
      const customerEmail =
        customer?.customerEmail || order.customerEmail || "customer@example.com";
      const customerPhone = (
        customer?.customerPhone ||
        order.shippingAddress?.phone ||
        "0500000000"
      ).replace(/^\+966/, "0"); // Convert +966 to local format

      // ✅ Calculate total if not set
      let orderTotal = order.total || order.orderTotal || 0;
      if (!orderTotal && order.products?.length > 0) {
        orderTotal = order.products.reduce((sum: number, p: any) => {
          const product = p.product || p._productData || {};
          const price =
            product.productNewPrice ||
            product.productOldPrice ||
            product.price ||
            0;
          const qty = p.quantity || 1;
          return sum + price * qty;
        }, 0);
      }

      // Guard: PayLink requires a positive amount
      if (!orderTotal || orderTotal <= 0) {
        throw new ApiError("BAD_REQUEST", "Order total must be greater than 0 to initiate payment.");
      }

      // ✅ Map products to PayLink format
      const paylinkProducts = (order.products || []).map((p: any) => {
        const product = p.product || p._productData || {};
        const price =
          product.productNewPrice ||
          product.productOldPrice ||
          product.price ||
          0;
        return {
          title:
            product.productNameEn ||
            product.productNameAr ||
            product.name ||
            "Product",
          description:
            product.productDescriptionEn || product.productDescriptionAr || "",
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
        cancelUrl: `${FRONTEND_BASE_URL}/checkout/cancelled`,
        clientEmail: customerEmail,
        clientMobile: customerPhone,
        clientName: customerName,
        currency: "SAR",
        note: `Order #${order._id}`,
        orderNumber: order._id?.toString() || `ORDER-${Date.now()}`,
        products:
          paylinkProducts.length > 0
            ? paylinkProducts
            : [
              {
                title: "Order Payment",
                description: "Payment for your order",
                price: orderTotal,
                qty: 1,
                isDigital: false,
                productCost: 0,
                specificVat: 0,
              },
            ],
      };

      console.log(
        "[PayLinkService] Creating invoice for order:",
        order._id,
        `amount=${orderTotal} SAR`,
        `callbackUrl=${callbackUrl}`
      );

      const response = await withRetry(() =>
        paylinkAxios.post("/api/addInvoice", payload, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      console.log("[PayLinkService] Invoice created:", response.data.transactionNo);
      return response.data; // { transactionNo: "…", url: "…" }
    } catch (error: any) {
      if (error instanceof ApiError) throw error;

      const isTimeout = error.code === "ECONNABORTED" || error.message?.includes("timeout");
      if (isTimeout) {
        console.error("[PayLinkService] createInvoice timed out");
        throw new ApiError("INTERNAL_SERVER_ERROR", "Payment gateway timed out while creating invoice.");
      }

      const errorDetail =
        error.response?.data?.title ||
        error.response?.data?.detail ||
        JSON.stringify(error.response?.data) ||
        error.message;
      console.error("PayLink Create Invoice Error:", errorDetail);
      throw new ApiError("BAD_REQUEST", `Failed to initiate payment: ${errorDetail}`);
    }
  }

  // ─── Get Invoice ───────────────────────────────────────────────────────────
  public async getInvoice(transactionNo: string) {
    try {
      const token = await this.getAuthHeader();

      const response = await withRetry(() =>
        paylinkAxios.get(`/api/getInvoice/${transactionNo}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      );

      return response.data;
    } catch (error: any) {
      if (error instanceof ApiError) throw error;

      console.error(
        "PayLink Get Invoice Error:",
        error.response?.data || error.message
      );
      throw new ApiError("NOT_FOUND", "Payment details not found.");
    }
  }

  // ─── Test Connection (Diagnostic) ─────────────────────────────────────────
  /**
   * Call this from a diagnostic admin route (e.g. GET /api/admin/paylink-test)
   * to verify that the VPS can reach PayLink and that the credentials are valid.
   */
  public async testConnection(): Promise<{
    success: boolean;
    baseUrl: string;
    appId: string | undefined;
    latencyMs: number;
    error?: string;
  }> {
    const start = Date.now();
    try {
      await this.getAuthHeader();
      return {
        success: true,
        baseUrl: PAYLINK_BASE_URL,
        appId: PAYLINK_APP_ID,
        latencyMs: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        baseUrl: PAYLINK_BASE_URL,
        appId: PAYLINK_APP_ID,
        latencyMs: Date.now() - start,
        error: err.message,
      };
    }
  }
}

export default new PayLinkService();
