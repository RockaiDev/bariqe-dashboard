// src/controllers/events/index.ts
import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import EventService from '../../services/mongodb/events/index';

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = file.fieldname === "file" ? "uploads/temp/" : "uploads/events/";
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
      // Excel files for import
      const ext = path.extname(file.originalname).toLowerCase();
      if (ext !== ".xlsx" && ext !== ".xls") {
        return cb(new Error("Only Excel files are allowed"));
      }
    } else if (file.fieldname === "eventFiles") {
      // Any files for events
      const allowedTypes = [
        "image/jpeg", "image/jpg", "image/png", "image/webp",
        "application/pdf", "text/plain", "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("File type not allowed"));
      }
    }
    cb(null, true);
  },
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const eventService = new EventService();

export default class EventController extends BaseApi {
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

  public async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await eventService.GetEvents(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await eventService.GetOneEvent(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async addEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const data = await eventService.AddEvent(req.body, files);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async editEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      const data = await eventService.EditOneEvent(req.params.id, req.body, files);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await eventService.DeleteOneEvent(req.params.id);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  public async removeEventFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, fileId } = req.params;
      const result = await eventService.RemoveEventFile(eventId, fileId);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  // 🟢 Export events to Excel
  public async exportEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const events = await eventService.ExportEvents(req.query);

      if (!events || events.length === 0) {
        return res.status(404).json({ message: "No events found to export" });
      }

      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.lastModifiedBy = "AlexChem System";
      workbook.created = new Date();
      workbook.modified = new Date();

      const eventsSheet = workbook.addWorksheet("Events", {
        properties: { tabColor: { argb: "0000FF" } },
      });

      eventsSheet.columns = [
        { header: "Title", key: "title", width: 30 },
        { header: "Date", key: "date", width: 15 },
        { header: "Tags", key: "tags", width: 25 },
        { header: "Content", key: "content", width: 50 },
        { header: "Status", key: "status", width: 15 },
        { header: "Author", key: "author", width: 20 },
        { header: "Files Count", key: "filesCount", width: 15 },
        { header: "Created At", key: "createdAt", width: 20 },
        { header: "Updated At", key: "updatedAt", width: 20 },
      ];

      // Style header row
      eventsSheet.getRow(1).font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };
      eventsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      // Add data
      events.forEach((event) => {
        const row = eventsSheet.addRow(event);
        row.getCell("date").numFmt = "dd/mm/yyyy";
        row.getCell("createdAt").numFmt = "dd/mm/yyyy hh:mm";
        row.getCell("updatedAt").numFmt = "dd/mm/yyyy hh:mm";
      });

      // Add borders
      eventsSheet.eachRow((row) => {
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
        `attachment; filename=events_export_${Date.now()}.xlsx`
      );

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
      const eventsSheet = workbook.addWorksheet("Events");

      eventsSheet.columns = [
        { header: "Title", key: "title", width: 30 },
        { header: "Date", key: "date", width: 15 },
        { header: "Tags", key: "tags", width: 25 },
        { header: "Content", key: "content", width: 50 },
        { header: "Status", key: "status", width: 15 },
        { header: "Author", key: "author", width: 20 },
      ];

      // Style header
      eventsSheet.getRow(1).font = { bold: true };
      eventsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };

      // Add sample data
      eventsSheet.addRow({
        title: "Sample Event",
        date: new Date(),
        tags: "tag1, tag2, tag3",
        content: "Sample event content...",
        status: "draft",
        author: "System",
      });

      // Add data validation for Status
      eventsSheet.getCell("E2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"draft,published,archived"'],
      };

      res.setHeader(
        "Content-Type",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=events_import_template.xlsx"
      );

      await workbook.xlsx.write(res);
    } catch (err) {
      console.error("Template download error:", err);
      next(err);
    }
  }

  // 🟢 Import events from Excel
  public async importEvents(req: Request, res: Response, next: NextFunction) {
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

        const eventsSheet = workbook.getWorksheet("Events");
        if (!eventsSheet) {
          throw new Error("Missing 'Events' sheet in the uploaded file");
        }

        const eventsData: any[] = [];
        const eventErrors: any[] = [];

        eventsSheet.eachRow((row, rowNumber) => {
          if (rowNumber > 1) {
            try {
              const title = String(row.getCell(1).value || "").trim();
              const date = row.getCell(2).value;
              const tags = String(row.getCell(3).value || "").trim();
              const content = String(row.getCell(4).value || "").trim();
              const status = String(row.getCell(5).value || "").trim() || "draft";
              const author = String(row.getCell(6).value || "").trim() || "System";

              if (!title && !content) return;

              if (!title || !content) {
                throw new Error("Missing title or content");
              }

              const validStatuses = ["draft", "published", "archived"];
              if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status '${status}'`);
              }

              eventsData.push({
                title,
                date: date || new Date(),
                tags,
                content,
                status,
                author,
              });
            } catch (err: any) {
              eventErrors.push({
                row: rowNumber,
                title: String(row.getCell(1).value || "").trim() || null,
                error: err.message,
              });
            }
          }
        });

        if (eventsData.length === 0 && eventErrors.length > 0) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({
            success: false,
            message: "All rows failed validation",
            errors: eventErrors,
          });
        }

        const eventResults = await eventService.ImportEvents(eventsData);

        const importResults = {
          events: eventResults,
          errors: eventErrors,
          summary: {
            total: eventsData.length + eventErrors.length,
            success: eventResults.success?.length || 0,
            updated: eventResults.updated?.length || 0,
            failed: (eventResults.failed?.length || 0) + eventErrors.length,
            validationErrors: eventErrors.length,
          },
        };

        fs.unlinkSync(req.file.path);

        super.send(res, {
          message: eventErrors.length > 0 
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