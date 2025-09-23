// src/services/mongodb/materialRequest.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import MaterialRequestModel from "../../../models/materialRequestsSchema";
import { pick } from "lodash";

export default class MaterialRequestService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "materialName",
      "materialEmail", // Fixed typo from "materialEmail"
      "materialPhone",
      "materialQuantity",
      "materialIntendedUse",
      "materialActions",
    ];
  }

  // 🟢 Get all material requests with pagination & sorting
  public async GetMaterialRequests(query: any) {
    const keys = this.keys.sort();
    const { perPage, page, sorts = [], queries = [] } = pick(query, [
      "perPage",
      "page",
      "sorts",
      "queries",
    ]);

    const result = await super.PaginateHandler(
      MaterialRequestModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    return { result, keys };
  }

  // 🟢 Get one material request by ID
  public async GetOneMaterialRequest(id: string) {
    try {
      const reqDoc = await super.getDocument(MaterialRequestModel, id);
      if (!reqDoc) throw new ApiError("NOT_FOUND", "Material Request not found");
      return reqDoc;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Add new material request
  public async AddMaterialRequest(body: any) {
    try {
      if (
        !body.materialName ||
        !body.materialEmail ||
        !body.materialPhone ||
        !body.materialQuantity ||
        !body.materialIntendedUse
      ) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'materialName', 'materialEmail', 'materialPhone', 'materialQuantity', 'materialIntendedUse' are required"
        );
      }

      const newReq = pick(body, this.keys);
      const materialRequest = await super.addDocument(
        MaterialRequestModel,
        newReq
      );
      return materialRequest;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit material request
  public async EditOneMaterialRequest(id: string, body: any) {
    try {
      const updateData = pick(body, this.keys);
      const updatedReq = await super.editDocument(
        MaterialRequestModel,
        id,
        updateData
      );
      return updatedReq;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "NOT_FOUND",
        `Material Request with id ${id} not found`
      );
    }
  }

  // 🟢 Delete material request
  public async DeleteOneMaterialRequest(id: string) {
    try {
      const result = await super.deleteDocument(MaterialRequestModel, id);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "NOT_FOUND",
        `Material Request with id ${id} not found`
      );
    }
  }

  // 🟢 Export material requests for Excel
  public async ExportMaterialRequests(query: any) {
    try {
      const { sorts = [], queries = [] } = pick(query, ["sorts", "queries"]);

      // Get all material requests without pagination for export
      const materialRequests = await MaterialRequestModel.find({})
        .sort({ createdAt: -1 });

      // Format data for Excel export
      const formattedRequests = materialRequests.map((request: any) => ({
        requestId: request._id.toString(),
        materialName: request.materialName || 'N/A',
        materialEmail: request.materialEmail || 'N/A',
        materialPhone: request.materialPhone || 'N/A',
        materialQuantity: request.materialQuantity || 'N/A',
        materialIntendedUse: request.materialIntendedUse || 'N/A',
        materialActions: request.materialActions || 'Pending',
        requestDate: request.createdAt,
        lastUpdated: request.updatedAt,
      }));

      return formattedRequests;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Import material requests from Excel data
  public async ImportMaterialRequests(requestsData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
    };

    for (const requestData of requestsData) {
      try {
        // Prepare material request data
        const newRequestData = {
          materialName: requestData.materialName,
          materialEmail: requestData.materialEmail,
          materialPhone: requestData.materialPhone,
          materialQuantity: requestData.materialQuantity,
          materialIntendedUse: requestData.materialIntendedUse,
          materialActions: requestData.materialActions || 'Pending',
        };

        // Check if request already exists (optional - you can define your own logic)
        const existingRequest = await MaterialRequestModel.findOne({
          materialEmail: requestData.materialEmail,
          materialName: requestData.materialName,
          materialQuantity: requestData.materialQuantity
        });

        if (existingRequest && requestData.requestId) {
          // Update existing request
          const updatedRequest = await MaterialRequestModel.findByIdAndUpdate(
            existingRequest._id,
            newRequestData,
            { new: true }
          );

          results.updated.push(updatedRequest);
        } else {
          // Create new request
          const newRequest = await MaterialRequestModel.create(newRequestData);
          results.success.push(newRequest);
        }

      } catch (error: any) {
        results.failed.push({
          data: requestData,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    return results;
  }
}