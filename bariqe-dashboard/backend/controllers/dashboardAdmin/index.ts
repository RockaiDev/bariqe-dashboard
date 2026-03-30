import { NextFunction, Request, Response } from "express";
import BaseApi from "../../utils/BaseApi";
import OrderService from "../../services/mongodb/orders";

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

       // Update Order with tracking info using EditOneOrder for centralized stock management
       const update = {
         orderStatus: "shipped"
       };
       
       const updatedOrder = await orderService.EditOneOrder(orderId, update);
       
       super.send(res, updatedOrder);
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
