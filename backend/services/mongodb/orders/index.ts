// src/services/mongodb/orders/index.ts
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
      "products",
      "orderQuantity",
      "orderDiscount",
      "orderStatus",
    ];
  }

  // Helper function to escape regex
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

    const preprocessQueries = async (rawQueries: any) => {
      let qs: any = rawQueries;

      if (typeof qs === "string") {
        try {
          let decoded = decodeURIComponent(qs);
          if (decoded.startsWith('"') && decoded.endsWith('"')) {
            decoded = decoded.slice(1, -1);
          }
          decoded = decoded.replace(/\\"/g, '"');
          qs = JSON.parse(decoded);
        } catch (e) {
          // leave as-is
        }
      }

      if (!Array.isArray(qs)) return qs;

      const mapTuple = async (t: any) => {
        try {
          if (!Array.isArray(t) || t.length < 3) return t;

          const [field, op, value] = t;

          if (field === "$or" && op === "custom" && Array.isArray(value)) {
            const mappedSub = await Promise.all(
              value.map(async (sub: any) => await mapTuple(sub))
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
            const searchVal = typeof value === "string" ? value : String(value || "");
            const escapedSearch = this.escapeRegex(searchVal);
            const regex = new RegExp(escapedSearch, "i");
            
            const customers = await CustomerModel.find({
              customerName: { $regex: regex },
            }).select("_id");
            const ids = customers.map((c: any) => c._id);
            return ["customer", op === "==" ? "==" : "in", ids.length ? ids : [null]];
          }

          if (isProductName) {
            const searchVal = typeof value === "string" ? value : String(value || "");
            const escapedSearch = this.escapeRegex(searchVal);
            const regex = new RegExp(escapedSearch, "i");
            
            const products = await ProductModel.find({
              $or: [
                { productNameAr: { $regex: regex } },
                { productNameEn: { $regex: regex } },
              ],
            }).select("_id");

            const ids = products.map((p: any) => p._id);
            return [
              "products.product",
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
        path: "products.product",
        select:
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode discountTiers",
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
          "products.product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode discountTiers"
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
      if (!body.customer || !body.products || !Array.isArray(body.products) || body.products.length === 0) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'customer' and 'products' array are required"
        );
      }

      // Validate each product in the array
      for (const item of body.products) {
        if (!item.product || !item.quantity) {
          throw new ApiError(
            "BAD_REQUEST",
            "Each product must have 'product' id and 'quantity'"
          );
        }
      }

      const newOrder = pick(body, this.keys);
      const order = await super.addDocument(OrderModel, newOrder);

      const populatedOrder = await OrderModel.findById(order._id)
        .populate("customer", "customerName customerEmail customerPhone")
        .populate(
          "products.product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode discountTiers"
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
          "products.product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode discountTiers"
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
      const orders = await OrderModel.find({})
        .populate("customer", "customerName customerEmail customerPhone")
        .populate(
          "products.product",
          "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode discountTiers"
        )
        .sort({ createdAt: -1 });

      // Format data for Excel export - one row per product in order
      const formattedOrders: any[] = [];

      orders.forEach((order: any) => {
        order.products.forEach((item: any, index: number) => {
          const productPrice = item.product?.productPrice || 0;
          const quantity = item.quantity || 0;
          const itemDiscount = item.itemDiscount || 0;
          const orderDiscount = order.orderDiscount || 0;

          const subtotal = productPrice * quantity;
          const afterItemDiscount = subtotal * (1 - itemDiscount / 100);
          const finalAmount = afterItemDiscount * (1 - orderDiscount / 100);

          formattedOrders.push({
            orderNumber: order._id.toString(),
            itemNumber: index + 1,
            totalItems: order.products.length,
            customerName: order.customer?.customerName || "N/A",
            customerEmail: order.customer?.customerEmail || "N/A",
            customerPhone: order.customer?.customerPhone || "N/A",
            productCode: item.product?.productCode || "N/A",
            productNameAr: item.product?.productNameAr || "N/A",
            productNameEn: item.product?.productNameEn || "N/A",
            productPrice: productPrice,
            quantity: quantity,
            itemDiscount: itemDiscount,
            orderDiscount: orderDiscount,
            subtotal: subtotal,
            afterItemDiscount: afterItemDiscount,
            finalAmount: finalAmount,
            orderQuantity: order.orderQuantity || "",
            orderStatus: order.orderStatus || "pending",
            orderDate: order.createdAt,
          });
        });
      });

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

    // Group rows by orderNumber or customer+orderDate to combine products
    const ordersMap = new Map<string, any>();

    for (const row of ordersData) {
      try {
        const key = row.orderNumber || `${row.customerEmail}_new_${Date.now()}`;
        
        if (!ordersMap.has(key)) {
          ordersMap.set(key, {
            customerEmail: row.customerEmail,
            orderQuantity: row.orderQuantity,
            orderDiscount: row.orderDiscount || 0,
            orderStatus: row.orderStatus || "pending",
            products: [],
            orderNumber: row.orderNumber,
          });
        }

        const orderGroup = ordersMap.get(key);
        orderGroup.products.push({
          productCode: row.productCode,
          quantity: row.quantity,
          itemDiscount: row.itemDiscount || 0,
        });
      } catch (error: any) {
        results.failed.push({
          data: row,
          error: error.message || "Error grouping order items",
        });
      }
    }

    // Process each grouped order
    for (const [key, orderData] of ordersMap.entries()) {
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

        // Find all products and prepare products array
        const productsArray = [];
        for (const item of orderData.products) {
          const product = await ProductModel.findOne({
            productCode: item.productCode,
          });

          if (!product) {
            results.failed.push({
              data: item,
              error: `Product with code ${item.productCode} not found`,
            });
            continue;
          }

          productsArray.push({
            product: product._id,
            quantity: item.quantity,
            itemDiscount: item.itemDiscount || 0,
          });
        }

        if (productsArray.length === 0) {
          results.failed.push({
            data: orderData,
            error: "No valid products found for this order",
          });
          continue;
        }

        // Prepare order data
        const newOrderData = {
          customer: customer._id,
          products: productsArray,
          orderQuantity: orderData.orderQuantity,
          orderDiscount: orderData.orderDiscount || 0,
          orderStatus: orderData.orderStatus || "pending",
        };

        // Check if order already exists
        let existingOrder = null;
        if (orderData.orderNumber) {
          existingOrder = await OrderModel.findById(orderData.orderNumber).catch(() => null);
        }

        if (existingOrder) {
          // Update existing order
          const updatedOrder = await OrderModel.findByIdAndUpdate(
            existingOrder._id,
            newOrderData,
            { new: true, runValidators: true }
          )
            .populate("customer", "customerName customerEmail customerPhone")
            .populate(
              "products.product",
              "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
            );

          results.updated.push(updatedOrder);
        } else {
          // Create new order
          const newOrder = await OrderModel.create(newOrderData);
          const populatedOrder = await OrderModel.findById(newOrder._id)
            .populate("customer", "customerName customerEmail customerPhone")
            .populate(
              "products.product",
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