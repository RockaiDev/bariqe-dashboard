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
      const cust = order.customer as any;
      const raw = order.shippingAddress || {} as any;
      const shippingAddress = {
        fullName: raw.fullName || cust.customerName || cust.name || "Customer",
        phone: raw.phone || cust.customerPhone || cust.phone || "",
        street: raw.street || cust.customerAddress || cust.address || "",
        city: raw.city || cust.customerLocation || cust.location || "Riyadh",
        region: raw.region || "Riyadh",
        postalCode: raw.postalCode || "",
        nationalAddress: raw.nationalAddress || "",
        country: raw.country || "Saudi Arabia",
      };

      // Determine if update (order already has a billCode)
      const existingBillCode = order.shipping?.trackingNumber;
      const isCOD = order.payment?.method === "cod";

      const shipmentResult = await JTExpressService.createShipment({
        order,
        shippingAddress,
        customer: cust,
        operateType: existingBillCode ? 2 : 1,
        billCode: existingBillCode,
        expressType: "EZKSA",
        codAmount: isCOD ? order.total : undefined,
        codCurrency: "SAR",
      });

      console.log("J&T Shipment Response:", JSON.stringify(shipmentResult, null, 2));

      const trackingNo = shipmentResult.billCode;

      // Update Order with tracking info
      if (trackingNo) {
        if (!order.shipping) {
          order.shipping = { carrier: "jt_express" };
        }

        order.shipping.carrier = "jt_express";
        order.shipping.trackingNumber = trackingNo;
        order.shipping.sortingCode = shipmentResult.sortingCode;
        order.shipping.lastCenterName = shipmentResult.lastCenterName;
        order.shipping.status = "shipped";
        order.orderStatus = "shipped";

        await order.save();
      } else {
        console.warn("Shipment created but no tracking number found in response:", shipmentResult);
      }

      super.send(res, shipmentResult);
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
