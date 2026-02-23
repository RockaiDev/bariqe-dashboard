/**
 * ============================================================================
 * J&T EXPRESS SHIPPING SERVICE — Saudi Arabia Open API
 * ============================================================================
 *
 * Implements the J&T SA Open Platform API for:
 *   - Creating / modifying shipment orders (addOrder)
 *   - Tracking shipments (future)
 *
 * Auth flow (two-layer signature):
 *   1. HEADER digest  → Base64(MD5( bizContentJSON + privateKey ))
 *   2. BIZ    digest  → Base64(MD5( customerCode + ciphertext + privateKey ))
 *      where ciphertext = MD5( plainPassword + "jadada236t2" ).toUpperCase()
 *
 * Docs reference: webopenplatformapi/api/order/addOrder
 */

import axios from "axios";
import crypto from "crypto";
import ApiError from "../../utils/errors/ApiError";

// ─── Environment Variables ───────────────────────────────────────────────────

const JT_API_ACCOUNT = process.env.JT_API_ACCOUNT;      // Header: apiAccount
const JT_PRIVATE_KEY = process.env.JT_PRIVATE_KEY;       // Used in both signatures
const JT_CUSTOMER_CODE = process.env.JT_CUSTOMER_CODE;     // bizContent: customerCode
const JT_PASSWORD = process.env.JT_PASSWORD;          // Plaintext password for biz digest
const JT_DIGEST_TYPE = parseInt(process.env.JT_DIGEST_TYPE || "1", 10); // 1=MD5, 2=SHA256
const JT_BASE_URL = process.env.JT_BASE_URL || "https://openapi.jtjms-sa.com";

// ─── Sender defaults (configurable via env) ─────────────────────────────────

const SENDER_NAME = process.env.JT_SENDER_NAME || "Bariqe El Tamioz";
const SENDER_MOBILE = process.env.JT_SENDER_MOBILE || "0500000000";
const SENDER_COUNTRY_CODE = process.env.JT_SENDER_COUNTRY_CODE || "KSA";
const SENDER_PROV = process.env.JT_SENDER_PROV || "Riyadh";
const SENDER_CITY = process.env.JT_SENDER_CITY || "Riyadh";
const SENDER_AREA = process.env.JT_SENDER_AREA || "Riyadh";
const SENDER_ADDRESS = process.env.JT_SENDER_ADDRESS || "Riyadh, Saudi Arabia";
const SENDER_SHORT_ADDR = process.env.JT_SENDER_SHORT_ADDR || "";

// ─── J&T Error Code Map ─────────────────────────────────────────────────────

const JT_ERROR_CODES: Record<string, string> = {
  "1": "Success",
  "0": "Failure",
  "145003030": "Headers signature verification failed",
  "145003040": "Internal call exception",
  "145003071": "apiAccount is empty",
  "145003052": "digest is empty",
  "145003053": "timestamp is empty",
  "145005000": "System error",
  "145003050": "Illegal parameters",
  "145003031": "Business parameter signature verification failed",
  "145003042": "Order modification failed",
  "145003060": "Illegal region",
  "145003061": "Illegal city",
  "145003062": "Illegal province",
  "145003064": "Data not found",
  "145003041": "Order placement failed",
  "145003083": "Incomplete sender information",
  "145002001": "Duplicate order",
  "145003084": "Incomplete recipient information",
  "145003085": "Phone number cannot be empty",
  "145003086": "Incomplete address information",
  "145003087": "Illegal order/service/delivery/item/shipment type or settlement method",
  "145003200": "Illegal service type (must be 01 or 02)",
  "145003088": "Incomplete service time information",
  "145003092": "Illegal weight information",
  "145003093": "Incomplete item information",
  "145003094": "Incomplete item name",
  "145003095": "Incomplete item type",
  "145003101": "Customer order number already exists",
  "145003103": "Illegal name information",
  "145003104": "Company information too long",
  "145003105": "Contact information too long",
  "145003106": "Postcode or email address illegal",
  "145003107": "Price information illegal",
  "145003108": "Comments, descriptions, links illegal",
  "145003109": "Too much address information",
  "145003110": "Street information too long",
  "145003111": "Invalid total number of parcels",
  "145003112": "COD service not opened",
  "145003113": "Payment method mismatch (PP_CASH, CC_CASH, PP_MM)",
  "145003201": "Picked up status cannot be modified",
  "145003202": "Cancelled status cannot be modified",
  "145003203": "Updating order failed, try again later",
  "145005500": "Insurance service not yet available",
  "145005501": "Insured amount must be >= 0",
};

// ─── Types ───────────────────────────────────────────────────────────────────

export interface JTCreateShipmentInput {
  /** Internal order object (populated with products) */
  order: any;
  /** Shipping address snapshot */
  shippingAddress: {
    fullName: string;
    phone: string;
    street: string;
    city: string;
    region: string;
    postalCode?: string;
    nationalAddress?: string;
    country?: string;
    shortAddress?: string;
  };
  /** Optional: customer object for email/company info */
  customer?: any;
  /** 1 = Add, 2 = Modify */
  operateType?: 1 | 2;
  /** Required when operateType = 2 */
  billCode?: string;
  /** Express type: EZKSA (default), EZ, Reverse, SDD, etc. */
  expressType?: string;
  /** COD amount (numeric string) */
  codAmount?: number;
  /** COD currency */
  codCurrency?: string;
}

