// src/services/mongodb/order.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import OrderModel from "../../../models/orderSchema";
import CustomerModel from "../../../models/customerSchema";
import ProductModel from "../../../models/productSchema";
import { pick } from "lodash";

export default class OrderService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "customer",
      "product",
      "quantity",
      "orderQuantity",
      "orderDiscount", // Fixed typo
      "orderStatus", // Fixed typo
    ];
  }

  // 🟢 Get all orders
  public async GetOrders(query: any) {
    const keys = this.keys.sort();
    const {
      perPage,
      page,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    // Preprocess queries: if searching by customerName or productName
    // translate those into queries against the customer/product collections
    // and replace them with ['customer','in', [ids]] or ['product','in', [ids]]
    const preprocessQueries = async (rawQueries: any) => {
      let qs: any = rawQueries;

      // If queries arrive as a JSON string, try to parse it
      if (typeof qs === "string") {
        try {
          let decoded = decodeURIComponent(qs);
          if (decoded.startsWith('"') && decoded.endsWith('"')) {
            decoded = decoded.slice(1, -1);
          }
          decoded = decoded.replace(/\\"/g, '"');
          qs = JSON.parse(decoded);
        } catch (e) {
          // leave as-is; PaginateHandler will handle fallback
        }
      }

      if (!Array.isArray(qs)) return qs;

      const mapTuple = async (t: any) => {
        try {
          if (!Array.isArray(t) || t.length < 3) return t;

          const [field, op, value] = t;

          // handle $or custom tuples where value is array of tuples
          if (field === "$or" && op === "custom" && Array.isArray(value)) {
            const mappedSub = await Promise.all(
              value.map(async (sub: any) => {
                // recursively map sub-tuples
                return await mapTuple(sub);
              })
            );
            return ["$or", "custom", mappedSub];
          }

          const isCustomerName = [
            "customerName",
            "customer.customerName",
            "customer.name",
          ].includes(field);
          const isProductName = [
            "productName",
            "productNameAr",
            "productNameEn",
            "product.productNameAr",
            "product.productNameEn",
            "product.name",
          ].includes(field);

          if (isCustomerName) {
            // find matching customers
            const searchVal =
              typeof value === "string" ? value : String(value || "");
            const regex = new RegExp(
              searchVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i"
            );
            const customers = await CustomerModel.find({
              customerName: { $regex: regex },
            }).select("_id");
            const ids = customers.map((c: any) => c._id);
            return [
              "customer",
              op === "==" ? "==" : "in",
              ids.length ? ids : [null],
            ];
          }

          if (isProductName) {
            const searchVal =
              typeof value === "string" ? value : String(value || "");
            const regex = new RegExp(
              searchVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
              "i"
            );
            const products = await ProductModel.find({
              $or: [
                { productNameAr: { $regex: regex } },
                { productNameEn: { $regex: regex } },
              ],
            }).select("_id");

            const ids = products.map((p: any) => p._id);
            return [
              "product",
              op === "==" ? "==" : "in",
              ids.length ? ids : [null],
            ];
          }

          return t;
        } catch (err) {
          return t;
        }
      };

      const mapped = await Promise.all(qs.map((t: any) => mapTuple(t)));
      return mapped;
    };

    const processedQueries = await preprocessQueries(queries);

    const result = await super.PaginateHandler(
      OrderModel,
      Number(perPage),
      Number(page),
      sorts,
      processedQueries
    );

    const populatedData = await OrderModel.populate(result.data, [
      { path: "customer", select: "customerName customerEmail customerPhone" },
      {
        path: "product",
        select:
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode",
      },
    ]);

    return { result: { ...result, data: populatedData }, keys };
  }

  // 🟢 Get one order
  public async GetOneOrder(id: string) {
    try {
      const order = await OrderModel.findById(id)
        .populate("customer", "customerName customerEmail customerPhone")
        .populate(
          "product",
          "productNameAr productNameEn productDescriptionAr  productDescriptionEn productPrice productImage productCode"
        );

      if (!order) throw new ApiError("NOT_FOUND", "Order not found");
      return order;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Add new order
  public async AddOrder(body: any) {
    try {
      if (!body.customer || !body.product || !body.quantity) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'customer', 'product', 'quantity' are required"
        );
      }

      const newOrder = pick(body, this.keys);
      const order = await super.addDocument(OrderModel, newOrder);

      const populatedOrder = await OrderModel.findById(order._id)
        .populate("customer", "customerName customerEmail customerPhone")
        .populate(
          "product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
        );

      return populatedOrder;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit order
  public async EditOneOrder(id: string, body: any) {
    try {
      const updateData = pick(body, this.keys);

      const updatedOrder = await OrderModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("customer", "customerName customerEmail customerPhone")
        .populate(
          "product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
        );

      if (!updatedOrder) {
        throw new ApiError("NOT_FOUND", `Order with id ${id} not found`);
      }

      return updatedOrder;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Order with id ${id} not found`);
    }
  }

  // 🟢 Delete order
  public async DeleteOneOrder(id: string) {
    try {
      const deleted = await super.deleteDocument(OrderModel, id);
      return deleted;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Order with id ${id} not found`);
    }
  }

  // 🟢 Export orders for Excel
  public async ExportOrders(query: any) {
    try {
      const { sorts = [], queries = [] } = pick(query, ["sorts", "queries"]);

      // Get all orders without pagination for export
      const orders = await OrderModel.find({})
        .populate("customer", "customerName customerEmail customerPhone")
        .populate(
          "product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
        )
        .sort({ createdAt: -1 });

      // Format data for Excel export
      const formattedOrders = orders.map((order: any) => ({
        orderNumber: order._id.toString(),
        customerName: order.customer?.customerName || "N/A",
        customerEmail: order.customer?.customerEmail || "N/A",
        customerPhone: order.customer?.customerPhone || "N/A",
        productCode: order.product?.productCode || "N/A",
        productNameAr: order.product?.productNameAr || "N/A",
        productNameEn: order.product?.productNameEn || "N/A",
        productDescriptionAr: order.product?.productDescriptionAr || "N/A",
        productDescriptionEn: order.product?.productDescriptionEn || "N/A",
        productPrice: order.product?.productPrice || 0,
        quantity: order.quantity || 0,
        orderQuantity: order.orderQuantity || 0,
        orderDiscount: order.orderDiscount || 0,
        orderStatus: order.orderStatus || "Pending",
        totalAmount: (order.product?.productPrice || 0) * (order.quantity || 0),
        discountedAmount:
          (order.product?.productPrice || 0) *
          (order.quantity || 0) *
          (1 - (order.orderDiscount || 0) / 100),
        orderDate: order.createdAt,
      }));

      return formattedOrders;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Import orders from Excel data
  public async ImportOrders(ordersData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };

    for (const orderData of ordersData) {
      try {
        // Find customer by email
        const customer = await CustomerModel.findOne({
          customerEmail: orderData.customerEmail,
        });

        if (!customer) {
          results.failed.push({
            data: orderData,
            error: `Customer with email ${orderData.customerEmail} not found`,
          });
          continue;
        }

        // Find product by product code
        const product = await ProductModel.findOne({
          productCode: orderData.productCode,
        });

        if (!product) {
          results.failed.push({
            data: orderData,
            error: `Product with code ${orderData.productCode} not found`,
          });
          continue;
        }

        // Prepare order data
        const newOrderData = {
          customer: customer._id,
          product: product._id,
          quantity: orderData.quantity,
          orderQuantity: orderData.orderQuantity || orderData.quantity,
          orderDiscount: orderData.orderDiscount || 0,
          orderStatus: orderData.orderStatus || "Pending",
        };

        // Check if order already exists (optional - you can define your own logic)
        const existingOrder = await OrderModel.findOne({
          customer: customer._id,
          product: product._id,
          orderNumber: orderData.orderNumber,
        });

        if (existingOrder && orderData.orderNumber) {
          // Update existing order
          const updatedOrder = await OrderModel.findByIdAndUpdate(
            existingOrder._id,
            newOrderData,
            { new: true }
          )
            .populate("customer", "customerName customerEmail customerPhone")
            .populate(
              "product",
              "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
            );

          results.updated.push(updatedOrder);
        } else {
          // Create new order
          const newOrder = await OrderModel.create(newOrderData);
          const populatedOrder = await OrderModel.findById(newOrder._id)
            .populate("customer", "customerName customerEmail customerPhone")
            .populate(
              "product",
              "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
            );

          results.success.push(populatedOrder);
        }
      } catch (error: any) {
        results.failed.push({
          data: orderData,
          error: error.message || "Unknown error occurred",
        });
      }
    }

    return results;
  }
}
