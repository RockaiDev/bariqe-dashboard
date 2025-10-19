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

  // 🟢 Add new consultation request مع إنشاء أو ربط كاستمر
  public async AddConsultationRequest(body: any) {
    try {
      if (
        !body.ConsultationRequestsName ||
        !body.ConsultationRequestsPhone ||
        !body.ConsultationRequestsMessage
      ) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'name', 'phone', 'message' are required"
        );
      }

      let customerId;
      let existingCustomer = null;
      let isNewCustomer = false;

      // 🔍 التحقق من وجود customerId في الـ body (من البحث في الـ frontend)
      if (body.customerId) {
        // استخدام الكاستمر الموجود
        customerId = body.customerId;
        existingCustomer = await CustomerModel.findById(customerId);
        
        if (!existingCustomer) {
          throw new ApiError("NOT_FOUND", "Customer not found");
        }
      } else {
        // 🔍 البحث عن عميل موجود بنفس الهاتف أو الإيميل
        const searchQuery: any = {
          $or: [
            { customerPhone: body.ConsultationRequestsPhone }
          ]
        };

        // إضافة البحث بالإيميل فقط إذا كان موجود
        if (body.ConsultationRequestsEmail) {
          searchQuery.$or.push({ customerEmail: body.ConsultationRequestsEmail });
        }

        existingCustomer = await CustomerModel.findOne(searchQuery);

        if (existingCustomer) {
          // ✅ استخدام الكاستمر الموجود
          customerId = existingCustomer._id;
          console.log(`Using existing customer: ${customerId}`);
        } else {
          // 🆕 إنشاء كاستمر جديد
          const customerData :any= {
            customerName: body.ConsultationRequestsName,
            customerPhone: body.ConsultationRequestsPhone,
            customerAddress: body.customerAddress || "",
            customerSource: "consultation",
            customerNotes: `Created from consultation request${body.consultationRequestsArea ? `: ${body.consultationRequestsArea}` : ""}`,
          };

          // إضافة الإيميل فقط إذا كان موجود
          if (body.ConsultationRequestsEmail) {
            customerData.customerEmail = body.ConsultationRequestsEmail;
          }

          // إضافة الرسالة إذا كانت موجودة
          if (body.ConsultationRequestsMessage) {
            customerData.customerMessage = body.ConsultationRequestsMessage;
          }

          const newCustomer = await super.addDocument(CustomerModel, customerData);

          if (!newCustomer) {
            throw new ApiError("INTERNAL_SERVER_ERROR", "Failed to create customer");
          }

          customerId = newCustomer._id;
          existingCustomer = newCustomer;
          isNewCustomer = true;
          console.log(`Created new customer: ${customerId}`);
        }
      }

      // 📝 تحضير بيانات الconsultation request
      const consultationRequestData: any = {
        ConsultationRequestsName: body.ConsultationRequestsName,
        ConsultationRequestsPhone: body.ConsultationRequestsPhone,
        ConsultationRequestsMessage: body.ConsultationRequestsMessage,
        ConsultationRequestsStatus: body.ConsultationRequestsStatus || "new",
        customers: customerId,
      };

      // إضافة الحقول الاختيارية فقط إذا كانت موجودة
      if (body.ConsultationRequestsEmail) {
        consultationRequestData.ConsultationRequestsEmail = body.ConsultationRequestsEmail;
      }

      if (body.consultationRequestsArea) {
        consultationRequestData.consultationRequestsArea = body.consultationRequestsArea;
      }

      // ✅ إنشاء الconsultation request
      const consultationRequest = await super.addDocument(
        ConsultationRequestsModel,
        consultationRequestData
      );

      // 📤 إرجاع البيانات مع الكاستمر
      return {
        consultationRequest,
        customer: existingCustomer,
        isNewCustomer,
        message: isNewCustomer 
          ? "Consultation request created and new customer added successfully"
          : "Consultation request created with existing customer successfully"
      };

    } catch (error) {
      console.error("Error in AddConsultationRequest:", error);
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
        let customerId;
        let customer;

        // البحث عن عميل موجود
        const existingCustomer = await CustomerModel.findOne({
          $or: [
            { customerPhone: requestData.phone },
            ...(requestData.email ? [{ customerEmail: requestData.email }] : [])
          ]
        });

        if (existingCustomer) {
          customerId = existingCustomer._id;
          customer = existingCustomer;
        } else {
          // تحضير بيانات الكاستمر
          const customerData: any = {
            customerName: requestData.requestName,
            customerPhone: requestData.phone,
            customerAddress: requestData.customerAddress || "",
            customerSource: "consultation",
            customerNotes: `Imported from Excel${requestData.area ? `: ${requestData.area}` : ""}`,
          };

          if (requestData.email) {
            customerData.customerEmail = requestData.email;
          }

          if (requestData.message) {
            customerData.customerMessage = requestData.message;
          }

          // إنشاء كاستمر جديد
          customer = await CustomerModel.create(customerData);
          customerId = customer._id;
          results.customers.push(customer);
        }

        // تحضير بيانات الconsultation request
        const newRequestData: any = {
          ConsultationRequestsName: requestData.requestName,
          ConsultationRequestsPhone: requestData.phone,
          ConsultationRequestsMessage: requestData.message,
          ConsultationRequestsStatus: requestData.status || 'new',
          customers: customerId,
        };

        if (requestData.email) {
          newRequestData.ConsultationRequestsEmail = requestData.email;
        }

        if (requestData.area) {
          newRequestData.consultationRequestsArea = requestData.area;
        }

        // فحص لو الrequest موجود
        const existingRequest = await ConsultationRequestsModel.findOne({
          ConsultationRequestsPhone: requestData.phone,
          ConsultationRequestsName: requestData.requestName,
        });

        if (existingRequest && requestData.requestId) {
          const updatedRequest = await ConsultationRequestsModel.findByIdAndUpdate(
            existingRequest._id,
            newRequestData,
            { new: true }
          );

          results.updated.push(updatedRequest);
        } else {
          const newRequest = await ConsultationRequestsModel.create(newRequestData);
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