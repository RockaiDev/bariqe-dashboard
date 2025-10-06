// ContactController.ts
import { Request, Response, NextFunction } from "express";

import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import ContactService from "../../services/contact";

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

const contactService = new ContactService();

export default class ContactController extends BaseApi {
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

  // 🟢 Get all contacts
  public async getContacts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contactService.GetContacts(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Get one contact
  public async getOneContact(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contactService.GetOneContact(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Add contact
  public async addContact(req: Request, res: Response, next: NextFunction) {
    try {
      let contactData = { ...req.body };

      // Parse services if it's a JSON string
      if (contactData.services && typeof contactData.services === "string") {
        try {
          contactData.services = JSON.parse(contactData.services);
        } catch (error) {
          console.error("Error parsing services:", error);
        }
      }

      const data = await contactService.AddContact(contactData);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Edit contact
  public async editContact(req: Request, res: Response, next: NextFunction) {
    try {
      let contactData = { ...req.body };

      // Parse services if it's a JSON string
      if (contactData.services && typeof contactData.services === "string") {
        try {
          contactData.services = JSON.parse(contactData.services);
        } catch (error) {
          console.error("Error parsing services:", error);
        }
      }

      const data = await contactService.EditOneContact(
        req.params.id,
        contactData
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Delete contact
  public async deleteContact(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await contactService.DeleteOneContact(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Update contact status
  public async updateContactStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.body;
      const data = await contactService.UpdateContactStatus(
        req.params.id,
        status
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  // ✅ Export Contacts
  public async exportContacts(req: Request, res: Response) {
    try {
      // Get data
      const [exportData, statistics] = await Promise.all([
        contactService.ExportContacts(req.query),
        contactService.ExportContactStatistics(req.query),
      ]);

      console.log(
        `Exporting ${exportData.length} contacts with statistics`
      );

      // Create Excel file
      const workbook = new ExcelJS.Workbook();

      // 📋 Contacts Sheet
      const contactsWorksheet = workbook.addWorksheet("Contacts");

      // ✅ Define columns
      contactsWorksheet.columns = [
        { header: "Contact Name", key: "contactName", width: 30 },
        { header: "Email", key: "email", width: 35 },
        { header: "Phone Number", key: "phoneNumber", width: 20 },
        { header: "Address", key: "address", width: 40 },
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Customer Email", key: "customerEmail", width: 35 },
        { header: "Customer Company", key: "customerCompany", width: 30 },
        { header: "Services", key: "services", width: 50 },
        { header: "Message", key: "message", width: 60 },
        { header: "Status", key: "status", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
        { header: "Updated At", key: "updatedAt", width: 20 },
      ];

      // Style header
      const contactHeaderRow = contactsWorksheet.getRow(1);
      contactHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      contactHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      contactHeaderRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // ✅ Add data
      exportData.forEach((contact: any) => {
        contactsWorksheet.addRow({
          contactName: contact.contactName || "",
          email: contact.email || "",
          phoneNumber: contact.phoneNumber || "",
          address: contact.address || "",
          customerName: contact.customerName || "",
          customerEmail: contact.customerEmail || "",
          customerCompany: contact.customerCompany || "",
          services: contact.services || "",
          message: contact.message || "",
          status: contact.status ? "Active" : "Inactive",
          createdAt: contact.createdAt
            ? new Date(contact.createdAt).toLocaleString()
            : "",
          updatedAt: contact.updatedAt
            ? new Date(contact.updatedAt).toLocaleString()
            : "",
        });
      });

      // 📊 Statistics Sheet
      const statsWorksheet = workbook.addWorksheet("Contact Statistics");

      statsWorksheet.columns = [
        { header: "Metric", key: "metric", width: 35 },
        { header: "Value", key: "value", width: 20 },
      ];

      // Style header
      const statsHeaderRow = statsWorksheet.getRow(1);
      statsHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      statsHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF70AD47" },
      };
      statsHeaderRow.alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add statistics data
      statsWorksheet.addRow({ metric: "Total Contacts", value: statistics.total });
      statsWorksheet.addRow({ metric: "", value: "" }); // Empty row

      // By Status
      statsWorksheet.addRow({ metric: "By Status", value: "" });
      statsWorksheet.addRow({ metric: "  Active", value: statistics.byStatus.active });
      statsWorksheet.addRow({ metric: "  Inactive", value: statistics.byStatus.inactive });
      statsWorksheet.addRow({ metric: "", value: "" }); // Empty row

      // By Customer
      statsWorksheet.addRow({ metric: "By Customer", value: "" });
      statsWorksheet.addRow({
        metric: "  With Customer",
        value: statistics.byCustomer.withCustomer,
      });
      statsWorksheet.addRow({
        metric: "  Without Customer",
        value: statistics.byCustomer.withoutCustomer,
      });
      statsWorksheet.addRow({ metric: "", value: "" }); // Empty row

      // By Services
      statsWorksheet.addRow({ metric: "By Services", value: "" });
      Object.entries(statistics.byServices).forEach(([service, count]) => {
        statsWorksheet.addRow({ metric: `  ${service}`, value: count });
      });

      // 📊 Summary Sheet
      const summaryWorksheet = workbook.addWorksheet("Export Summary");
      summaryWorksheet.columns = [
        { header: "Export Information", key: "info", width: 30 },
        { header: "Value", key: "value", width: 20 },
      ];

      const summaryHeaderRow = summaryWorksheet.getRow(1);
      summaryHeaderRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      summaryHeaderRow.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF000000" },
      };

      const exportDate = new Date().toLocaleDateString();
      const exportTime = new Date().toLocaleTimeString();

      summaryWorksheet.addRow({ info: "Export Date", value: exportDate });
      summaryWorksheet.addRow({ info: "Export Time", value: exportTime });
      summaryWorksheet.addRow({
        info: "Total Contacts",
        value: exportData.length,
      });
      summaryWorksheet.addRow({
        info: "Active Contacts",
        value: statistics.byStatus.active,
      });
      summaryWorksheet.addRow({
        info: "Inactive Contacts",
        value: statistics.byStatus.inactive,
      });
      summaryWorksheet.addRow({
        info: "Contacts with Customer",
        value: statistics.byCustomer.withCustomer,
      });
      summaryWorksheet.addRow({
        info: "Contacts without Customer",
        value: statistics.byCustomer.withoutCustomer,
      });

      // Add borders to all sheets
      [contactsWorksheet, statsWorksheet, summaryWorksheet].forEach(
        (worksheet) => {
          worksheet.eachRow((row) => {
            row.eachCell((cell) => {
              cell.border = {
                top: { style: "thin" },
                left: { style: "thin" },
                bottom: { style: "thin" },
                right: { style: "thin" },
              };
            });
          });
        }
      );

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=contacts_export_${
          new Date().toISOString().split("T")[0]
        }.xlsx`
      );

      // Send file
      await workbook.xlsx.write(res);
      res.end();
    } catch (error: any) {
      console.log("Export error:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to export contacts",
      });
    }
  }

  // ✅ Download Template
  public async downloadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Contacts template sheet
      const contactsSheet = workbook.addWorksheet("Contacts", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // ✅ Define columns
      contactsSheet.columns = [
        { header: "Contact Name", key: "contactName", width: 30 },
        { header: "Email", key: "email", width: 35 },
        { header: "Phone Number", key: "phoneNumber", width: 20 },
        { header: "Address", key: "address", width: 40 },
        { header: "Customer Email", key: "customerEmail", width: 35 },
        { header: "Customer Name", key: "customerName", width: 30 },
        { header: "Services", key: "services", width: 50 },
        { header: "Message", key: "message", width: 60 },
        { header: "Status", key: "status", width: 15 },
      ];

      // Style header
      contactsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      contactsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      contactsSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // ✅ Add sample data
      const sampleRow = contactsSheet.addRow({
        contactName: "Ahmed Mohamed",
        email: "ahmed@example.com",
        phoneNumber: "+201234567890",
        address: "123 Main Street, Cairo, Egypt",
        customerEmail: "customer@company.com (must exist in system or leave empty)",
        customerName: "Customer Name (for reference)",
        services: "Technical Training & Consultation; Laboratory Setup & Support",
        message: "Sample contact message or inquiry",
        status: "Active",
      });

      // ✅ Add data validation for Status (column I)
      contactsSheet.getCell("I2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Active,Inactive"'],
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
        "1. Contacts Sheet:",
        "   - Contact Name: Full name of the person (required)",
        "   - Email: Valid email address (required)",
        "   - Phone Number: Phone number with country code (required)",
        "   - Address: Full address of the contact (required)",
        "   - Customer Email: Email of existing customer in system (optional)",
        "   - Customer Name: For reference only (optional)",
        "   - Services: Separate multiple services with semicolon (;)",
        "   - Message: Contact message or inquiry (required)",
        "   - Status: Active or Inactive",
        "",
        "2. Available Services:",
        "   - Technical Training & Consultation",
        "   - Equipment Sales & Solutions",
        "   - Quality Assurance & Validation",
        "   - Custom Chemical Solutions",
        "   - Laboratory Setup & Support",
        "   - Regulatory Compliance & Documentation",
        "   - Maintenance & After-Sales Support",
        "   - Research & Development Solutions",
        "",
        "3. Important Notes:",
        "   - Do not modify column headers",
        "   - Contact Name, Email, Phone Number, Address, and Message are required",
        "   - Customer Email must match an existing customer in the system (if provided)",
        "   - If Customer Email is not found, the contact will be created without customer",
        "   - Services should be separated by semicolon (;) if multiple",
        "   - Leave no empty rows between data",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

      // Add borders to all sheets
      [contactsSheet].forEach((sheet) => {
        sheet.eachRow((row, rowNumber) => {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "thin" },
              left: { style: "thin" },
              bottom: { style: "thin" },
              right: { style: "thin" },
            };
          });
        });
      });

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=contacts_import_template.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // ✅ Import contacts
  public async importContacts(req: Request, res: Response, next: NextFunction) {
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

        // ✅ Contacts sheet
        const contactsSheet = workbook.getWorksheet("Contacts");
        if (!contactsSheet) {
          throw new Error("Missing 'Contacts' sheet in the uploaded file");
        }

        const contactsData: any[] = [];
        const contactErrors: any[] = [];

        contactsSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const contactName = String(row.getCell(1).value || "").trim();
              const email = String(row.getCell(2).value || "").trim();
              const phoneNumber = String(row.getCell(3).value || "").trim();
              const address = String(row.getCell(4).value || "").trim();
              const customerEmail = String(row.getCell(5).value || "").trim();
              const customerName = String(row.getCell(6).value || "").trim();
              const services = String(row.getCell(7).value || "").trim();
              const message = String(row.getCell(8).value || "").trim();
              const status = String(row.getCell(9).value || "").trim();

              // Skip empty rows
              if (!contactName && !email) return;

              // ✅ Validation
              if (!contactName || !email || !phoneNumber || !address || !message) {
                throw new Error(
                  "Missing required fields (contactName, email, phoneNumber, address, message)"
                );
              }

              // Email validation
              const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
              if (!emailRegex.test(email)) {
                throw new Error("Invalid email format");
              }

              contactsData.push({
                contactName,
                email,
                phoneNumber,
                address,
                customerEmail: customerEmail || null,
                customerName: customerName || null,
                services,
                message,
                status,
              });
            } catch (err: any) {
              contactErrors.push({
                row: rowNumber,
                contactName: String(row.getCell(1).value || "").trim() || null,
                email: String(row.getCell(2).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        // If all rows failed
        if (contactsData.length === 0 && contactErrors.length > 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: contactErrors,
          });
        }

        // ✅ Import valid rows
        const contactResults = await contactService.ImportContacts(
          contactsData
        );

        const importResults: any = {
          contacts: contactResults,
          errors: contactErrors,
          summary: {
            total: contactsData.length + contactErrors.length,
            success: contactResults.success?.length || 0,
            updated: contactResults.updated?.length || 0,
            failed:
              (contactResults.failed?.length || 0) + contactErrors.length,
            validationErrors: contactErrors.length,
          },
        };

        // ✅ Clean up file
        fs.unlinkSync(req.file.path);

        // ✅ Final response
        super.send(res, {
          message:
            contactErrors.length > 0
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