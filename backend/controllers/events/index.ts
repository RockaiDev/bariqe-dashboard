// src/controllers/events/index.ts
import { Request, Response, NextFunction } from "express";
import ExcelJS from "exceljs";
import multer from "multer";
import path from "path";
import fs from "fs";
import BaseApi from "../../utils/BaseApi";
import EventService from "../../services/mongodb/events/index";
import CloudinaryService from "../../services/cloudinary/CloudinaryService";

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir =
      file.fieldname === "file" ? "uploads/temp/" : "uploads/events/";
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
    } else if (file.fieldname === "eventImage") {
      // Images for events
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.mimetype)) {
        return cb(new Error("Only JPEG, PNG, and WebP images are allowed"));
      }
    } else if (file.fieldname === "eventFiles") {
      // Other documents
      const allowedTypes = [
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
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
  /**
   * Helper method to get existing event image safely
   */
  private getExistingEventImage(event: any): string | null {
    if (!event) return null;

    // Try different possible structures
    if (event.eventImage) return event.eventImage;
    if (event.data?.eventImage) return event.data.eventImage;
    if (event._doc?.eventImage) return event._doc.eventImage;

    return null;
  }

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

  /**
   * Get file information
   */
  public async getFileInfo(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, fileId } = req.params;

      const fileInfo = await eventService.GetEventFile(eventId, fileId);

      // التأكد من أن البيانات ليست undefined
      if (!fileInfo) {
        return super.send(res, {
          file: {
            _id: fileId,
            filename: '',
            originalName: '',
            mimetype: '',
            size: 0,
            path: '',
            isCloudinary: false
          },
          message: "File not found"
        });
      }

      super.send(res, {
        file: fileInfo,
        message: "File information retrieved successfully"
      });
    } catch (err) {
      // إرجاع بيانات افتراضية في حالة الخطأ
      super.send(res, {
        file: {
          _id: req.params.fileId,
          filename: '',
          originalName: '',
          mimetype: '',
          size: 0,
          path: '',
          isCloudinary: false
        },
        message: "Error retrieving file information"
      });
    }
  }

  /**
   * Download event file
   */
  public async downloadEventFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, fileId } = req.params;

      const fileInfo = await eventService.GetEventFile(eventId, fileId);

      if (fileInfo.isCloudinary && fileInfo.downloadUrl) {
        // إعادة التوجيه إلى رابط Cloudinary للتحميل
        return res.redirect(fileInfo.downloadUrl);
      } else if (fileInfo.isCloudinary && fileInfo.path) {
        // استخدام الرابط المباشر مع flags التحميل
        const downloadUrl = fileInfo.path.includes('fl_attachment') 
          ? fileInfo.path 
          : fileInfo.path.replace('/upload/', '/upload/fl_attachment/');
        return res.redirect(downloadUrl);
      } else {
        // Serve local file
        if (fs.existsSync(fileInfo.path)) {
          return res.download(fileInfo.path, fileInfo.originalName);
        } else {
          return res.status(404).json({ message: "File not found on server" });
        }
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Preview event file
   */
  public async previewEventFile(req: Request, res: Response, next: NextFunction) {
    try {
      const { eventId, fileId } = req.params;

      const fileInfo = await eventService.GetEventFile(eventId, fileId);

      if (fileInfo.isCloudinary && fileInfo.previewUrl) {
        // إعادة التوجيه إلى رابط Cloudinary للمعاينة
        return res.redirect(fileInfo.previewUrl);
      } else if (fileInfo.isCloudinary && fileInfo.path) {
        // استخدام الرابط المباشر بدون flags التحميل للمعاينة
        const previewUrl = fileInfo.path.replace('/fl_attachment/', '/');
        return res.redirect(previewUrl);
      } else {
        // Serve local file
        if (fs.existsSync(fileInfo.path)) {
          const fileStream = fs.createReadStream(fileInfo.path);
          res.setHeader('Content-Type', fileInfo.mimetype);
          res.setHeader('Content-Disposition', `inline; filename="${fileInfo.originalName}"`);
          fileStream.pipe(res);
        } else {
          return res.status(404).json({ message: "File not found on server" });
        }
      }
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get all events
   */
  public async getEvents(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await eventService.GetEvents(req.query);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Get single event
   */
  public async getOne(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await eventService.GetOneEvent(req.params.id);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Add new event
   */
  public async addEvent(req: Request, res: Response, next: NextFunction) {
    try {
      let eventData = { ...req.body };
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      let documentFiles: Express.Multer.File[] = [];
      let imageFile: Express.Multer.File | undefined;

      // Separate image from other files
      if (files) {
        imageFile = files["eventImage"] ? files["eventImage"][0] : undefined;
        documentFiles = files["eventFiles"] || [];
      }

      // Handle image upload if present
      if (imageFile) {
        const publicId = `event_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          imageFile.path,
          "events",
          publicId
        );
        eventData.eventImage = imageUrl;
        eventData.eventImagePublicId = publicId;

        // Clean up temporary file
        this.cleanupFile(imageFile.path);
      }

      // Handle document files upload to Cloudinary
      if (documentFiles && documentFiles.length > 0) {
        const uploadedFiles = [];
        for (const file of documentFiles) {
          try {
            const publicId = `event_doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Use the new PDF upload method
            const uploadResult = await CloudinaryService.uploadPdfFromPath(
              file.path,
              "events/documents",
              publicId
            );
            
            uploadedFiles.push({
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: uploadResult.url, // Store Cloudinary URL
              cloudinaryPublicId: uploadResult.publicId // Store public ID for downloads
            });

            // Clean up temporary file
            this.cleanupFile(file.path);
          } catch (uploadError) {
            console.error('Error uploading document to Cloudinary:', uploadError);
            // Fallback to local storage if Cloudinary fails
            uploadedFiles.push({
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: `/uploads/events/${file.filename}`,
              cloudinaryPublicId: null
            });
          }
        }
        eventData.files = uploadedFiles;
      }

      const data = await eventService.AddEvent(eventData, []);
      super.send(res, data);
    } catch (err) {
      // Clean up uploaded files in case of error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files) {
        Object.values(files)
          .flat()
          .forEach((file) => this.cleanupFile(file.path));
      }
      next(err);
    }
  }

  /**
   * Edit event
   */
  public async editEvent(req: Request, res: Response, next: NextFunction) {
    try {
      let eventData = { ...req.body };
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      let documentFiles: Express.Multer.File[] = [];
      let imageFile: Express.Multer.File | undefined;

      // Separate image from other files
      if (files) {
        imageFile = files["eventImage"] ? files["eventImage"][0] : undefined;
        documentFiles = files["eventFiles"] || [];
      }

      // Get existing event to check for old image
      const existingEvent = await eventService.GetOneEvent(req.params.id);
      const oldImageUrl = this.getExistingEventImage(existingEvent);

      // Handle image upload if present
      if (imageFile) {
        const publicId = `event_${req.params.id}_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadFromPath(
          imageFile.path,
          "events",
          publicId
        );
        eventData.eventImage = imageUrl;
        eventData.eventImagePublicId = publicId;

        // Clean up temporary file
        this.cleanupFile(imageFile.path);

        // Delete old image if it exists and upload was successful
        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      // Handle document files upload to Cloudinary
      if (documentFiles && documentFiles.length > 0) {
        const uploadedFiles = [];
        for (const file of documentFiles) {
          try {
            const publicId = `event_doc_${req.params.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            // Use the new PDF upload method
            const uploadResult = await CloudinaryService.uploadPdfFromPath(
              file.path,
              "events/documents",
              publicId
            );
            
            uploadedFiles.push({
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: uploadResult.url, // Store Cloudinary URL
              cloudinaryPublicId: uploadResult.publicId
            });

            // Clean up temporary file
            this.cleanupFile(file.path);
          } catch (uploadError) {
            console.error('Error uploading document to Cloudinary:', uploadError);
            // Fallback to local storage if Cloudinary fails
            uploadedFiles.push({
              filename: file.filename,
              originalName: file.originalname,
              mimetype: file.mimetype,
              size: file.size,
              path: `/uploads/events/${file.filename}`,
              cloudinaryPublicId: null
            });
          }
        }
        eventData.newFiles = uploadedFiles; // Use newFiles to distinguish from existing files
      }

      const data = await eventService.EditOneEvent(
        req.params.id,
        eventData,
        []
      );
      super.send(res, data);
    } catch (err) {
      // Clean up uploaded files in case of error
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };
      if (files) {
        Object.values(files)
          .flat()
          .forEach((file) => this.cleanupFile(file.path));
      }
      next(err);
    }
  }

  /**
   * Add event with base64 image
   */
  public async addEventWithBase64(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let eventData = { ...req.body };
      const files = req.files as Express.Multer.File[];

      // Handle base64 image upload if present
      if (eventData.eventImageBase64) {
        const publicId = `event_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          eventData.eventImageBase64,
          "events",
          publicId
        );
        eventData.eventImage = imageUrl;
        eventData.eventImagePublicId = publicId;

        // Remove base64 data from request
        delete eventData.eventImageBase64;
      }

      const data = await eventService.AddEvent(eventData, files);
      super.send(res, data);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Edit event with base64 image
   */
  public async editEventWithBase64(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      let eventData = { ...req.body };
      const files = req.files as Express.Multer.File[];

      // Get existing event to check for old image
      const existingEvent = await eventService.GetOneEvent(req.params.id);
      const oldImageUrl = this.getExistingEventImage(existingEvent);

      // Handle base64 image upload if present
      if (eventData.eventImageBase64) {
        const publicId = `event_${req.params.id}_${Date.now()}`;
        const imageUrl = await CloudinaryService.uploadImageFromBase64(
          eventData.eventImageBase64,
          "events",
          publicId
        );
        eventData.eventImage = imageUrl;
        eventData.eventImagePublicId = publicId;

        // Remove base64 data from request
        delete eventData.eventImageBase64;

        // Delete old image if it exists and upload was successful
        if (oldImageUrl) {
          await CloudinaryService.deleteImage(oldImageUrl);
        }
      }

      const data = await eventService.EditOneEvent(
        req.params.id,
        eventData,
        files
      );
      super.send(res, data);
    } catch (err) {
      console.error("Edit with base64 error:", err);
      next(err);
    }
  }

  /**
   * Change event image only
   */
  public async changeEventImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const eventId = req.params.id;

      // Get existing event
      const existingEvent = await eventService.GetOneEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      const oldImageUrl = this.getExistingEventImage(existingEvent);
      let newImageUrl: string | null = null;
      let publicId: string | null = null;

      // Handle different upload types
      if (req.file) {
        // File upload
        publicId = `event_${eventId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadFromPath(
          req.file.path,
          "events",
          publicId
        );
        this.cleanupFile(req.file.path);
      } else if (req.body.eventImageBase64) {
        // Base64 upload
        publicId = `event_${eventId}_${Date.now()}`;
        newImageUrl = await CloudinaryService.uploadImageFromBase64(
          req.body.eventImageBase64,
          "events",
          publicId
        );
      } else {
        return res.status(400).json({ message: "No image provided" });
      }

      // Update event with new image
      const data = await eventService.EditOneEvent(eventId, {
        eventImage: newImageUrl,
        eventImagePublicId: publicId,
      });

      // Delete old image if update was successful
      if (oldImageUrl && data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Event image updated successfully",
        data: data,
        newImageUrl: newImageUrl,
      });
    } catch (err) {
      // Clean up uploaded file in case of error
      if (req.file) {
        this.cleanupFile(req.file.path);
      }
      next(err);
    }
  }

  /**
   * Remove event image only
   */
  public async removeEventImage(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const eventId = req.params.id;

      // Get existing event
      const existingEvent = await eventService.GetOneEvent(eventId);
      if (!existingEvent) {
        return res.status(404).json({ message: "Event not found" });
      }

      const oldImageUrl = this.getExistingEventImage(existingEvent);
      if (!oldImageUrl) {
        return res
          .status(400)
          .json({ message: "Event has no image to remove" });
      }

      // Remove image from event
      const data = await eventService.EditOneEvent(eventId, {
        eventImage: null,
        eventImagePublicId: null,
      });

      // Delete image from Cloudinary if update was successful
      if (data) {
        await CloudinaryService.deleteImage(oldImageUrl);
      }

      super.send(res, {
        message: "Event image removed successfully",
        data: data,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Delete event
   */
  public async deleteEvent(req: Request, res: Response, next: NextFunction) {
    try {
      // Get existing event to delete image
      const existingEvent = await eventService.GetOneEvent(req.params.id);
      const imageUrl = this.getExistingEventImage(existingEvent);

      const result = await eventService.DeleteOneEvent(req.params.id);

      // Delete image from Cloudinary if event deletion was successful
      if (imageUrl && result) {
        await CloudinaryService.deleteImage(imageUrl);
      }

      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Remove event file
   */
  public async removeEventFile(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const { eventId, fileId } = req.params;
      
      // Get the event to find the file details
      const event = await eventService.GetOneEvent(eventId);
      if (!event || !event.files) {
        return res.status(404).json({ message: "Event or file not found" });
      }

      const fileToRemove = event.files.find((f: any) => f._id?.toString() === fileId);
      if (!fileToRemove) {
        return res.status(404).json({ message: "File not found" });
      }

      // Delete from Cloudinary if it has a cloudinaryPublicId
      if ((fileToRemove as any).cloudinaryPublicId) {
        try {
          await CloudinaryService.deleteDocument(fileToRemove.path);
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
          // Continue with local deletion even if Cloudinary fails
        }
      }

      const result = await eventService.RemoveEventFile(eventId, fileId);
      super.send(res, result);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Export events to Excel
   */
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
        { header: "Title (Arabic)", key: "titleAr", width: 30 },
        { header: "Title (English)", key: "titleEn", width: 30 },
        { header: "Date", key: "date", width: 15 },
        { header: "Tags (Arabic)", key: "tagsAr", width: 25 },
        { header: "Tags (English)", key: "tagsEn", width: 25 },
        { header: "Content (Arabic)", key: "contentAr", width: 50 },
        { header: "Content (English)", key: "contentEn", width: 50 },
        { header: "Status", key: "status", width: 15 },
        { header: "Author", key: "author", width: 20 },
        { header: "Has Image", key: "hasImage", width: 15 },
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
      eventsSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
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

  /**
   * Download import template
   */
  public async downloadTemplate(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      workbook.creator = "AlexChem";
      workbook.created = new Date();

      const eventsSheet = workbook.addWorksheet("Events");

      eventsSheet.columns = [
        { header: "Title (Arabic)", key: "titleAr", width: 30 },
        { header: "Title (English)", key: "titleEn", width: 30 },
        { header: "Date", key: "date", width: 15 },
        { header: "Tags (Arabic)", key: "tagsAr", width: 25 },
        { header: "Tags (English)", key: "tagsEn", width: 25 },
        { header: "Content (Arabic)", key: "contentAr", width: 50 },
        { header: "Content (English)", key: "contentEn", width: 50 },
        { header: "Status", key: "status", width: 15 },
        { header: "Author", key: "author", width: 20 },
      ];

      // Style header
      eventsSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      eventsSheet.getRow(1).fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF4472C4" },
      };
      eventsSheet.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
      };

      // Add sample data
      eventsSheet.addRow({
        titleAr: "حدث تجريبي",
        titleEn: "Sample Event",
        date: new Date(),
        tagsAr: "تاق1, تاق2, تاق3",
        tagsEn: "tag1, tag2, tag3",
        contentAr: "محتوى الحدث التجريبي...",
        contentEn: "Sample event content...",
        status: "draft",
        author: "System",
      });

      // Add data validation for Status
      eventsSheet.getCell("H2").dataValidation = {
        type: "list",
        allowBlank: false,
        formulae: ['"draft,published,archived"'],
      };

      // Add instructions sheet
      const instructionsSheet = workbook.addWorksheet("Instructions");
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
        "1. Title (Arabic): Event title in Arabic (required)",
        "2. Title (English): Event title in English (required)",
        "3. Date: Event date (required)",
        "4. Tags (Arabic): Event tags in Arabic separated by commas (optional)",
        "5. Tags (English): Event tags in English separated by commas (optional)",
        "6. Content (Arabic): Event content in Arabic (required)",
        "7. Content (English): Event content in English (required)",
        "8. Status: Must be one of: draft, published, archived",
        "9. Author: Event author (optional, defaults to 'System')",
        "",
        "Important Notes:",
        "- Do not modify column headers",
        "- Both Arabic and English titles are required",
        "- Both Arabic and English content are required",
        "- Tags should be separated by commas",
        "- Date format should be recognizable (DD/MM/YYYY or MM/DD/YYYY)",
        "- Images must be uploaded separately after import",
      ];

      instructions.forEach((text, index) => {
        if (index > 0) {
          instructionsSheet.addRow([text]);
        }
      });

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

  /**
   * Import events from Excel
   */
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
              const titleAr = String(row.getCell(1).value || "").trim();
              const titleEn = String(row.getCell(2).value || "").trim();
              const date = row.getCell(3).value;
              const tagsAr = String(row.getCell(4).value || "").trim();
              const tagsEn = String(row.getCell(5).value || "").trim();
              const contentAr = String(row.getCell(6).value || "").trim();
              const contentEn = String(row.getCell(7).value || "").trim();
              const status =
                String(row.getCell(8).value || "").trim() || "draft";
              const author =
                String(row.getCell(9).value || "").trim() || "System";

              // Skip empty rows
              if (!titleAr && !titleEn && !contentAr && !contentEn) return;

              // Validation
              if (!titleAr || !titleEn) {
                throw new Error("Missing Arabic or English title");
              }
              if (!contentAr || !contentEn) {
                throw new Error("Missing Arabic or English content");
              }

              const validStatuses = ["draft", "published", "archived"];
              if (!validStatuses.includes(status)) {
                throw new Error(`Invalid status '${status}'`);
              }

              eventsData.push({
                titleAr,
                titleEn,
                date: date || new Date(),
                tagsAr,
                tagsEn,
                contentAr,
                contentEn,
                status,
                author,
              });
            } catch (err: any) {
              eventErrors.push({
                row: rowNumber,
                titleEn: String(row.getCell(2).value || "").trim() || null,
                titleAr: String(row.getCell(1).value || "").trim() || null,
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
          message:
            eventErrors.length > 0
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