export interface JTCreateShipmentResult {
  txlogisticId: string;
  billCode: string;
  sortingCode: string;
  createOrderTime: string;
  lastCenterName?: string;
  sumFreight?: string;
}

// ─── Service Class ───────────────────────────────────────────────────────────

export class JTExpressService {

  /**
   * Validates that required environment variables are set.
   */
  private validateConfig(): void {
    if (!JT_API_ACCOUNT) throw new ApiError("INTERNAL_SERVER_ERROR", "JT_API_ACCOUNT not configured");
    if (!JT_PRIVATE_KEY) throw new ApiError("INTERNAL_SERVER_ERROR", "JT_PRIVATE_KEY not configured");
    if (!JT_CUSTOMER_CODE) throw new ApiError("INTERNAL_SERVER_ERROR", "JT_CUSTOMER_CODE not configured");
    if (!JT_PASSWORD) throw new ApiError("INTERNAL_SERVER_ERROR", "JT_PASSWORD not configured");
  }

  // ─── Signature Generation ──────────────────────────────────────────────────

  /**
   * HEADER digest: Base64(MD5( bizContentJSON + privateKey ))
   * Used in the `digest` HTTP header.
   */
  private generateHeaderDigest(bizContentJson: string): string {
    const raw = bizContentJson + JT_PRIVATE_KEY;

    if (JT_DIGEST_TYPE === 2) {
      // SHA256
      return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
    }

    // MD5 (default)
    return crypto.createHash("md5").update(raw, "utf8").digest("base64");
  }

  /**
   * BUSINESS PARAMETER digest (inside bizContent):
   *
   *   MD5 signature:
   *     ciphertext = MD5( plainPassword + "jadada236t2" ).toUpperCase()
   *     digest     = Base64( MD5( customerCode + ciphertext + privateKey ) )
   *
   *   SHA256 signature:
   *     ciphertext = SHA256( plainPassword )
   *     digest     = SHA256( customerCode + ciphertext + privateKey )
   */
  private generateBizDigest(): string {
    if (JT_DIGEST_TYPE === 2) {
      const ciphertext = crypto.createHash("sha256").update(JT_PASSWORD!, "utf8").digest("hex");
      return crypto.createHash("sha256").update(JT_CUSTOMER_CODE + ciphertext + JT_PRIVATE_KEY, "utf8").digest("hex");
    }

    // MD5 (default)
    const ciphertext = crypto.createHash("md5").update(JT_PASSWORD + "jadada236t2", "utf8").digest("hex").toUpperCase();
    const raw = JT_CUSTOMER_CODE + ciphertext + JT_PRIVATE_KEY;
    return crypto.createHash("md5").update(raw, "utf8").digest("base64");
  }

  // ─── API Request ───────────────────────────────────────────────────────────

  /**
   * Sends a request to the J&T SA Open API.
   *
   * Headers: apiAccount, digest, timestamp, [digestType]
   * Body:    bizContent (URL-encoded form)
   */
  private async sendRequest(endpoint: string, bizContent: Record<string, any>): Promise<any> {
    this.validateConfig();

     const bizContentJson = JSON.stringify(bizContent)
    const headerDigest = this.generateHeaderDigest(bizContentJson);
    const timestamp = Date.now().toString();

    const headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
      apiAccount: JT_API_ACCOUNT!,
      digest: headerDigest,
      timestamp,
    };

    if (JT_DIGEST_TYPE === 2) {
      headers.digestType = "2";
    }

    const formData = new URLSearchParams();
    formData.append("bizContent", bizContentJson);

    const url = `${JT_BASE_URL}${endpoint}`;
    console.log(`[JTExpress] POST ${url}`);
    console.log(`[JTExpress] bizContent:`, bizContentJson);

