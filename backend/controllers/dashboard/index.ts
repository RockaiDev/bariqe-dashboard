import { Request, Response, NextFunction } from "express";
import BaseApi from "../../utils/BaseApi";
import Order from "../../models/orderSchema";
import Consultation from "../../models/consultationRequestsSchema";
import Customer from "../../models/customerSchema";
import Product from "../../models/productSchema";
import Category from "../../models/categorySchema";
import MaterialRequest from "../../models/materialRequestsSchema";

export default class DashboardController extends BaseApi {
  /**
   * 🟢 Get complete dashboard data in one request
   */
  public async getDashboardData(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      console.log("🚀 Loading complete dashboard data...");
      
      const [
        summary,
        orderTrends,
        popularCategories,
        recentOrders,
        recentConsultations,
        materialRequestsStats,
      ] = await Promise.all([
        this.getSummaryData(),
        this.getOrderTrendsData(),
        this.getPopularCategoriesData(),
        this.getRecentOrdersData(),
        this.getRecentConsultationsData(),
        this.getMaterialRequestsStats(),
      ]);

      const dashboardData = {
        summary,
        orderTrends,
        popularCategories,
        recentOrders,
        recentRequests: recentConsultations,
        materialRequestsStats,
        lastUpdated: new Date().toISOString(),
      };

      console.log("✅ Dashboard data loaded successfully");
      super.send(res, dashboardData);
    } catch (err) {
      console.error("❌ Dashboard data loading error:", err);
      next(err);
    }
  }

  /**
   * 🟢 Overview stats with percentage changes
   */
  public async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const summary = await this.getSummaryData();
      super.send(res, summary);
    } catch (err) {
      next(err);
    }
  }

  private async getSummaryData() {
    const now = new Date();
    const lastMonth = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      now.getDate()
    );
    const twoMonthsAgo = new Date(
      now.getFullYear(),
      now.getMonth() - 2,
      now.getDate()
    );

    try {
      const [
        ordersCount,
        consultationsCount,
        customersCount,
        materialRequestsCount,
        totalRevenue,
      ] = await Promise.all([
        Order.countDocuments({ createdAt: { $gte: lastMonth } }),
        Consultation.countDocuments({ createdAt: { $gte: lastMonth } }),
        Customer.countDocuments({ createdAt: { $gte: lastMonth } }),
        MaterialRequest.countDocuments({ createdAt: { $gte: lastMonth } }),
        this.calculateTotalRevenue(lastMonth),
      ]);

      const [
        prevOrdersCount,
        prevConsultationsCount,
        prevCustomersCount,
        prevMaterialRequestsCount,
        prevTotalRevenue,
      ] = await Promise.all([
        Order.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
        Consultation.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
        Customer.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
        MaterialRequest.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
        this.calculateTotalRevenue(twoMonthsAgo, lastMonth),
      ]);

      const calculateChange = (current: number, previous: number): string => {
        if (previous === 0) return current > 0 ? "+100%" : "0%";
        const change = ((current - previous) / previous) * 100;
        return `${change >= 0 ? "+" : ""}${Math.round(change)}%`;
      };

      return {
        orders: ordersCount.toString(),
        consultationRequests: consultationsCount.toString(),
        newCustomers: customersCount.toString(),
        materialRequests: materialRequestsCount.toString(),
        totalRevenue: totalRevenue.toFixed(2),
        ordersChange: calculateChange(ordersCount, prevOrdersCount),
        consultationsChange: calculateChange(
          consultationsCount,
          prevConsultationsCount
        ),
        customersChange: calculateChange(customersCount, prevCustomersCount),
        materialRequestsChange: calculateChange(
          materialRequestsCount,
          prevMaterialRequestsCount
        ),
        revenueChange: calculateChange(totalRevenue, prevTotalRevenue),
      };
    } catch (error) {
      console.error("Error in getSummaryData:", error);
      throw error;
    }
  }

  /**
   * 🟢 Calculate total revenue helper
   */
  private async calculateTotalRevenue(fromDate: Date, toDate?: Date) {
    try {
      const matchCondition: any = {
        createdAt: { $gte: fromDate },
        orderStatus: { $in: ["completed", "delivered", "shipped"] },
      };

      if (toDate) {
        matchCondition.createdAt.$lt = toDate;
      }

      const revenueResult = await Order.aggregate([
        { $match: matchCondition },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: {
            path: "$productDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: {
              $sum: {
                $multiply: [
                  { $ifNull: ["$orderQuantity", "$quantity", 1] },
                  { $ifNull: ["$productDetails.productPrice", 0] },
                ],
              },
            },
          },
        },
      ]);

      return revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;
    } catch (error) {
      console.error("Error calculating revenue:", error);
      return 0;
    }
  }

  /**
   * 🟢 Order Trends with improved data
   */
  public async getOrderTrends(req: Request, res: Response, next: NextFunction) {
    try {
      const orderTrends = await this.getOrderTrendsData();
      super.send(res, orderTrends);
    } catch (err) {
      next(err);
    }
  }

  private async getOrderTrendsData() {
    const now = new Date();
    const last12Months = new Date(now.getFullYear() - 1, now.getMonth(), 1);

    try {
      const monthlyOrders = await Order.aggregate([
        { $match: { createdAt: { $gte: last12Months } } },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            orders: { $sum: 1 },
            totalQuantity: { $sum: { $ifNull: ["$orderQuantity", "$quantity", 1] } },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const result = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthData = monthlyOrders.find(
          (m) =>
            m._id.year === date.getFullYear() &&
            m._id.month === date.getMonth() + 1
        );
        result.push({
          name: months[date.getMonth()],
          orders: monthData ? monthData.orders : 0,
          quantity: monthData ? monthData.totalQuantity : 0,
          value: monthData ? monthData.orders : 0, // For backward compatibility
        });
      }

      return result;
    } catch (error) {
      console.error("Error in getOrderTrendsData:", error);
      return [];
    }
  }

  /**
   * 🟢 Popular Categories with SubCategories support
   */
  public async getPopularCategories(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const popularCategories = await this.getPopularCategoriesData();
      super.send(res, popularCategories);
    } catch (err) {
      next(err);
    }
  }

  private async getPopularCategoriesData() {
    try {
      // Get categories from orders with proper population
      const categoriesFromOrders = await Order.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $lookup: {
            from: "categories",
            localField: "productDetails.productCategory",
            foreignField: "_id",
            as: "categoryDetails",
          },
        },
        {
          $unwind: { path: "$categoryDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$categoryDetails._id",
            categoryNameEn: { $first: "$categoryDetails.categoryNameEn" },
            categoryNameAr: { $first: "$categoryDetails.categoryNameAr" },
            ordersCount: { $sum: 1 },
            totalQuantity: { $sum: { $ifNull: ["$orderQuantity", "$quantity", 1] } },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { ordersCount: -1 } },
        { $limit: 5 },
      ]);

      // If no orders found, get top categories by product count
      if (categoriesFromOrders.length === 0) {
        const categoriesByProducts = await Category.aggregate([
          {
            $lookup: {
              from: "products",
              localField: "_id",
              foreignField: "productCategory",
              as: "products",
            },
          },
          {
            $project: {
              categoryNameEn: 1,
              categoryNameAr: 1,
              productsCount: { $size: "$products" },
            },
          },
          { $sort: { productsCount: -1 } },
          { $limit: 5 },
        ]);

        const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];
        return categoriesByProducts.map((cat, index) => ({
          name: cat.categoryNameEn || cat.categoryNameAr || "Unknown Category",
          nameAr: cat.categoryNameAr || "",
          nameEn: cat.categoryNameEn || "",
          value: cat.productsCount,
          color: colors[index] || "#6b7280",
        }));
      }

      // Calculate percentages based on orders
      const totalOrders = categoriesFromOrders.reduce(
        (sum, cat) => sum + cat.ordersCount,
        0
      );

      const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

      return categoriesFromOrders.map((cat, index) => ({
        name: cat.categoryNameEn || cat.categoryNameAr || "Unknown Category",
        nameAr: cat.categoryNameAr || "",
        nameEn: cat.categoryNameEn || "",
        value: totalOrders > 0 ? Math.round((cat.ordersCount / totalOrders) * 100) : 0,
        ordersCount: cat.ordersCount,
        totalQuantity: cat.totalQuantity,
        color: colors[index] || "#6b7280",
      }));
    } catch (error) {
      console.error("Error in getPopularCategoriesData:", error);
      return [];
    }
  }

  /**
   * 🟢 Recent Orders with improved data
   */
  public async getRecentOrders(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const recentOrders = await this.getRecentOrdersData();
      super.send(res, recentOrders);
    } catch (err) {
      next(err);
    }
  }

  private async getRecentOrdersData() {
    try {
      const recentOrders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("customer", "customerName customerEmail customerPhone customerLocation")
        .populate(
              "products.product",
              "productNameAr productNameEn productDescriptionAr productDescriptionEn productPrice productImage productCode"
            )
        .lean();

      return recentOrders.map((order: any) => ({
        _id: order._id.toString(),
        customer: {
          name: order.customer?.customerName || "Unknown Customer",
          email: order.customer?.customerEmail || "",
          phone: order.customer?.customerPhone || "",
          location: order.customer?.customerLocation || "",
        },
        product: {
          name: order.product?.productNameEn || order.product?.productNameAr || "Unknown Product",
          nameEn: order.product?.productNameEn || "",
          nameAr: order.product?.productNameAr || "",
          code: order.product?.productCode || "",
          price: order.product?.productPrice || 0,
        },
        quantity: order.orderQuantity || order.quantity || 1,
        totalAmount: ((order.orderQuantity || order.quantity || 1) * (order.product?.productPrice || 0)).toFixed(2),
        date: order.createdAt
          ? new Date(order.createdAt).toISOString().split("T")[0]
          : "",
        status: this.mapOrderStatus(order.orderStatus),
        createdAt: order.createdAt,
      }));
    } catch (error) {
      console.error("Error in getRecentOrdersData:", error);
      return [];
    }
  }

  /**
   * 🟢 Recent Consultations with improved data
   */
  public async getRecentConsultations(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const recentConsultations = await this.getRecentConsultationsData();
      super.send(res, recentConsultations);
    } catch (err) {
      next(err);
    }
  }

  private async getRecentConsultationsData() {
    try {
      const recentConsultations = await Consultation.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("customers", "customerName customerEmail customerPhone customerLocation customerAddress")
        .lean();

      return recentConsultations.map((consultation: any) => ({
        _id: consultation._id.toString(),
        customer: {
          name: consultation.customers?.customerName || 
                 consultation.consultationRequestsName || "Unknown Customer",
          email: consultation.customers?.customerEmail || 
                 consultation.consultationRequestsEmail || "",
          phone: consultation.customers?.customerPhone || 
                 consultation.consultationRequestsPhone || "",
          location: consultation.customers?.customerLocation || "",
          address: consultation.customers?.customerAddress || "",
        },
        consultationArea: consultation.consultationRequestsArea || "",
        message: consultation.consultationRequestsMessage || consultation.ConsultationRequestsMessage || "",
        date: consultation.createdAt
          ? new Date(consultation.createdAt).toISOString().split("T")[0]
          : "",
        status: this.mapConsultationStatus(
          consultation.consultationRequestsStatus || consultation.ConsultationRequestsStatus
        ),
        priority: this.getConsultationPriority(consultation.consultationRequestsArea),
        createdAt: consultation.createdAt,
      }));
    } catch (error) {
      console.error("Error in getRecentConsultationsData:", error);
      return [];
    }
  }

  /**
   * 🟢 Material Requests Statistics
   */
  private async getMaterialRequestsStats() {
    try {
      const now = new Date();
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

      const [totalRequests, pendingRequests, approvedRequests, deniedRequests] = await Promise.all([
        MaterialRequest.countDocuments({ createdAt: { $gte: lastMonth } }),
        MaterialRequest.countDocuments({ 
          materialActions: "pending",
          createdAt: { $gte: lastMonth }
        }),
        MaterialRequest.countDocuments({ 
          materialActions: "approve",
          createdAt: { $gte: lastMonth }
        }),
        MaterialRequest.countDocuments({ 
          materialActions: "denied",
          createdAt: { $gte: lastMonth }
        }),
      ]);

      return {
        total: totalRequests,
        pending: pendingRequests,
        approved: approvedRequests,
        denied: deniedRequests,
        approvalRate: totalRequests > 0 ? Math.round((approvedRequests / totalRequests) * 100) : 0,
      };
    } catch (error) {
      console.error("Error in getMaterialRequestsStats:", error);
      return {
        total: 0,
        pending: 0,
        approved: 0,
        denied: 0,
        approvalRate: 0,
      };
    }
  }

  /**
   * 🟢 Get consultation priority based on area
   */
  private getConsultationPriority(area: string): string {
    const highPriorityAreas = [
      "Chemical Safety",
      "Emergency Response",
      "Hazardous Materials",
      "Safety Protocols",
    ];
    
    const mediumPriorityAreas = [
      "Chemical Analysis",
      "Quality Control",
      "Process Optimization",
    ];

    if (highPriorityAreas.some(p => area?.toLowerCase().includes(p.toLowerCase()))) {
      return "High";
    } else if (mediumPriorityAreas.some(p => area?.toLowerCase().includes(p.toLowerCase()))) {
      return "Medium";
    }
    return "Low";
  }

  /**
   * 🟢 Map consultation status
   */
  private mapConsultationStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      new: "New Request",
      contacted: "In Progress",
      closed: "Completed",
      pending: "Pending Review",
    };
    return statusMap[status?.toLowerCase()] || "New Request";
  }

  /**
   * 🟢 Map order status
   */
  private mapOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: "Pending",
      processing: "Processing",
      confirmed: "Confirmed",
      shipped: "Shipped",
      delivered: "Delivered",
      completed: "Completed",
      cancelled: "Cancelled",
      canceled: "Cancelled",
    };
    return statusMap[status?.toLowerCase()] || "Pending";
  }

  /**
   * 🟢 Dashboard Stats - Enhanced
   */
  public async getDashboardStats(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const [
        totalOrders,
        totalCustomers,
        totalProducts,
        totalCategories,
        totalConsultations,
        totalMaterialRequests,
        activeCategories,
        activeProducts,
      ] = await Promise.all([
        Order.countDocuments(),
        Customer.countDocuments(),
        Product.countDocuments(),
        Category.countDocuments(),
        Consultation.countDocuments(),
        MaterialRequest.countDocuments(),
        Category.countDocuments({ categoryStatus: true }),
        Product.countDocuments({ productStatus: true }),
      ]);

      const stats = {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalCategories,
        totalConsultations,
        totalMaterialRequests,
        activeCategories,
        activeProducts,
        systemHealth: {
          categoriesActivationRate: totalCategories > 0 ? Math.round((activeCategories / totalCategories) * 100) : 0,
          productsActivationRate: totalProducts > 0 ? Math.round((activeProducts / totalProducts) * 100) : 0,
        },
        generatedAt: new Date().toISOString(),
      };

      super.send(res, stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Monthly Revenue with enhanced calculations
   */
  public async getMonthlyRevenue(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const now = new Date();
      const last12Months = new Date(now.getFullYear() - 1, now.getMonth(), 1);

      const monthlyRevenue = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: last12Months },
            orderStatus: { $in: ["completed", "delivered", "shipped"] },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: {
            path: "$productDetails",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $addFields: {
            effectiveQuantity: { $ifNull: ["$orderQuantity", "$quantity", 1] },
            effectivePrice: { $ifNull: ["$productDetails.productPrice", 0] },
            effectiveDiscount: { $ifNull: ["$orderDiscount", 0] },
          },
        },
        {
          $addFields: {
            lineTotal: { $multiply: ["$effectiveQuantity", "$effectivePrice"] },
            discountAmount: {
              $multiply: [
                { $multiply: ["$effectiveQuantity", "$effectivePrice"] },
                { $divide: ["$effectiveDiscount", 100] },
              ],
            },
          },
        },
        {
          $addFields: {
            finalAmount: { $subtract: ["$lineTotal", "$discountAmount"] },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: { $sum: "$finalAmount" },
            grossRevenue: { $sum: "$lineTotal" },
            totalDiscount: { $sum: "$discountAmount" },
            orderCount: { $sum: 1 },
            avgOrderValue: { $avg: "$finalAmount" },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const months = [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
      ];

      const result = [];
      for (let i = 11; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthData = monthlyRevenue.find(
          (m) =>
            m._id.year === date.getFullYear() &&
            m._id.month === date.getMonth() + 1
        );
        result.push({
          name: months[date.getMonth()],
          revenue: monthData ? Math.round(monthData.revenue) : 0,
          grossRevenue: monthData ? Math.round(monthData.grossRevenue) : 0,
          totalDiscount: monthData ? Math.round(monthData.totalDiscount) : 0,
          orders: monthData ? monthData.orderCount : 0,
          avgOrderValue: monthData ? Math.round(monthData.avgOrderValue) : 0,
        });
      }

      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Top Products Analysis
   */
  public async getTopProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const topProducts = await Order.aggregate([
        {
          $lookup: {
            from: "products",
            localField: "product",
            foreignField: "_id",
            as: "productDetails",
          },
        },
        {
          $unwind: { path: "$productDetails", preserveNullAndEmptyArrays: true },
        },
        {
          $group: {
            _id: "$product",
            productNameEn: { $first: "$productDetails.productNameEn" },
            productNameAr: { $first: "$productDetails.productNameAr" },
            productCode: { $first: "$productDetails.productCode" },
            totalOrders: { $sum: 1 },
            totalQuantity: { $sum: { $ifNull: ["$orderQuantity", "$quantity", 1] } },
            avgOrderQuantity: { $avg: { $ifNull: ["$orderQuantity", "$quantity", 1] } },
          },
        },
        { $match: { _id: { $ne: null } } },
        { $sort: { totalOrders: -1 } },
        { $limit: 10 },
      ]);

      const formattedProducts = topProducts.map((product) => ({
        id: product._id,
        name: product.productNameEn || product.productNameAr || "Unknown Product",
        nameEn: product.productNameEn || "",
        nameAr: product.productNameAr || "",
        code: product.productCode || "",
        totalOrders: product.totalOrders,
        totalQuantity: product.totalQuantity,
        avgOrderQuantity: Math.round(product.avgOrderQuantity * 100) / 100,
      }));

      super.send(res, formattedProducts);
    } catch (err) {
      next(err);
    }
  }

  /**
   * 🟢 Customer Analytics
   */
  public async getCustomerAnalytics(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const [locationStats, sourceStats, loyalCustomers] = await Promise.all([
        this.getCustomerLocationStats(),
        this.getCustomerSourceStats(),
        this.getLoyalCustomers(),
      ]);

      super.send(res, {
        locationStats,
        sourceStats,
        loyalCustomers,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      next(err);
    }
  }

  private async getCustomerLocationStats() {
    try {
      const locationStats = await Customer.aggregate([
        {
          $group: {
            _id: "$customerLocation",
            count: { $sum: 1 },
          },
        },
        // ✅ Fixed: Use $and to combine conditions
        { 
          $match: { 
            $and: [
              { _id: { $ne: null } },
              { _id: { $ne: "" } }
            ]
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]);

      return locationStats.map((stat) => ({
        location: stat._id,
        customers: stat.count,
      }));
    } catch (error) {
      console.error("Error in getCustomerLocationStats:", error);
      return [];
    }
  }

  private async getCustomerSourceStats() {
    try {
      const sourceStats = await Customer.aggregate([
        {
          $group: {
            _id: "$customerSource",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]);

      return sourceStats.map((stat) => ({
        source: stat._id || "unknown",
        customers: stat.count,
      }));
    } catch (error) {
      console.error("Error in getCustomerSourceStats:", error);
      return [];
    }
  }

  private async getLoyalCustomers() {
    try {
      const loyalCustomers = await Order.aggregate([
        {
          $group: {
            _id: "$customer",
            orderCount: { $sum: 1 },
            totalSpent: {
              $sum: { $ifNull: ["$orderQuantity", "$quantity", 1] },
            },
            lastOrderDate: { $max: "$createdAt" },
          },
        },
        { $match: { orderCount: { $gte: 2 } } },
        {
          $lookup: {
            from: "customers",
            localField: "_id",
            foreignField: "_id",
            as: "customerDetails",
          },
        },
        {
          $unwind: { path: "$customerDetails", preserveNullAndEmptyArrays: true },
        },
        { $sort: { orderCount: -1 } },
        { $limit: 10 },
      ]);

      return loyalCustomers.map((customer) => ({
        id: customer._id,
        name: customer.customerDetails?.customerName || "Unknown Customer",
        email: customer.customerDetails?.customerEmail || "",
        phone: customer.customerDetails?.customerPhone || "",
        location: customer.customerDetails?.customerLocation || "",
        orderCount: customer.orderCount,
        totalQuantityOrdered: customer.totalSpent,
        lastOrderDate: customer.lastOrderDate,
      }));
    } catch (error) {
      console.error("Error in getLoyalCustomers:", error);
      return [];
    }
  }

  /**
   * 🟢 System Health Check
   */
  public async getSystemHealth(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const healthCheck = {
        database: await this.checkDatabaseHealth(),
        dataIntegrity: await this.checkDataIntegrity(),
        performance: await this.checkPerformanceMetrics(),
        timestamp: new Date().toISOString(),
      };

      super.send(res, healthCheck);
    } catch (err) {
      next(err);
    }
  }

  private async checkDatabaseHealth() {
    try {
      const [ordersCheck, customersCheck, productsCheck, categoriesCheck] = await Promise.all([
        Order.findOne().lean(),
        Customer.findOne().lean(),
        Product.findOne().lean(),
        Category.findOne().lean(),
      ]);

      return {
        orders: !!ordersCheck,
        customers: !!customersCheck,
        products: !!productsCheck,
        categories: !!categoriesCheck,
        status: "healthy",
      };
    } catch (error: any) {
      return {
        orders: false,
        customers: false,
        products: false,
        categories: false,
        status: "unhealthy",
        error: error.message,
      };
    }
  }

  private async checkDataIntegrity() {
    try {
      const [orphanedOrders, orphanedProducts] = await Promise.all([
        Order.countDocuments({
          $or: [
            { customer: { $exists: false } },
            { product: { $exists: false } },
          ],
        }),
        Product.countDocuments({
          productCategory: { $exists: false },
        }),
      ]);

      return {
        orphanedOrders,
        orphanedProducts,
        status: orphanedOrders === 0 && orphanedProducts === 0 ? "good" : "attention_needed",
      };
    } catch (error: any) {
      return {
        orphanedOrders: -1,
        orphanedProducts: -1,
        status: "error",
        error: error.message,
      };
    }
  }

  private async checkPerformanceMetrics() {
    const start = Date.now();
    
    try {
      await Promise.all([
        Order.countDocuments(),
        Customer.countDocuments(),
        Product.countDocuments(),
      ]);
      
      const responseTime = Date.now() - start;
      
      return {
        responseTime,
        status: responseTime < 1000 ? "good" : responseTime < 3000 ? "moderate" : "slow",
      };
    } catch (error: any) {
      return {
        responseTime: -1,
        status: "error",
        error: error.message,
      };
    }
  }
}