// src/services/mongodb/materialRequest.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import MaterialRequestModel from "../../../models/materialRequestsSchema";
import CustomerModel from "../../../models/customerSchema";
import { pick } from "lodash";

export default class MaterialRequestService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "materialName",
      "materialEmail",
      "materialPhone",
      "materialQuantity",
      "materialIntendedUse",
      "materialLocation",
      "customer",
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

    try {
      let baseQuery = MaterialRequestModel.find({});

      baseQuery = baseQuery.populate({
        path: "customer",
        select: "customerName customerEmail customerPhone customerLocation customerAddress"
      });

      if (sorts && sorts.length > 0) {
        const sortObj: any = {};
        sorts.forEach((sort: any) => {
          sortObj[sort.field] = sort.direction === 'desc' ? -1 : 1;
        });
        baseQuery = baseQuery.sort(sortObj);
      } else {
        baseQuery = baseQuery.sort({ createdAt: -1 });
      }

      if (queries && queries.length > 0) {
        queries.forEach((queryItem: any) => {
          if (queryItem.field && queryItem.value) {
            if (queryItem.operator === 'like') {
              baseQuery = baseQuery.where(queryItem.field).regex(new RegExp(queryItem.value, 'i'));
            } else if (queryItem.operator === 'eq') {
              baseQuery = baseQuery.where(queryItem.field).equals(queryItem.value);
            }
          }
        });
      }

      const totalQuery = MaterialRequestModel.find(baseQuery.getQuery());
      const total = await totalQuery.countDocuments();

      const skip = (Number(page) - 1) * Number(perPage);
      baseQuery = baseQuery.skip(skip).limit(Number(perPage));

      const data = await baseQuery.exec();

      const result = {
        data,
        count: total,
        pagination: {
          currentPage: Number(page),
          perPage: Number(perPage),
          totalPages: Math.ceil(total / Number(perPage)),
          total,
          nextPage: Number(page) < Math.ceil(total / Number(perPage)) ? Number(page) + 1 : null,
          prevPage: Number(page) > 1 ? Number(page) - 1 : null,
        }
      };

      return { result, keys };
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Get one material request by ID
  public async GetOneMaterialRequest(id: string) {
    try {
      const reqDoc = await MaterialRequestModel.findById(id)
        .populate({
          path: "customer",
          select: "customerName customerEmail customerPhone customerLocation customerAddress"
        });
      
      if (!reqDoc) throw new ApiError("NOT_FOUND", "Material Request not found");
      return reqDoc;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Add new material request مع البحث عن عميل موجود أو إنشاء جديد
  public async AddMaterialRequest(body: any) {
    try {
      // Validation
      if (!body.materialName || !body.materialQuantity || !body.materialIntendedUse) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'materialName', 'materialQuantity', 'materialIntendedUse' are required"
        );
      }

      let customerId;
      let existingCustomer = null;
      let isNewCustomer = false;

      // 🔍 التحقق من وجود customerId في الـ body (من البحث في الـ frontend)
      if (body.customerId) {
        customerId = body.customerId;
        existingCustomer = await CustomerModel.findById(customerId);
        
        if (!existingCustomer) {
          throw new ApiError("NOT_FOUND", "Customer not found");
        }
      } else if (body.customerName && body.customerPhone) {
        // 🔍 البحث عن عميل موجود بنفس الهاتف أو الإيميل
        const searchQuery: any = {
          $or: [
            { customerPhone: body.customerPhone }
          ]
        };

        if (body.customerEmail) {
          searchQuery.$or.push({ customerEmail: body.customerEmail });
        }

        existingCustomer = await CustomerModel.findOne(searchQuery);

        if (existingCustomer) {
          // ✅ استخدام الكاستمر الموجود
          customerId = existingCustomer._id;
          console.log(`Using existing customer: ${customerId}`);
        } else {
          // 🆕 إنشاء كاستمر جديد
          const customerData: any = {
            customerName: body.customerName,
            customerPhone: body.customerPhone,
            customerAddress: body.customerAddress || "",
            customerSource: "material_request",
            customerNotes: `Created from material request: ${body.materialName}`,
          };

          if (body.customerEmail) {
            customerData.customerEmail = body.customerEmail;
          }

          const newCustomer = await CustomerModel.create(customerData);

          if (!newCustomer) {
            throw new ApiError("INTERNAL_SERVER_ERROR", "Failed to create customer");
          }

          customerId = newCustomer._id;
          existingCustomer = newCustomer;
          isNewCustomer = true;
          console.log(`Created new customer: ${customerId}`);
        }
      } else {
        throw new ApiError(
          "BAD_REQUEST",
          "Either 'customerId' or 'customerName' and 'customerPhone' are required"
        );
      }

      // 📝 تحضير بيانات Material Request
      const materialRequestData: any = {
        materialName: body.materialName,
        materialQuantity: body.materialQuantity,
        materialIntendedUse: body.materialIntendedUse,
        materialActions: body.materialActions || "pending",
        customer: customerId,
      };

      // إضافة الحقول الاختيارية
      if (body.materialLocation) {
        materialRequestData.materialLocation = body.materialLocation;
      }

      // ✅ إنشاء Material Request
      const materialRequest = await MaterialRequestModel.create(materialRequestData);
      
      // Populate customer في الاستجابة
      const populatedRequest = await MaterialRequestModel.findById(materialRequest._id)
        .populate({
          path: "customer",
          select: "customerName customerEmail customerPhone customerLocation customerAddress"
        });

      // 📤 إرجاع البيانات
      return {
        materialRequest: populatedRequest,
        customer: existingCustomer,
        isNewCustomer,
        message: isNewCustomer 
          ? "Material request created and new customer added successfully"
          : "Material request created with existing customer successfully"
      };

    } catch (error) {
      console.error("Error in AddMaterialRequest:", error);
      throw error;
    }
  }

  // 🟢 Edit material request
  public async EditOneMaterialRequest(id: string, body: any) {
    try {
      const updateData = pick(body, this.keys);
      
      const updatedReq = await MaterialRequestModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate({
        path: "customer",
        select: "customerName customerEmail customerPhone customerLocation customerAddress"
      });

      if (!updatedReq) {
        throw new ApiError("NOT_FOUND", `Material Request with id ${id} not found`);
      }

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
      const result = await MaterialRequestModel.findByIdAndDelete(id);
      if (!result) {
        throw new ApiError("NOT_FOUND", `Material Request with id ${id} not found`);
      }
      return { message: "Material Request deleted successfully" };
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
      const materialRequests = await MaterialRequestModel.find({})
        .populate({
          path: "customer",
          select: "customerName customerEmail customerPhone customerLocation customerAddress"
        })
        .sort({ createdAt: -1 });

      const formattedRequests = materialRequests.map((request: any) => ({
        requestId: request._id.toString(),
        materialName: request.materialName || 'N/A',
        customerName: request.customer?.customerName || 'Direct Request',
        materialEmail: request.customer?.customerEmail || request.materialEmail || 'N/A',
        materialPhone: request.customer?.customerPhone || request.materialPhone || 'N/A',
        customerLocation: request.customer?.customerLocation || request.materialLocation || 'N/A',
        customerAddress: request.customer?.customerAddress || 'N/A',
        materialQuantity: request.materialQuantity || 'N/A',
        materialIntendedUse: request.materialIntendedUse || 'N/A',
        materialActions: request.materialActions || 'pending',
        requestDate: request.createdAt,
        lastUpdated: request.updatedAt,
        hasCustomer: request.customer ? 'Yes' : 'No',
        customerId: request.customer?._id?.toString() || 'N/A',
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
        let customerId = null;

        // البحث عن customer موجود
        if (requestData.materialPhone) {
          const searchQuery: any = {
            $or: [
              { customerPhone: requestData.materialPhone }
            ]
          };

          if (requestData.materialEmail) {
            searchQuery.$or.push({ customerEmail: requestData.materialEmail });
          }

          const existingCustomer = await CustomerModel.findOne(searchQuery);

          if (existingCustomer) {
            customerId = existingCustomer._id;
          }
        }

        // Prepare material request data
        const newRequestData: any = {
          materialName: requestData.materialName,
          materialQuantity: requestData.materialQuantity,
          materialIntendedUse: requestData.materialIntendedUse,
          materialActions: requestData.materialActions?.toLowerCase() || 'pending',
        };

        if (customerId) {
          newRequestData.customer = customerId;
        } else {
          newRequestData.materialEmail = requestData.materialEmail;
          newRequestData.materialPhone = requestData.materialPhone;
          newRequestData.materialLocation = requestData.customerLocation;
        }

        // Check if request already exists
        const existingRequest = await MaterialRequestModel.findOne({
          materialName: requestData.materialName,
          materialQuantity: requestData.materialQuantity,
          $or: customerId ? [{ customer: customerId }] : [{ materialEmail: requestData.materialEmail }]
        });

        if (existingRequest) {
          const updatedRequest = await MaterialRequestModel.findByIdAndUpdate(
            existingRequest._id,
            newRequestData,
            { new: true }
          ).populate({
            path: "customer",
            select: "customerName customerEmail customerPhone customerLocation"
          });

          results.updated.push(updatedRequest);
        } else {
          const newRequest = await MaterialRequestModel.create(newRequestData);
          const populatedRequest = await MaterialRequestModel.findById(newRequest._id)
            .populate({
              path: "customer",
              select: "customerName customerEmail customerPhone customerLocation"
            });

          results.success.push(populatedRequest);
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

  // Get requests by customer
  public async GetRequestsByCustomer(customerId: string, query: any = {}) {
    try {
      const { perPage = 10, page = 1 } = query;

      const requests = await MaterialRequestModel.find({ customer: customerId })
        .populate({
          path: "customer",
          select: "customerName customerEmail customerPhone customerLocation"
        })
        .sort({ createdAt: -1 })
        .limit(Number(perPage))
        .skip((Number(page) - 1) * Number(perPage));

      const total = await MaterialRequestModel.countDocuments({ customer: customerId });

      return {
        data: requests,
        pagination: {
          currentPage: Number(page),
          perPage: Number(perPage),
          totalPages: Math.ceil(total / Number(perPage)),
          total,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  // Get statistics
  public async GetMaterialRequestStats() {
    try {
      const stats = await MaterialRequestModel.aggregate([
        {
          $group: {
            _id: "$materialActions",
            count: { $sum: 1 }
          }
        }
      ]);

      const totalRequests = await MaterialRequestModel.countDocuments();
      const requestsWithCustomers = await MaterialRequestModel.countDocuments({ 
        customer: { $exists: true, $ne: null } 
      });
      const directRequests = totalRequests - requestsWithCustomers;

      return {
        statusStats: stats,
        totalRequests,
        requestsWithCustomers,
        directRequests,
      };
    } catch (error) {
      throw error;
    }
  }
}