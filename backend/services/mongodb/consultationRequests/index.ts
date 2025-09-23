// src/services/mongodb/consultationRequests.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import ConsultationRequestsModel from "../../../models/consultationRequestsSchema";
import CustomerModel from "../../../models/customerSchema";
import { pick } from "lodash";

export default class ConsultationRequestsService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "ConsultationRequestsName",
      "ConsultationRequestsEmail",
      "ConsultationRequestsPhone",
      "ConsultationRequestsMessage",
      "ConsultationRequestsStatus",
      "consultationRequestsArea",
      "customers",
    ];
  }

  // 🟢 Get all consultation requests with pagination & sorting
  public async GetConsultationRequests(query: any) {
    const keys = this.keys.sort();
    const {
      perPage,
      page,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    const result = await super.PaginateHandler(
      ConsultationRequestsModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    return { result, keys };
  }

  // 🟢 Get one consultation request by ID
  public async GetOneConsultationRequest(id: string) {
    try {
      const reqDoc = await super.getDocument(ConsultationRequestsModel, id);
      if (!reqDoc)
        throw new ApiError("NOT_FOUND", "Consultation Request not found");
      return reqDoc;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Add new consultation request مع إنشاء كاستمر تلقائياً
  public async AddConsultationRequest(body: any) {
    try {
      if (
        !body.ConsultationRequestsName ||
        !body.ConsultationRequestsEmail ||
        !body.ConsultationRequestsPhone ||
        !body.ConsultationRequestsMessage ||
        !body.consultationRequestsArea
      ) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'name', 'email', 'phone', 'message', 'area' are required"
        );
      }

      // 🟢 إنشاء كاستمر جديد بنفس البيانات
      const customerData = {
        customerName: body.ConsultationRequestsName,
        customerEmail: body.ConsultationRequestsEmail,
        customerPhone: body.ConsultationRequestsPhone,
        customerMessage: body.ConsultationRequestsMessage,
        customerAddress: body.customerAddress || "",
        customerSource: "consultation",
        customerNotes: `Created from consultation request: ${body.consultationRequestsArea}`,
      };

      // كريت الكاستمر
      const newCustomer = await super.addDocument(CustomerModel, customerData);

      if (!newCustomer) {
        throw new ApiError("INTERNAL_SERVER_ERROR", "Failed to create customer");
      }

      // تحضير بيانات الconsultation request
      const consultationRequestData = pick(body, this.keys);
      consultationRequestData.customers = newCustomer._id;

      // كريت الconsultation request
      const consultationRequest = await super.addDocument(
        ConsultationRequestsModel,
        consultationRequestData
      );

      // إرجاع البيانات مع الكاستمر
      return {
        consultationRequest,
        customer: newCustomer,
        message: "Consultation request and customer created successfully"
      };

    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit consultation request
  public async EditOneConsultationRequest(id: string, body: any) {
    try {
      const updateData = pick(body, this.keys);
      const updatedReq = await super.editDocument(
        ConsultationRequestsModel,
        id,
        updateData
      );
      return updatedReq;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "NOT_FOUND",
        `Consultation Request with id ${id} not found`
      );
    }
  }

  // 🟢 Delete consultation request
  public async DeleteOneConsultationRequest(id: string) {
    try {
      const result = await super.deleteDocument(ConsultationRequestsModel, id);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError(
        "NOT_FOUND",
        `Consultation Request with id ${id} not found`
      );
    }
  }

  // 🟢 Export consultation requests for Excel
  public async ExportConsultationRequests(query: any) {
    try {
      const { sorts = [], queries = [] } = pick(query, ["sorts", "queries"]);

      const consultationRequests = await ConsultationRequestsModel.find({})
        .populate('customers', 'customerName customerEmail customerPhone customerAddress')
        .sort({ createdAt: -1 });

      const formattedRequests = consultationRequests.map((request: any) => ({
        requestId: request._id.toString(),
        requestName: request.ConsultationRequestsName || '',
        email: request.ConsultationRequestsEmail || '',
        phone: request.ConsultationRequestsPhone || '',
        area: request.consultationRequestsArea || '',
        message: request.ConsultationRequestsMessage || '',
        status: request.ConsultationRequestsStatus || 'new',
        customerAddress: request.customers?.customerAddress || '',
        customerId: request.customers?._id?.toString() || '',
        requestDate: request.createdAt,
        lastUpdated: request.updatedAt,
      }));

      return formattedRequests;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Import consultation requests from Excel data
  public async ImportConsultationRequests(requestsData: any[]) {
    const results = {
      success: [] as any[],
      failed: [] as any[],
      updated: [] as any[],
      customers: [] as any[],
    };

    for (const requestData of requestsData) {
      try {
        // تحضير بيانات الكاستمر
        const customerData = {
          customerName: requestData.requestName,
          customerEmail: requestData.email,
          customerPhone: requestData.phone,
          customerMessage: requestData.message,
          customerAddress: requestData.customerAddress || "",
          customerSource: "consultation",
          customerNotes: `Imported from Excel: ${requestData.area}`,
        };

        // كريت كاستمر جديد
        const newCustomer = await CustomerModel.create(customerData);

        // تحضير بيانات الconsultation request
        const newRequestData = {
          ConsultationRequestsName: requestData.requestName,
          ConsultationRequestsEmail: requestData.email,
          ConsultationRequestsPhone: requestData.phone,
          ConsultationRequestsMessage: requestData.message,
          ConsultationRequestsStatus: requestData.status || 'new',
          consultationRequestsArea: requestData.area,
          customers: newCustomer._id,
        };

        // فحص لو الrequest موجود
        const existingRequest = await ConsultationRequestsModel.findOne({
          ConsultationRequestsEmail: requestData.email,
          ConsultationRequestsName: requestData.requestName,
          consultationRequestsArea: requestData.area
        });

        if (existingRequest && requestData.requestId) {
          const updatedRequest = await ConsultationRequestsModel.findByIdAndUpdate(
            existingRequest._id,
            { ...newRequestData, customers: existingRequest.customers || newCustomer._id },
            { new: true }
          );

          results.updated.push(updatedRequest);
          results.customers.push(newCustomer);
        } else {
          const newRequest = await ConsultationRequestsModel.create(newRequestData);
          results.success.push(newRequest);
          results.customers.push(newCustomer);
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