    try {
      const response = await axios.post(url, formData.toString(), { headers });
      console.log(`[JTExpress] Response:`, JSON.stringify(response.data));
      return response.data;
    } catch (error: any) {
      const errorData = error.response?.data;
      console.error(`[JTExpress] API Error (${endpoint}):`, errorData || error.message);

      if (errorData?.code) {
        const msg = JT_ERROR_CODES[String(errorData.code)] || errorData.msg || "Unknown error";
        throw new ApiError("BAD_GATEWAY", `J&T Error [${errorData.code}]: ${msg}`);
      }

      throw new ApiError("BAD_GATEWAY", "Shipping service unavailable");
    }
  }

  // ─── Public Methods ────────────────────────────────────────────────────────

  /**
   * Creates (or modifies) a shipment order with J&T Express SA.
   *
   * Maps internal order data to J&T SA addOrder payload format.
   */
  public async createShipment(input: JTCreateShipmentInput): Promise<JTCreateShipmentResult> {
    const { order, shippingAddress, customer, operateType = 1, billCode, expressType = "EZKSA" } = input;

    // Generate the business-layer digest
    const bizDigest = this.generateBizDigest();

    // Sanitize phone number: remove duplicate country codes, normalize to local format
    const sanitizePhone = (phone: string): string => {
      if (!phone) return "";
      let cleaned = phone.trim().replace(/[\s\-()]/g, "");
      // Remove any leading + and country code variants
      cleaned = cleaned.replace(/^(\+?966)+/, "");
      // Remove leading zeros if any, then add one back for local format 05xxxxxxxx
      cleaned = "0" + cleaned.replace(/^0+/, "");
      return cleaned;
    };

    const receiverPhone = sanitizePhone(shippingAddress.phone);

    // Build receiver object
    const receiver: Record<string, any> = {
      name: shippingAddress.fullName,
      mobile: receiverPhone,
      phone: receiverPhone,
      countryCode: "KSA",
      prov: shippingAddress.region || shippingAddress.city || "",
      city: shippingAddress.city || "",
      area: shippingAddress.city || "",
      address: [shippingAddress.street, shippingAddress.city, shippingAddress.region]
        .filter(Boolean)
        .join(", "),
    };

    // shortAddress is mandatory for KSA (only if available)
    if (receiver.countryCode === "KSA") {
      const shortAddr = shippingAddress.shortAddress || shippingAddress.nationalAddress || "";
      if (shortAddr) {
        receiver.shortAddress = shortAddr;
      }
    }

    if (shippingAddress.postalCode) {
      receiver.postCode = shippingAddress.postalCode;
    }

    // Build sender object
    const sendPhone = sanitizePhone(SENDER_MOBILE);
    const sender: Record<string, any> = {
      name: SENDER_NAME,
      mobile: sendPhone,
      phone: sendPhone,
      countryCode: SENDER_COUNTRY_CODE,
      prov: SENDER_PROV,
      city: SENDER_CITY,
      area: SENDER_CITY,
      address: SENDER_ADDRESS,
      postCode: "518000",
    };

    if (SENDER_SHORT_ADDR) {
      sender.shortAddress = SENDER_SHORT_ADDR;
    }

    // Build items array from order products
    const items = (order.products || []).map((p: any) => {
      const product = p.product || {};
      return {
        itemType: "ITN1",
        itemName: product.productNameEn || product.productNameAr || "Product",
        englishName: product.productNameEn || "Product",
        number: p.quantity || 1,
        itemValue: String(p.finalAmount || p.subtotal || product.productNewPrice || product.productOldPrice || "0"),
        priceCurrency: "SAR",
        desc: product.productDescriptionEn || "",
      };
    });

    // Calculate total weight (Range: 0.01-30)
    const totalQuantityNum = (order.products || []).reduce((sum: number, p: any) => sum + (p.quantity || 1), 0);
    const calculatedWeight = Math.max(0.1, totalQuantityNum * 0.5);
    const weight = String(calculatedWeight.toFixed(2));

    // Build the full bizContent payload
    const bizContent: Record<string, any> = {
      customerCode: JT_CUSTOMER_CODE,
      digest: bizDigest,
      txlogisticId: order._id?.toString() || `ORD-${Date.now()}`,
      expressType,
      orderType: "2",       // Monthly settlement
      serviceType: "01",    // Pick up at door
      deliveryType: "04",   // Deliver to door
      payType: "PP_PM",     // Monthly payment by shipper
      goodsType: "ITN1",    // Clothes (default)
      weight,
      totalQuantity: totalQuantityNum, // int(4) as per doc
      sender,
      receiver,
      items: items.length > 0 ? items : undefined,
      operateType,
      remark: `Bariqe Order ${order._id}`,
    };

    // COD fields
    if (input.codAmount && input.codAmount > 0) {
      bizContent.itemsValue = String(input.codAmount);
      bizContent.priceCurrency = input.codCurrency || "SAR";
    }

    // Update-specific fields
    if (operateType === 2 && billCode) {
      bizContent.billCode = billCode;
    }

    // Send the request
    const response = await this.sendRequest(
      "/webopenplatformapi/api/order/addOrder",
      bizContent
    );

    // Validate response
    if (String(response.code) !== "1") {
      const errorMsg = JT_ERROR_CODES[String(response.code)] || response.msg || "Unknown error";
      throw new ApiError("BAD_REQUEST", `J&T shipment failed [${response.code}]: ${errorMsg}`);
    }

    // Extract result from data
    const data = response.data || {};

    return {
      txlogisticId: data.txlogisticId || bizContent.txlogisticId,
      billCode: data.billCode || "",
      sortingCode: data.sortingCode || "",
      createOrderTime: data.createOrderTime || new Date().toISOString(),
      lastCenterName: data.lastCenterName,
      sumFreight: data.sumFreight,
    };
  }

  /**
   * Tracks a shipment by bill code.
   * (Placeholder — update with the correct SA tracking endpoint when available)
   */
  public async trackShipment(billCode: string): Promise<any> {
    const bizContent = {
      billCodes: billCode,
    };

    return this.sendRequest("/webopenplatformapi/api/logistics/trace", bizContent);
  }
}

export default new JTExpressService();
