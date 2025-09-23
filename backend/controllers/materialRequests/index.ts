// src/controllers/materialRequest/index.ts
import { Request, Response, NextFunction } from "express";

import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import MaterialRequestService from '../../services/mongodb/materialRequests/index';

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

const materialRequestService = new MaterialRequestService();

export default class MaterialRequestController extends BaseApi {
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

  public async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await materialRequestService.GetMaterialRequests(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await materialRequestService.GetOneMaterialRequest(
        req.params.id
      );
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async add(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await materialRequestService.AddMaterialRequest(req.body);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async edit(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await materialRequestService.EditOneMaterialRequest(
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
        await materialRequestService.DeleteOneMaterialRequest(req.params.id);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export material requests to Excel
  public async exportMaterialRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const materialRequests = await materialRequestService.ExportMaterialRequests(req.query);

      if (!materialRequests || materialRequests.length === 0) {
        return res.status(404).json({ message: "No material requests found to export" });
      }

      // Create new workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      // Material Requests sheet
      const requestsSheet = workbook.addWorksheet("Material Requests", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // Define columns for requests sheet
      requestsSheet.columns = [
        { header: "Request ID", key: "requestId", width: 25 },
        { header: "Material Name", key: "materialName", width: 30 },
        { header: "Contact Email", key: "materialEmail", width: 30 },
        { header: "Contact Phone", key: "materialPhone", width: 20 },
        { header: "Quantity", key: "materialQuantity", width: 15 },
        { header: "Intended Use", key: "materialIntendedUse", width: 40 },
        { header: "Status/Actions", key: "materialActions", width: 20 },
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
      materialRequests.forEach((request) => {
        const row = requestsSheet.addRow(request);

        // Format date columns
        row.getCell("requestDate").numFmt = "dd/mm/yyyy hh:mm";
        row.getCell("lastUpdated").numFmt = "dd/mm/yyyy hh:mm";

        // Add conditional formatting for status
        const statusCell = row.getCell("materialActions");
        switch (request.materialActions?.toLowerCase()) {
          case "completed":
          case "approved":
            statusCell.font = { color: { argb: "FF008000" } };
            break;
          case "pending":
            statusCell.font = { color: { argb: "FFFF8C00" } };
            break;
          case "rejected":
          case "cancelled":
            statusCell.font = { color: { argb: "FFFF0000" } };
            break;
          default:
            statusCell.font = { color: { argb: "FF000000" } };
        }
      });

      // Add borders to all cells
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

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=material_requests_export_${Date.now()}.xlsx`
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

      // Material Requests template sheet
      const requestsSheet = workbook.addWorksheet("Material Requests", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      // Define columns
      requestsSheet.columns = [
        { header: "Material Name", key: "materialName", width: 30 },
        { header: "Contact Email", key: "materialEmail", width: 30 },
        { header: "Contact Phone", key: "materialPhone", width: 20 },
        { header: "Quantity", key: "materialQuantity", width: 15 },
        { header: "Intended Use", key: "materialIntendedUse", width: 40 },
        { header: "Status/Actions", key: "materialActions", width: 20 },
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
      const sampleRow = requestsSheet.addRow({
        materialName: "Sodium Chloride",
        materialEmail: "customer@example.com",
        materialPhone: "+1234567890",
        materialQuantity: "10 kg",
        materialIntendedUse: "Laboratory research and testing",
        materialActions: "Pending",
      });

      // Add data validation for Status
      requestsSheet.getCell("F2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"Pending,Approved,Rejected,Completed,Cancelled"'],
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
        "1. Material Requests Sheet:",
        "   - Material Name: Name of the requested material (required)",
        "   - Contact Email: Customer's email address (required)",
        "   - Contact Phone: Customer's phone number (required)",
        "   - Quantity: Amount/quantity requested (required)",
        "   - Intended Use: Purpose of the material request (required)",
        "   - Status/Actions: Choose from: Pending, Approved, Rejected, Completed, Cancelled",
        "",
        "2. Important Notes:",
        "   - Do not modify column headers",
        "   - All fields except Status/Actions are required",
        "   - Email addresses must be valid format",
        "   - Leave no empty rows between data",
        "   - Status defaults to 'Pending' if not specified",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

      // Add borders to requests sheet
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

      // Set response headers
      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=material_requests_import_template.xlsx"
      );

      // Write to response
      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // 🟢 Import material requests from Excel
  public async importMaterialRequests(req: Request, res: Response, next: NextFunction) {
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

        // Material Requests sheet
        const requestsSheet = workbook.getWorksheet("Material Requests");
        if (!requestsSheet) {
          throw new Error("Missing 'Material Requests' sheet in the uploaded file");
        }

        const requestsData: any[] = [];
        const requestErrors: any[] = [];

        requestsSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const materialName = String(row.getCell(1).value || "").trim();
              const materialEmail = String(row.getCell(2).value || "").trim();
              const materialPhone = String(row.getCell(3).value || "").trim();
              const materialQuantity = String(row.getCell(4).value || "").trim();
              const materialIntendedUse = String(row.getCell(5).value || "").trim();
              const materialActions = String(row.getCell(6).value || "").trim() || "Pending";

              // Skip empty rows
              if (!materialName && !materialEmail) return;

              // Validation
              if (!materialName || !materialEmail || !materialPhone || !materialQuantity || !materialIntendedUse) {
                throw new Error("Missing required fields");
              }

              // Email validation
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!emailRegex.test(materialEmail)) {
                throw new Error("Invalid email format");
              }

              const validStatuses = ["Pending", "Approved", "Rejected", "Completed", "Cancelled"];
              if (!validStatuses.includes(materialActions)) {
                throw new Error(`Invalid status '${materialActions}'`);
              }

              requestsData.push({
                materialName,
                materialEmail,
                materialPhone,
                materialQuantity,
                materialIntendedUse,
                materialActions,
              });
            } catch (err: any) {
              requestErrors.push({
                row: rowNumber,
                materialName: String(row.getCell(1).value || "").trim() || null,
                materialEmail: String(row.getCell(2).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        // If all rows failed validation
        if (requestsData.length === 0 && requestErrors.length > 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: requestErrors,
          });
        }

        // Import valid rows
        const requestResults = await materialRequestService.ImportMaterialRequests(requestsData);

        const importResults: any = {
          materialRequests: requestResults,
          errors: requestErrors,
          summary: {
            total: requestsData.length + requestErrors.length,
            success: requestResults.success?.length || 0,
            updated: requestResults.updated?.length || 0,
            failed: (requestResults.failed?.length || 0) + requestErrors.length,
            validationErrors: requestErrors.length,
          },
        };

        // Clean up file
        fs.unlinkSync(req.file.path);

        // Final response
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