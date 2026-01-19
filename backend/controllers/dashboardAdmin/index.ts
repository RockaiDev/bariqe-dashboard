import { NextFunction, Request, Response } from "express";
import BaseApi from "../../utils/BaseApi";
import OrderService from "../../services/mongodb/orders";
import PayLinkService from "../../services/paylink";
import JTExpressService from "../../services/shipping/jt-express";

const orderService = new OrderService();

export default class DashboardAdminController extends BaseApi {

  // === Payments ===
  public async getAllPayments(req: Request, res: Response, next: NextFunction) {
    // Placeholder fetching from DB using Order model
    // This ideally would fetch Orders with payment.status != pending
    try {
        // Implement database fetch logic here
       super.send(res, { message: "List of payments (To Be Implemented)" });
    } catch (error) {
       next(error);
    }
  }

  public async getPaymentDetails(req: Request, res: Response, next: NextFunction) {
     try {
       const transactionNo = req.params.id;
       const invoice = await PayLinkService.getInvoice(transactionNo);
       super.send(res, invoice);
     } catch (error) {
       next(error);
     }
  }
  
  public async getPaymentStats(req: Request, res: Response, next: NextFunction) {
    // Aggregate stats from DB
    super.send(res, { totalRevenue: 10000, totalTransactions: 50 });
  }

  // === Shipping ===
  public async getAllShipments(req: Request, res: Response, next: NextFunction) {
     // Fetch Orders where shipping.status is set
     super.send(res, { message: "List of shipments (To Be Implemented)" });
  }

  public async shipOrder(req: Request, res: Response, next: NextFunction) {
     try {
       const orderId = req.params.orderId;
       const order = await orderService.GetOneOrder(orderId);
       
       if (!order.customer) throw new Error("Customer info missing");
       
       // Assuming address is stored in order snapshot or fetched from customer
       // Fix: accessing correct schema properties (customerName, customerPhone, etc.)
       const cust = order.customer as any; // Cast to any to avoid TS issues if types aren't fully defined yet
       const address = order.shippingAddress || {
         fullName: cust.customerName || cust.name,
         phone: cust.customerPhone || cust.phone,
         street: cust.customerAddress || cust.address,
         city: cust.customerLocation || cust.location || "Riyadh",
         postalCode: "00000",
         region: "Riyadh", // Default if missing
         country: "Saudi Arabia"
       };

       const shipment = await JTExpressService.createShipment(order, cust, address);
       console.log("J&T Shipment Response:", JSON.stringify(shipment, null, 2));

       // Extract tracking number from potentially nested response (J&T often returns { code: 1, data: { billCode: ... } })
       const data = shipment.data || shipment; 
       const trackingNo = data.billCode || data.logisticId || shipment.billCode || shipment.logisticId;

       // Update Order with tracking info
       if (trackingNo) {
          // Initialize with required 'carrier' to satisfy TS
          if (!order.shipping) {
            order.shipping = { carrier: "jt_express" };
          }
          
          order.shipping.carrier = "jt_express";
          order.shipping.trackingNumber = trackingNo;
          order.shipping.status = "shipped";
          order.shipping.labelUrl = data.waybillURL || data.labelUrl || ""; 
          order.orderStatus = "shipped";
          
          await order.save();
       } else {
         console.warn("Shipment created but no tracking number found in response:", shipment);
       }

       super.send(res, shipment);
     } catch (error) {
       next(error);
     }
  }

  public async trackShipment(req: Request, res: Response, next: NextFunction) {
      try {
          const trackingNumber = req.params.trackingNumber;
          const info = await JTExpressService.trackShipment(trackingNumber);
          super.send(res, info);
      } catch (error) {
          next(error);
      }
  }

  // === Order Fulfillment ===
  public async updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
       const { status } = req.body;
       const result = await orderService.EditOneOrder(req.params.id, { orderStatus: status });
       super.send(res, result);
    } catch (error) {
       next(error);
    }
  }
}
