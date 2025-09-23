// src/services/mongodb/events/index.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import EventModel from "../../../models/eventSchema";
import { pick } from "lodash";
import fs from "fs";
import path from "path";

export default class EventService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "title",
      "date",
      "tags",
      "content",
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

  // 🟢 Add new event
  public async AddEvent(body: any, files?: any[]) {
    try {
      if (!body.title || !body.date || !body.content) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'title', 'date', 'content' are required"
        );
      }

      // Process tags
      if (body.tags && typeof body.tags === 'string') {
        body.tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      const newEvent = pick(body, this.keys);
      
      // Handle file uploads
      if (files && files.length > 0) {
        newEvent.files = files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
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
      // Process tags
      if (body.tags && typeof body.tags === 'string') {
        body.tags = body.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
      }

      const updateData = pick(body, this.keys);
      
      // Handle new file uploads
      if (files && files.length > 0) {
        const newFiles = files.map(file => ({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: file.path,
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
      if (event && event.files && event.files.length > 0) {
        event.files.forEach((file: any) => {
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
        });
      }

      const deleted = await super.deleteDocument(EventModel, id);
      return deleted;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Event with id ${id} not found`);
    }
  }

  // 🟢 Remove file from event
  public async RemoveEventFile(eventId: string, fileId: string) {
    try {
      const event = await EventModel.findById(eventId);
      if (!event) throw new ApiError("NOT_FOUND", "Event not found");

      const fileIndex = event.files?.findIndex(f => f._id?.toString() === fileId);
      if (fileIndex === -1 || fileIndex === undefined) {
        throw new ApiError("NOT_FOUND", "File not found");
      }

      const fileToRemove = event.files![fileIndex];
      
      // Remove file from filesystem
      if (fs.existsSync(fileToRemove.path)) {
        fs.unlinkSync(fileToRemove.path);
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
        title: event.title,
        date: event.date,
        tags: Array.isArray(event.tags) ? event.tags.join(', ') : event.tags || '',
        content: event.content,
        status: event.status,
        author: event.author,
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
        // Process tags
        if (eventData.tags && typeof eventData.tags === 'string') {
          eventData.tags = eventData.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean);
        }

        const newEventData = {
          title: eventData.title,
          date: new Date(eventData.date),
          tags: eventData.tags || [],
          content: eventData.content,
          status: eventData.status || 'draft',
          author: eventData.author || 'System',
        };

        // Check if event already exists (by title and date)
        const existingEvent = await EventModel.findOne({
          title: eventData.title,
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