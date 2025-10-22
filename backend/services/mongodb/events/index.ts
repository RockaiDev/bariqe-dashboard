// src/services/mongodb/events/index.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import EventModel from "../../../models/eventSchema";
import { pick } from "lodash";
import fs from "fs";
import path from "path";
import CloudinaryService from "../../cloudinary/CloudinaryService";

export default class EventService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "titleAr",
      "titleEn", 
      "date",
      "tagsAr",
      "tagsEn",
      "contentAr",
      "contentEn",
      "eventImage",
      "eventImagePublicId",
      "files",
      "status",
      "author",
    ];
  }

  // 🟢 Get all events
  public async GetEvents(query: any) {
    const keys = this.keys.sort();
    const { perPage, page, sorts = [], queries = [] } = pick(query, [
      "perPage",
      "page", 
      "sorts",
      "queries",
    ]);

    const result = await super.PaginateHandler(
      EventModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    return { result, keys };
  }

  // 🟢 Get one event
  public async GetOneEvent(id: string) {
    try {
      const event = await EventModel.findById(id);
      if (!event) throw new ApiError("NOT_FOUND", "Event not found");
      return event;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Get event file with download URL
  public async GetEventFile(eventId: string, fileId: string) {
    try {
      const event = await EventModel.findById(eventId);
      if (!event) throw new ApiError("NOT_FOUND", "Event not found");

      const file = event.files?.find(f => f._id?.toString() === fileId);
      if (!file) throw new ApiError("NOT_FOUND", "File not found");

      // If file is stored in Cloudinary, generate download URL
      if (file.cloudinaryPublicId) {
        try {
          const downloadUrl = await CloudinaryService.getPdfDownloadUrl(file.cloudinaryPublicId);
          const previewUrl = await CloudinaryService.getPdfPreviewUrl(file.cloudinaryPublicId);
          
          return {
            ...file.toObject?.(),
            downloadUrl,
            previewUrl,
            isCloudinary: true
          };
        } catch (cloudinaryError) {
          console.error('Error generating Cloudinary URLs:', cloudinaryError);
          // Fallback to local file if Cloudinary fails
          return {
            ...file.toObject?.(),
            downloadUrl: file.path,
            previewUrl: file.path,
            isCloudinary: false
          };
        }
      }

      // Local file
      return {
        ...file.toObject?.(),
        downloadUrl: file.path,
        previewUrl: file.path,
        isCloudinary: false
      };
    } catch (error) {
      throw error;
    }
  }

  // Helper function to process tags
  private processTags(tags: string | string[]): string[] {
    if (Array.isArray(tags)) {
      return tags.map(tag => tag.trim()).filter(Boolean);
    }
    if (typeof tags === 'string') {
      return tags.split(',').map(tag => tag.trim()).filter(Boolean);
    }
    return [];
  }

  // 🟢 Add new event
  public async AddEvent(body: any, files?: any[]) {
    try {
      if (!body.titleAr || !body.titleEn || !body.date ||
          !body.contentAr || !body.contentEn) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'titleAr', 'titleEn', 'date', 'contentAr', 'contentEn' are required"
        );
      }

      // Process Arabic tags
      if (body.tagsAr) {
        body.tagsAr = this.processTags(body.tagsAr);
      }

      // Process English tags
      if (body.tagsEn) {
        body.tagsEn = this.processTags(body.tagsEn);
      }

      const newEvent = pick(body, this.keys);
      
      // Handle Cloudinary files (already processed by controller)
      if (body.files && Array.isArray(body.files)) {
        newEvent.files = body.files.map((file: any) => ({
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path, // Cloudinary URL
          cloudinaryPublicId: file.cloudinaryPublicId // Store public ID for downloads
        }));
      }

      const event = await super.addDocument(EventModel, newEvent);
      return event;
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (files && files.length > 0) {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      throw error;
    }
  }

  // 🟢 Edit event
  public async EditOneEvent(id: string, body: any, files?: any[]) {
    try {
      // Process Arabic tags
      if (body.tagsAr) {
        body.tagsAr = this.processTags(body.tagsAr);
      }

      // Process English tags
      if (body.tagsEn) {
        body.tagsEn = this.processTags(body.tagsEn);
      }

      const updateData = pick(body, this.keys);
      
      // Handle new Cloudinary files from controller
      if (body.newFiles && Array.isArray(body.newFiles)) {
        const newFiles = body.newFiles.map((file: any) => ({
          filename: file.filename,
          originalName: file.originalName,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path, // Cloudinary URL
          cloudinaryPublicId: file.cloudinaryPublicId
        }));

        // Get existing event to handle files
        const existingEvent = await EventModel.findById(id);
        if (existingEvent && existingEvent.files) {
          updateData.files = [...existingEvent.files, ...newFiles];
        } else {
          updateData.files = newFiles;
        }
      }

      const updatedEvent = await EventModel.findByIdAndUpdate(id, updateData, {
        new: true,
        runValidators: true,
      });

      if (!updatedEvent) {
        throw new ApiError("NOT_FOUND", `Event with id ${id} not found`);
      }

      return updatedEvent;
    } catch (error) {
      // Clean up uploaded files if error occurs
      if (files && files.length > 0) {
        files.forEach(file => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Event with id ${id} not found`);
    }
  }

  // 🟢 Delete event
  public async DeleteOneEvent(id: string) {
    try {
      // Get event to clean up files
      const event = await EventModel.findById(id);
      if (event) {
        // Delete image from Cloudinary
        if (event.eventImage) {
          await CloudinaryService.deleteImage(event.eventImage);
        }

        // Delete files from Cloudinary
        if (event.files && event.files.length > 0) {
          for (const file of event.files) {
            if (file.cloudinaryPublicId) {
              await CloudinaryService.deleteDocument(file.path);
            } else if (fs.existsSync(file.path)) {
              fs.unlinkSync(file.path);
            }
          }
        }
      }

      const deleted = await super.deleteDocument(EventModel, id);
      return deleted;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Event with id ${id} not found`);
    }
  }

  // 🟢 Remove file from event (for documents, not images)
  public async RemoveEventFile(eventId: string, fileId: string) {
    try {
      const event = await EventModel.findById(eventId);
      if (!event) throw new ApiError("NOT_FOUND", "Event not found");

      const fileIndex = event.files?.findIndex(f => f._id?.toString() === fileId);
      if (fileIndex === -1 || fileIndex === undefined) {
        throw new ApiError("NOT_FOUND", "File not found");
      }

      const fileToRemove = event.files![fileIndex];
      
      // Remove file from Cloudinary if it exists there
      if (fileToRemove.cloudinaryPublicId) {
        try {
          await CloudinaryService.deleteDocument(fileToRemove.path);
        } catch (cloudinaryError) {
          console.error('Error deleting from Cloudinary:', cloudinaryError);
          // Continue with database removal even if Cloudinary deletion fails
        }
      } else {
        // Remove file from filesystem (only if it's a local file)
        if (fileToRemove.path && !fileToRemove.path.startsWith('http') && fs.existsSync(fileToRemove.path)) {
          fs.unlinkSync(fileToRemove.path);
        }
      }

      // Remove file from database
      event.files!.splice(fileIndex, 1);
      await event.save();

      return event;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Export events for Excel
  public async ExportEvents(query: any) {
    try {
      const events = await EventModel.find({})
        .sort({ createdAt: -1 });

      const formattedEvents = events.map((event: any) => ({
        titleAr: event.titleAr,
        titleEn: event.titleEn,
        date: event.date,
        tagsAr: Array.isArray(event.tagsAr) ? event.tagsAr.join(', ') : event.tagsAr || '',
        tagsEn: Array.isArray(event.tagsEn) ? event.tagsEn.join(', ') : event.tagsEn || '',
        contentAr: event.contentAr,
        contentEn: event.contentEn,
        status: event.status,
        author: event.author,
        hasImage: event.eventImage ? 'Yes' : 'No',
        filesCount: event.files ? event.files.length : 0,
        createdAt: event.createdAt,
        updatedAt: event.updatedAt,
      }));

      return formattedEvents;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Import events from Excel data
  public async ImportEvents(eventsData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };

    for (const eventData of eventsData) {
      try {
        // التحقق من الحقول المطلوبة
        if (!eventData.titleAr || !eventData.titleEn || 
            !eventData.contentAr || !eventData.contentEn) {
          throw new Error("Missing required fields: Arabic/English titles or content");
        }

        // Process Arabic tags
        let processedTagsAr = [];
        if (eventData.tagsAr) {
          processedTagsAr = this.processTags(eventData.tagsAr);
        }

        // Process English tags
        let processedTagsEn = [];
        if (eventData.tagsEn) {
          processedTagsEn = this.processTags(eventData.tagsEn);
        }

        const newEventData = {
          titleAr: eventData.titleAr.trim(),
          titleEn: eventData.titleEn.trim(),
          date: new Date(eventData.date),
          tagsAr: processedTagsAr,
          tagsEn: processedTagsEn,
          contentAr: eventData.contentAr.trim(),
          contentEn: eventData.contentEn.trim(),
          status: eventData.status || 'draft',
          author: eventData.author || 'System',
        };

        // Check if event already exists (by titleEn and date)
        const existingEvent = await EventModel.findOne({
          titleEn: eventData.titleEn,
          date: newEventData.date
        });

        if (existingEvent) {
          // Update existing event
          const updatedEvent = await EventModel.findByIdAndUpdate(
            existingEvent._id,
            newEventData,
            { new: true }
          );
          results.updated.push(updatedEvent);
        } else {
          // Create new event
          const newEvent = await EventModel.create(newEventData);
          results.success.push(newEvent);
        }

      } catch (error: any) {
        results.failed.push({
          data: eventData,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return results;
  }
}