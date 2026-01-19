import axios from "axios";
import crypto from 'crypto';
import ApiError from "../../utils/errors/ApiError";

const JT_API_ACCOUNT = process.env.JT_API_ACCOUNT;
const JT_PRIVATE_KEY = process.env.JT_PRIVATE_KEY; 
const JT_CUSTOMER_CODE = process.env.JT_CUSTOMER_CODE; // 'customerCode' in J&T docs
const JT_PWD = process.env.JT_PWD; // Password/SoldTo field sometimes required
const JT_BASE_URL = process.env.JT_BASE_URL || "https://api.jtexpress.me/jts-mgt-core-data/api"; 

export class JTExpressService {
  
  /**
   * Generates the signature required by J&T Express API
   */
  private generateSignature(data: string): string {
    // Standard J&T signature: validation logic usually involves sorting params + private key -> MD5/SHA
    // Example: MD5(data + privateKey)
    
    if (!JT_PRIVATE_KEY) throw new ApiError("INTERNAL_SERVER_ERROR", "J&T Private Key missing");
    
    const str = data + JT_PRIVATE_KEY;
    return crypto.createHash('md5').update(str).digest('base64');
  }

  /**
   * Generic request handler for J&T
   */
  private async sendRequest(endpoint: string, msgType: string, content: any) {
    const contentStr = JSON.stringify(content);
    const data_digest = this.generateSignature(contentStr);

    const formData = new URLSearchParams();
    formData.append('logistics_interface', contentStr);
    formData.append('data_digest', data_digest);
    formData.append('msg_type', msgType);
    formData.append('eccompanyid', JT_CUSTOMER_CODE || '');

    try {
      const response = await axios.post(`${JT_BASE_URL}${endpoint}`, formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });
      
      return response.data;
    } catch (error: any) {
       console.error(`J&T API Error (${endpoint}):`, error.response?.data || error.message);
       throw new ApiError("BAD_GATEWAY", "Shipping service unavailable");
    }
  }

  public async createShipment(order: any, customer: any, address: any) {
    // Mapping internal Order to J&T Order Schema
    const content = {
      customerCode: JT_CUSTOMER_CODE,
      digest: "", 
      txlogisticid: order._id.toString(), // Our Order ID
      expressType: "EZ", // Standard Express
      sender: {
        name: "Bariqe El Tamioz",
        mobile: process.env.CONTACT_PHONE || "0500000000",
        prov: "Riyadh", 
        city: "Riyadh", 
        area: "Riyadh", 
        address: "Riyadh, Saudi Arabia" 
      },
      receiver: {
        name: address.fullName,
        mobile: address.phone,
        prov: address.region,
        city: address.city,
        area: address.city, 
        address: `${address.street}, ${address.city}, ${address.region} ${address.postalCode}`
      },
      items: order.products.map((p: any) => {
        const product = p.product || {};
        return {
          itemName: product.productNameEn || product.productNameAr || "Product",
          number: p.quantity,
          itemValue: p.finalAmount || p.subtotal
        };
      }),
      weight: 1, // Default weight or calculate from products
      goodsType: "ITN1", // General Goods
      orderType: "1", 
      serviceType: "1" // Standard
    };

    const response = await this.sendRequest("/order/add", "ORDER_CREATE", content);
    
    // Check J&T Success Response pattern
    if (response.code !== "1" && response.code !== 1) { 
       throw new ApiError("BAD_REQUEST", `J&T Error: ${response.msg || response.reason || 'Unknown'}`);
    }

    return response;
  }

  public async trackShipment(billCode: string) {
    const content = {
      billCodes: billCode
    };

    // Correct endpoint for tracking is usually distinct
    const response = await this.sendRequest("/logistics/trace/query", "TRACK_QUERY", content);
    return response;
  }
}

export default new JTExpressService();
