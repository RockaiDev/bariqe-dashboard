// src/controllers/customer/index.ts
import { Request, Response, NextFunction } from "express";
import CustomerService from "../../services/mongodb/customer";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";

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
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== ".xlsx" && ext !== ".xls") {
      return cb(new Error("Only Excel files are allowed"));
    }
    cb(null, true);
  },
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

const customerService = new CustomerService();

export default class CustomerController extends BaseApi {
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
 
  // 🟢 Get all customers
  public async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.GetCustomers(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get one customer
  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.GetOneCustomer(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Add customer
  public async addCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.AddCustomer(req.body);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Edit customer
  public async editCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await customerService.EditOneCustomer(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Delete customer
  public async deleteCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await customerService.DeleteOneCustomer(req.params.id);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // ✅ Export customers to Excel
  public async exportCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const customers = await customerService.ExportCustomers(req.query);

      if (!customers || customers.length === 0) {
        return res.status(404).json({ message: "No customers found to export" });
      }

      // Create new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Bariqe El Tamioz";
      workbook.lastModifiedBy = "Bariqe El Tamioz System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Customers sheet
      const customersSheet = workbook.addWorksheet("Customers", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // ✅ Define columns for customers sheet
      customersSheet.columns = [
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Phone", key: "customerPhone", width: 20 },
        { header: "Email", key: "customerEmail", width: 30 },
        { header: "Address", key: "customerAddress", width: 40 },
        { header: "Source", key: "customerSource", width: 20 },
        { header: "Location", key: "customerLocation", width: 30 },
        { header: "Notes", key: "customerNotes", width: 40 },
        { header: "Created Date", key: "createdAt", width: 20 },
        { header: "Last Updated", key: "updatedAt", width: 20 },
      ];

      // Style header row
      customersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      customersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      customersSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add data
      customers.forEach((customer) => {
        const row = customersSheet.addRow(customer);

        // Format date columns
        if (customer.createdAt) {
          row.getCell("createdAt").value = new Date(customer.createdAt);
          row.getCell("createdAt").numFmt = "yyyy-mm-dd hh:mm:ss";
        }
        if (customer.updatedAt) {
          row.getCell("updatedAt").value = new Date(customer.updatedAt);
          row.getCell("updatedAt").numFmt = "yyyy-mm-dd hh:mm:ss";
        }
      });

      // Add borders to all cells
      customersSheet.eachRow((row, rowNumber) => {
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
        `attachment; filename=customers_export_${Date.now()}.xlsx`
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Export error:", err);
      next(err);
    }
  }

  // ✅ Download import template
  public async downloadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Bariqe El Tamioz";
      workbook.lastModifiedBy = "Bariqe El Tamioz System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Customers template sheet
      const customersSheet = workbook.addWorksheet("Customers", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // ✅ Define columns
      customersSheet.columns = [
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Phone", key: "customerPhone", width: 20 },
        { header: "Email", key: "customerEmail", width: 30 },
        { header: "Address", key: "customerAddress", width: 40 },
        { header: "Source", key: "customerSource", width: 20 },
        { header: "Location", key: "customerLocation", width: 30 },
        { header: "Notes", key: "customerNotes", width: 40 },
      ];

      // Style header
      customersSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      customersSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      customersSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // ✅ Add sample data
      const sampleRow = customersSheet.addRow({
        customerName: "John Doe",
        customerPhone: "+1234567890",
        customerEmail: "john.doe@example.com",
        customerAddress: "123 Main St, City, Country",
        customerSource: "order",
        customerLocation: "Cairo, Egypt",
        customerNotes: "VIP Customer",
      });

      // ✅ Add data validation for Source
      customersSheet.getCell("E2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"order,consultation,material_request,other"'],
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

      // ✅ Add instruction rows
      const instructions = [
        "How to use this template:",
        "",
        "1. Customers Sheet:",
        "   - Customer Name: Full name of the customer (REQUIRED)",
        "   - Phone: Customer phone number (REQUIRED, must be unique)",
        "   - Email: Customer email address (optional, must be unique if provided)",
        "   - Address: Customer address (REQUIRED)",
        "   - Source: How the customer found you (REQUIRED)",
        "     Options: order, consultation, material_request, other",
        "   - Location: Customer location/city (optional)",
        "   - Notes: Any additional notes about the customer (optional)",
        "",
        "2. Important Notes:",
        "   - Do not modify column headers",
        "   - Name, Phone, Address, and Source are required fields",
        "   - Name, Email and phone must be unique across all customers",
        "   - If a customer with the same name, email or phone exists, they will be updated",
        "   - Leave no empty rows between data",
        "   - Phone numbers should include country code",
        "",
        "3. Tips:",
        "   - You can export existing customers first to see the format",
        "   - Email addresses should be valid if provided",
        "   - Use consistent phone number format",
        "   - Customer name and phone are used as identifiers",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

      // Add borders to customers sheet
      customersSheet.eachRow((row, rowNumber) => {
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
        "attachment; filename=customers_import_template.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // ✅ Import customers from Excel
  public async importCustomers(req: Request, res: Response, next: NextFunction) {
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

        const customersSheet = workbook.getWorksheet("Customers");
        if (!customersSheet) {
          throw new Error("Missing 'Customers' sheet in the uploaded file");
        }

        const customersData: any[] = [];
        const customerErrors: any[] = [];

        customersSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const customerName = String(row.getCell(1).value || "").trim();
              const customerPhone = String(row.getCell(2).value || "").trim();
              const customerEmail = String(row.getCell(3).value || "").trim();
              const customerAddress = String(row.getCell(4).value || "").trim();
              const customerSource = String(row.getCell(5).value || "").trim();
              const customerLocation = String(row.getCell(6).value || "").trim();
              const customerNotes = String(row.getCell(7).value || "").trim();

              // Skip empty rows
              if (!customerName && !customerPhone && !customerAddress && !customerSource) return;

              // ✅ Validation - الحقول المطلوبة الجديدة
              if (!customerName || !customerPhone || !customerAddress || !customerSource) {
                throw new Error("Missing required fields (name, phone, address, or source)");
              }

              // Basic email validation if email is provided
              if (customerEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(customerEmail)) {
                  throw new Error(`Invalid email format: ${customerEmail}`);
                }
              }

              // ✅ Validate source
              const validSources = [
                "order",
                "consultation",
                "material_request",
                "other",
              ];
              if (customerSource && !validSources.includes(customerSource)) {
                throw new Error(`Invalid source: ${customerSource}. Valid options: ${validSources.join(', ')}`);
              }

              customersData.push({
                customerName,
                customerPhone,
                customerEmail: customerEmail || undefined,
                customerAddress,
                customerSource,
                customerLocation,
                customerNotes,
              });
            } catch (err: any) {
              customerErrors.push({
                row: rowNumber,
                customerName: String(row.getCell(1).value || "").trim() || null,
                customerPhone: String(row.getCell(2).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        // If all rows failed validation
        if (customersData.length === 0 && customerErrors.length > 0) {
          this.cleanupFile(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: customerErrors,
          });
        }

        // Import valid rows
        const customerResults = await customerService.ImportCustomers(
          customersData
        );

        const importResults: any = {
          customers: customerResults,
          errors: customerErrors,
          summary: {
            total: customersData.length + customerErrors.length,
            success: customerResults.success?.length || 0,
            updated: customerResults.updated?.length || 0,
            failed: (customerResults.failed?.length || 0) + customerErrors.length,
            validationErrors: customerErrors.length,
          },
        };

        // Clean up file
        this.cleanupFile(req.file.path);

        // Final response
        super.send(res, {
          message:
            customerErrors.length > 0
              ? "Import completed with some issues"
              : "Import completed successfully",
          results: importResults,
        });
      } catch (error: any) {
        if (req.file && fs.existsSync(req.file.path)) {
          this.cleanupFile(req.file.path);
        }
        console.error("Import error:", error);
        next(new Error(error.message || "Error processing import file"));
      }
    });
  }

  // 🟢 Bulk update customers
  public async bulkUpdateCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const { customers } = req.body;

      if (!customers || !Array.isArray(customers) || customers.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Invalid or empty customers array",
        });
      }

      // Validate each customer has at least a phone number (now primary identifier)
      const invalidCustomers = customers.filter(c => !c.customerPhone);
      if (invalidCustomers.length > 0) {
        return res.status(400).json({
          success: false,
          error: "All customers must have a phone number for bulk update",
        });
      }

      const results = await customerService.BulkUpdateCustomers(customers);

      super.send(res, {
        message: "Bulk update completed",
        summary: {
          total: customers.length,
          success: results.success.length,
          failed: results.failed.length,
        },
        details: results,
      });
    } catch (err) {
      next(err);
    }
  }

  // ✅ Export customers template for bulk operations
  public async exportBulkTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "Bariqe El Tamioz";
      workbook.lastModifiedBy = "Bariqe El Tamioz System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Bulk update template sheet
      const bulkSheet = workbook.addWorksheet("Bulk Update", {
        properties: { tabColor: { argb: "00FF00" } },
      });

      // ✅ Define columns
      bulkSheet.columns = [
        { header: "Phone (Required)", key: "customerPhone", width: 20 },
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Email", key: "customerEmail", width: 30 },
        { header: "Address", key: "customerAddress", width: 40 },
        { header: "Source", key: "customerSource", width: 20 },
        { header: "Location", key: "customerLocation", width: 30 },
        { header: "Notes", key: "customerNotes", width: 40 },
      ];

      // Style header
      bulkSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      bulkSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      bulkSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // ✅ Add sample data
      bulkSheet.addRow({
        customerPhone: "+1234567890",
        customerName: "Updated Name",
        customerEmail: "updated.email@example.com",
        customerAddress: "New Address",
        customerSource: "consultation",
        customerLocation: "Alexandria, Egypt",
        customerNotes: "Updated notes",
      });

      // ✅ Add data validation for Source
      bulkSheet.getCell("E2").dataValidation = {
        type: "list",
        allowBlank: true,
        formulae: ['"order,consultation,material_request,other"'],
      };

      // Add borders
      bulkSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

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

      // ✅ Add instruction rows
      const instructions = [
        "How to use this bulk update template:",
        "",
        "1. Phone is REQUIRED for identifying customers to update",
        "2. Only fill in the fields you want to update",
        "3. Leave fields empty if you don't want to change them",
        "4. Phone field cannot be updated (it's used as identifier)",
        "",
        "Important Notes:",
        "- Customer must exist with the given phone number",
        "- Email addresses must be unique if you're updating them",
        "- Source options: order, consultation, material_request, other",
        "- Phone number is used as the primary identifier",
        "- Location field is optional",
        "",
        "Tips:",
        "- Export existing customers first to get their phone numbers",
        "- Use the exact same phone format as in your database",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=customers_bulk_update_template.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Bulk template error:", err);
      next(err);
    }
  }
}