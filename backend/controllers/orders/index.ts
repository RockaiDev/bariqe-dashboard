// src/controllers/order/index.ts
import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import OrderService from '../../services/mongodb/orders/index';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/temp/";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.fieldname === "file") {
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xls") {
        return cb(new Error("Only Excel files are allowed"));
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const orderService = new OrderService();

export default class OrderController extends BaseApi {
  /**
   * Helper method to clean up uploaded file
   */
  private cleanupFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log("Cleaned up temp file:", filePath);
      }
    } catch (error) {
      console.error("Error cleaning up file:", error);
    }
  }

  public async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.GetOrders(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.GetOneOrder(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async addOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await orderService.AddOrder(req.body);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async editOrder(req: Request, res: Response, next: NextFunction) {
    try {
      console.log(req.params.id, req.body);
      const data = await orderService.EditOneOrder(req.params.id, req.body);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await orderService.DeleteOneOrder(req.params.id);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export orders to Excel
  public async exportOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const orders = await orderService.ExportOrders(req.query);

      if (!orders || orders.length === 0) {
        return res.status(404).json({ message: "No orders found to export" });
      }

      // Create new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Orders sheet
      const ordersSheet = workbook.addWorksheet("Orders", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // Define columns for orders sheet
      ordersSheet.columns = [
        { header: "Order Number", key: "orderNumber", width: 25 },
        { header: "Customer Name", key: "customerName", width: 25 },
        { header: "Customer Email", key: "customerEmail", width: 30 },
        { header: "Customer Phone", key: "customerPhone", width: 20 },
        { header: "Product Code", key: "productCode", width: 20 },
        { header: "Product Name (AR)", key: "productNameAr", width: 30 },
        { header: "Product Name (EN)", key: "productNameEn", width: 30 },
        { header: "Product Price", key: "productPrice", width: 15 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Order Quantity", key: "orderQuantity", width: 15 },
        { header: "Order Discount %", key: "orderDiscount", width: 18 },
        { header: "Order Status", key: "orderStatus", width: 15 },
        { header: "Total Amount", key: "totalAmount", width: 15 },
        { header: "Discounted Amount", key: "discountedAmount", width: 18 },
        { header: "Order Date", key: "orderDate", width: 20 },
      ];

      // Style header row
      ordersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      ordersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      ordersSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add data
      orders.forEach((order) => {
        const row = ordersSheet.addRow(order);

        // Format price columns
        row.getCell("productPrice").numFmt = "$#,##0.00";
        row.getCell("totalAmount").numFmt = "$#,##0.00";
        row.getCell("discountedAmount").numFmt = "$#,##0.00";

        // Format discount column
        if (order.orderDiscount) {
          row.getCell("orderDiscount").value = order.orderDiscount / 100;
          row.getCell("orderDiscount").numFmt = "0%";
        }

        // Format date column
        row.getCell("orderDate").numFmt = "dd/mm/yyyy hh:mm";

        // Add conditional formatting for status
        const statusCell = row.getCell("orderStatus");
        switch (order.orderStatus?.toLowerCase()) {
          case "completed":
          case "delivered":
            statusCell.font = { color: { argb: "FF008000" } };
            break;
          case "pending":
            statusCell.font = { color: { argb: "FFFF8C00" } };
            break;
          case "cancelled":
            statusCell.font = { color: { argb: "FFFF0000" } };
            break;
          default:
            statusCell.font = { color: { argb: "FF000000" } };
        }
      });

      // Add borders to all cells
      ordersSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=orders_export_${Date.now()}.xlsx`
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Export error:", err);
      next(err);
    }
  }

  // 🟢 Download import template
  public async downloadTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Orders template sheet
      const ordersSheet = workbook.addWorksheet("Orders", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // Define columns
      ordersSheet.columns = [
        { header: "Customer Email", key: "customerEmail", width: 30 },
        { header: "Product Code", key: "productCode", width: 20 },
        { header: "Quantity", key: "quantity", width: 12 },
        { header: "Order Quantity", key: "orderQuantity", width: 15 },
        { header: "Order Discount %", key: "orderDiscount", width: 18 },
        { header: "Order Status", key: "orderStatus", width: 15 },
      ];

      // Style header
      ordersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      ordersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      ordersSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add sample data
      const sampleRow = ordersSheet.addRow({
        customerEmail: "customer@example.com",
        productCode: "PROD001",
        quantity: 10,
        orderQuantity: 10,
        orderDiscount: 5,
        orderStatus: "Pending",
      });

      // Add data validation for Status
      ordersSheet.getCell("F2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Pending,Processing,Shipped,Delivered,Cancelled"'],
      };

      // Add instructions sheet
      const instructionsSheet = workbook.addWorksheet("Instructions", {
        properties: { tabColor: { argb: "FF0000" } },
      });

      instructionsSheet.columns = [
        { header: "Instructions", key: "instructions", width: 80 },
      ];

      // Style header
      instructionsSheet.getRow(1).font = { bold: true };
      instructionsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" },
      };

      // Add instruction rows
      const instructions = [
        "How to use this template:",
        "",
        "1. Orders Sheet:",
        "   - Customer Email: Must match an existing customer email in the system (required)",
        "   - Product Code: Must match an existing product code in the system (required)",
        "   - Quantity: Number of items ordered (required)",
        "   - Order Quantity: Total order quantity (optional, defaults to quantity)",
        "   - Order Discount %: Discount percentage as number (e.g., 5 for 5%)",
        "   - Order Status: Choose from: Pending, Processing, Shipped, Delivered, Cancelled",
        "",
        "2. Important Notes:",
        "   - Do not modify column headers",
        "   - Customers and Products must exist in the system before import",
        "   - Customer Email and Product Code are used to link to existing records",
        "   - Leave no empty rows between data",
        "   - Duplicate orders will be updated if they have the same customer and product",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

      // Add borders to orders sheet
      ordersSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=orders_import_template.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // 🟢 Import orders from Excel
  public async importOrders(req: Request, res: Response, next: NextFunction) {
    const uploadSingle = upload.single("file");

    uploadSingle(req, res, async (err) => {
      if (err) return next(err);

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
      }

      try {
        const workbook = new ExcelJS.Workbook();
        await workbook.xlsx.readFile(req.file.path);

        // Orders sheet
        const ordersSheet = workbook.getWorksheet("Orders");
        if (!ordersSheet) {
          throw new Error("Missing 'Orders' sheet in the uploaded file");
        }

        const ordersData: any[] = [];
        const orderErrors: any[] = [];

        ordersSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const customerEmail = String(row.getCell(1).value || "").trim();
              const productCode = String(row.getCell(2).value || "").trim();
              const quantity = Number(row.getCell(3).value) || 0;
              const orderQuantity = Number(row.getCell(4).value) || quantity;
              const orderDiscount = Number(row.getCell(5).value) || 0;
              const orderStatus = String(row.getCell(6).value || "").trim() || "Pending";

              // Skip empty rows
              if ( !productCode) return;

              // Validation
              if (!customerEmail || !productCode) {
                throw new Error("Missing customer email or product code");
              }
              if (quantity <= 0) {
                throw new Error("Quantity must be greater than 0");
              }

              const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
              if (!validStatuses.includes(orderStatus)) {
                throw new Error(`Invalid order status '${orderStatus}'`);
              }

              ordersData.push({
                customerEmail,
                productCode,
                quantity,
                orderQuantity,
                orderDiscount,
                orderStatus,
              });
            } catch (err: any) {
              orderErrors.push({
                row: rowNumber,
                customerEmail: String(row.getCell(1).value || "").trim() || null,
                productCode: String(row.getCell(2).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        // If all rows failed validation
        if (ordersData.length === 0 && orderErrors.length > 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: orderErrors,
          });
        }

        // Import valid rows
        const orderResults = await orderService.ImportOrders(ordersData);

        const importResults: any = {
          orders: orderResults,
          errors: orderErrors,
          summary: {
            total: ordersData.length + orderErrors.length,
            success: orderResults.success?.length || 0,
            updated: orderResults.updated?.length || 0,
            failed: (orderResults.failed?.length || 0) + orderErrors.length,
            validationErrors: orderErrors.length,
          },
        };

        // Clean up file
        fs.unlinkSync(req.file.path);

        // Final response
        super.send(res, {
          message:
            orderErrors.length > 0
              ? "Import completed with some issues"
              : "Import completed successfully",
          results: importResults,
        });
      } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        console.error("Import error:", error);
        next(new Error(error.message || "Error processing import file"));
      }
    });
  }
}