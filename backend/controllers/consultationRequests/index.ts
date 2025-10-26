// src/controllers/consultationRequests/index.ts
import { Request, Response, NextFunction } from "express";
import ConsultationRequestsService from "../../services/mongodb/consultationRequests";
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

const consultationRequestsService = new ConsultationRequestsService();

export default class ConsultationRequestsController extends BaseApi {
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

  public async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await consultationRequestsService.GetConsultationRequests(
        req.query
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await consultationRequestsService.GetOneConsultationRequest(
        req.params.id
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async add(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await consultationRequestsService.AddConsultationRequest(
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async edit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await consultationRequestsService.EditOneConsultationRequest(
        req.params.id,
        req.body
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result =
        await consultationRequestsService.DeleteOneConsultationRequest(
          req.params.id
        );
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export consultation requests to Excel
  public async exportConsultationRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const consultationRequests =
        await consultationRequestsService.ExportConsultationRequests(req.query);

      if (!consultationRequests || consultationRequests.length === 0) {
        return res
          .status(404)
          .json({ message: "No consultation requests found to export" });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const requestsSheet = workbook.addWorksheet("Consultation Requests", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      requestsSheet.columns = [
        { header: "Request ID", key: "requestId", width: 25 },
        { header: "Client Name", key: "requestName", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Customer Address", key: "customerAddress", width: 30 },
        { header: "Consultation Area", key: "area", width: 25 },
        { header: "Message", key: "message", width: 50 },
        { header: "Status", key: "status", width: 15 },
        { header: "Customer ID", key: "customerId", width: 25 },
        { header: "Request Date", key: "requestDate", width: 20 },
        { header: "Last Updated", key: "lastUpdated", width: 20 },
      ];

      // Style header row
      requestsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      requestsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      requestsSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add data
      consultationRequests.forEach((request) => {
        const row = requestsSheet.addRow(request);
        row.getCell("requestDate").numFmt = "dd/mm/yyyy hh:mm";
        row.getCell("lastUpdated").numFmt = "dd/mm/yyyy hh:mm";

        const statusCell = row.getCell("status");
        switch (request.status?.toLowerCase()) {
          case "closed":
            statusCell.font = { color: { argb: "FF008000" } };
            break;
          case "new":
            statusCell.font = { color: { argb: "FFFF8C00" } };
            break;
          case "contacted":
            statusCell.font = { color: { argb: "FF0000FF" } };
            break;
          default:
            statusCell.font = { color: { argb: "FF000000" } };
        }
      });

      // Add borders
      requestsSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=consultation_requests_export_${Date.now()}.xlsx`
      );

      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Export error:", err);
      next(err);
    }
  }

  // 🟢 Download import template
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

      const requestsSheet = workbook.addWorksheet("Consultation Requests", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      requestsSheet.columns = [
        { header: "Client Name", key: "requestName", width: 25 },
        { header: "Email", key: "email", width: 30 },
        { header: "Phone", key: "phone", width: 20 },
        { header: "Customer Address", key: "customerAddress", width: 30 },
        { header: "Consultation Area", key: "area", width: 25 },
        { header: "Message", key: "message", width: 50 },
        { header: "Status", key: "status", width: 15 },
      ];

      // Style header
      requestsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      requestsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      requestsSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add sample data
      requestsSheet.addRow({
        requestName: "John Doe",
        email: "john.doe@example.com",
        phone: "+1234567890",
        customerAddress: "123 Main St, City, Country",
        area: "Chemical Analysis",
        message:
          "I need consultation regarding chemical analysis procedures for my research project.",
        status: "new",
      });

      // Add data validation for Status
      requestsSheet.getCell("G2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"new,contacted,closed"'],
      };

      // Add instructions sheet
      const instructionsSheet = workbook.addWorksheet("Instructions", {
        properties: { tabColor: { argb: "FF0000" } },
      });

      instructionsSheet.columns = [
        { header: "Instructions", key: "instructions", width: 80 },
      ];

      instructionsSheet.getRow(1).font = { bold: true };
      instructionsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FFFF0000" },
      };

      const instructions = [
        "How to use this template:",
        "",
        "1. Consultation Requests Sheet:",
        "   - Client Name: Name of the person requesting consultation (required)",
        "   - Email: Client's email address (optional)",
        "   - Phone: Client's phone number (required)",
        "   - Customer Address: Customer's address (optional)",
        "   - Consultation Area: Area/field of consultation needed (required)",
        "   - Message: Detailed description of consultation needed (required)",
        "   - Status: Choose from: new, contacted, closed",
        "",
        "2. Important Notes:",
        "   - Do not modify column headers",
        "   - A customer will be created automatically for each consultation request",
        "   - All fields except Address and Status are required",
        "   - Email addresses must be valid format",
        "   - Leave no empty rows between data",
        "   - Status defaults to 'new' if not specified",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

      // Add borders
      requestsSheet.eachRow((row, rowNumber) => {
        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      });

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=consultation_requests_import_template.xlsx"
      );

      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // 🟢 Import consultation requests from Excel
  public async importConsultationRequests(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
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

        const requestsSheet = workbook.getWorksheet("Consultation Requests");
        if (!requestsSheet) {
          throw new Error(
            "Missing 'Consultation Requests' sheet in the uploaded file"
          );
        }

        const requestsData: any[] = [];
        const requestErrors: any[] = [];

        requestsSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const requestName = String(row.getCell(1).value || "").trim();
              const email = String(row.getCell(2).value || "").trim();
              const phone = String(row.getCell(3).value || "").trim();
              const customerAddress = String(row.getCell(4).value || "").trim();
              const area = String(row.getCell(5).value || "").trim();
              const message = String(row.getCell(6).value || "").trim();
              const status = String(row.getCell(7).value || "").trim() || "new";

              if (!requestName && !email) return;

              if (!requestName || !email || !phone || !area || !message) {
                throw new Error("Missing required fields");
              }

              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(email)) {
                throw new Error("Invalid email format");
              }

              const validStatuses = ["new", "contacted", "closed"];
              if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status '${status}'`);
              }

              requestsData.push({
                requestName,
                email,
                phone,
                customerAddress,
                area,
                message,
                status,
              });
            } catch (err: any) {
              requestErrors.push({
                row: rowNumber,
                requestName: String(row.getCell(1).value || "").trim() || null,
                email: String(row.getCell(2).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        if (requestsData.length === 0 && requestErrors.length > 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: requestErrors,
          });
        }

        const requestResults =
          await consultationRequestsService.ImportConsultationRequests(
            requestsData
          );

        const importResults: any = {
          consultationRequests: requestResults,
          errors: requestErrors,
          summary: {
            total: requestsData.length + requestErrors.length,
            success: requestResults.success?.length || 0,
            updated: requestResults.updated?.length || 0,
            failed: (requestResults.failed?.length || 0) + requestErrors.length,
            validationErrors: requestErrors.length,
            customersCreated: requestResults.customers?.length || 0,
          },
        };

        fs.unlinkSync(req.file.path);

        super.send(res, {
          message:
            requestErrors.length > 0
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
