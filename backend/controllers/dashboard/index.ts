import { Request, Response, NextFunction } from "express";
import BaseApi from "../../utils/BaseApi";
import Order from "../../models/orderSchema";
import Consultation from "../../models/consultationRequestsSchema";
import Customer from "../../models/customerSchema";
import Product from "../../models/productSchema";
import Category from "../../models/categorySchema";

export default class DashboardController extends BaseApi {
  /**
   * Get complete dashboard data in one request
   */
  public async getDashboardData(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const [
        summary,
        orderTrends,
        popularCategories,
        recentOrders,
        recentConsultations,
      ] = await Promise.all([
        this.getSummaryData(),
        this.getOrderTrendsData(),
        this.getPopularCategoriesData(),
        this.getRecentOrdersData(),
        this.getRecentConsultationsData(),
      ]);

      const dashboardData = {
        summary,
        orderTrends,
        popularCategories,
        recentOrders,
        recentRequests: recentConsultations,
      };

      super.send(res, dashboardData);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Overview stats with percentage changes
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

    const [ordersCount, consultationsCount, customersCount] = await Promise.all(
      [
        Order.countDocuments({ createdAt: { $gte: lastMonth } }),
        Consultation.countDocuments({ createdAt: { $gte: lastMonth } }),
        Customer.countDocuments({ createdAt: { $gte: lastMonth } }),
      ]
    );

    const [prevOrdersCount, prevConsultationsCount, prevCustomersCount] =
      await Promise.all([
        Order.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
        Consultation.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
        Customer.countDocuments({
          createdAt: { $gte: twoMonthsAgo, $lt: lastMonth },
        }),
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
      ordersChange: calculateChange(ordersCount, prevOrdersCount),
      consultationsChange: calculateChange(
        consultationsCount,
        prevConsultationsCount
      ),
      customersChange: calculateChange(customersCount, prevCustomersCount),
    };
  }

  /**
   * Order Trends
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

    const monthlyOrders = await Order.aggregate([
      { $match: { createdAt: { $gte: last12Months } } },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
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
        value: monthData ? monthData.count : 0,
      });
    }

    return result;
  }

  /**
   * Popular Categories
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
          name: { $first: "$categoryDetails.categoryName" },
          ordersCount: { $sum: 1 },
        },
      },
      { $match: { _id: { $ne: null } } },
    ]);

    const totalConsultations = await Consultation.countDocuments();
    const totalOrders = categoriesFromOrders.reduce(
      (sum, cat) => sum + cat.ordersCount,
      0
    );

    const categoriesWithScore = categoriesFromOrders.map((category) => {
      const ordersScore = category.ordersCount * 3;
      const categoryOrdersRatio =
        totalOrders > 0 ? category.ordersCount / totalOrders : 0;
      const consultationsScore = Math.round(
        totalConsultations * categoryOrdersRatio
      );

      return {
        ...category,
        totalScore: ordersScore + consultationsScore,
      };
    });

    // ✅ رتّب حسب totalScore وخد أول 5 بس
    const topCategories = categoriesWithScore
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 5);

    // اجمع totalScore عشان تتحول لنسب مئوية
    const totalScore = topCategories.reduce(
      (sum, cat) => sum + cat.totalScore,
      0
    );

    const colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

    // ✅ ارجع 5 كاتيجوريز حقيقيين بالترتيب + ألوان
    const result: Array<{ name: string; value: number; color: string }> =
      topCategories.map((cat, index) => ({
        name: cat.name || "Unknown Category",
        value:
          totalScore > 0 ? Math.round((cat.totalScore / totalScore) * 100) : 0,
        color: colors[index] || "#6b7280",
      }));

    return result;
  }

  /**
   * Recent Orders
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
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("customer", "customerName customerEmail")
      .lean();

    return recentOrders.map((order: any) => ({
      _id: order._id.toString(),
      customer: { name: order.customer?.customerName || "Unknown Customer" },
      date: order.createdAt
        ? new Date(order.createdAt).toISOString().split("T")[0]
        : "",
      status: this.mapOrderStatus(order.orderStatus), // ✅ Fixed typo
    }));
  }

  /**
   * Recent Consultations
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
  const recentConsultations = await Consultation.find()
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("customers", "customerName customerEmail customerPhone customerAddress")
    .lean();

  return recentConsultations.map((consultation: any) => ({
    _id: consultation._id.toString(),
    customer: {
      name: consultation.customers?.customerName || "Unknown Customer",
      email: consultation.customers?.customerEmail || "",
      phone: consultation.customers?.customerPhone || "",
    },
    consultationArea: consultation.consultationRequestsArea || "",
    message: consultation.ConsultationRequestsMessage || "",
    date: consultation.createdAt
      ? new Date(consultation.createdAt).toISOString().split("T")[0]
      : "",
    status: this.mapConsultationStatus(consultation.ConsultationRequestsStatus),
  }));
}

private mapConsultationStatus(status: string) {
  switch (status) {
    case "new":
      return "New Request";
    case "contacted":
      return "Contacted";
    case "closed":
      return "Closed";
    default:
      return "Unknown";
  }
}
  private mapOrderStatus(status: string): string {
    const statusMap: { [key: string]: string } = {
      pending: "Pending",
      processing: "Processing",
      shipped: "Shipped",
      delivered: "Delivered",
      completed: "Completed",
      cancelled: "Canceled",
      canceled: "Canceled",
    };
    return statusMap[status?.toLowerCase()] || "Pending";
  }



  /**
   * Dashboard Stats
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
      ] = await Promise.all([
        Order.countDocuments(),
        Customer.countDocuments(),
        Product.countDocuments(),
        Category.countDocuments(),
        Consultation.countDocuments(),
      ]);

      const stats = {
        totalOrders,
        totalCustomers,
        totalProducts,
        totalCategories,
        totalConsultations,
        generatedAt: new Date().toISOString(),
      };

      super.send(res, stats);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Monthly Revenue
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
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            revenue: {
              $sum: {
                $multiply: [
                  "$quantity",
                  { $ifNull: ["$productDetails.productPrice", 0] },
                ],
              },
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]);

      const months = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
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
          orders: monthData ? monthData.orderCount : 0,
        });
      }

      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }
}
