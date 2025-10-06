// src/services/mongodb/customer.ts
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../features/index";
import CustomerModel from "../../../models/customerSchema";
import { pick } from "lodash";

export default class CustomerService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    this.keys = [
      "customerName",
      "customerEmail",
      "customerPhone",
      "customerNotes",
      "customerSource",
      "customerAddress",
      "customerLocation", // ✅ إضافة customerLocation
    ];
  }

  // 🟢 Get all customers with pagination & sorting
  public async GetCustomers(query: any) {
    const keys = this.keys.sort();
    const {
      perPage,
      page,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    const result = await super.PaginateHandler(
      CustomerModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    return { result, keys };
  }

  // 🟢 Get one customer by ID
  public async GetOneCustomer(id: string) {
    try {
      const customer = await super.getDocument(CustomerModel, id);
      if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");
      return customer;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Add new customer
  public async AddCustomer(body: any) {
    try {
      // التحقق من الحقول المطلوبة الجديدة
      if (!body.customerName || !body.customerPhone || !body.customerSource || !body.customerAddress) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'customerName', 'customerPhone', 'customerSource' and 'customerAddress' are required"
        );
      }

 
      const duplicateConditions : any= [
        { customerName: body.customerName },
        { customerPhone: body.customerPhone }
      ];

      if (body.customerEmail) {
        duplicateConditions.push({ customerEmail: body.customerEmail });
      }

      const existingCustomer = await CustomerModel.findOne({
        $or: duplicateConditions,
      });

      if (existingCustomer) {
        let duplicateField = "";
        if (existingCustomer.customerName === body.customerName) {
          duplicateField = "name";
        } else if (existingCustomer.customerPhone === body.customerPhone) {
          duplicateField = "phone number";
        } else if (existingCustomer.customerEmail === body.customerEmail) {
          duplicateField = "email";
        }
        
        throw new ApiError(
          "BAD_REQUEST",
          `A customer with the same ${duplicateField} already exists`
        );
      }
      
      const newCustomer = pick(body, this.keys);
      const customer = await super.addDocument(CustomerModel, newCustomer);
      return customer;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Edit customer
  public async EditOneCustomer(id: string, body: any) {
    try {
      const updateData = pick(body, this.keys);
      
      // التحقق من عدم تكرار الاسم أو الرقم أو الإيميل
      if (body.customerName || body.customerPhone || body.customerEmail) {
        const duplicateConditions = [];
        
        if (body.customerName) {
          duplicateConditions.push({ customerName: body.customerName });
        }
        if (body.customerPhone) {
          duplicateConditions.push({ customerPhone: body.customerPhone });
        }
        if (body.customerEmail) {
          duplicateConditions.push({ customerEmail: body.customerEmail });
        }
        
        const existingCustomer = await CustomerModel.findOne({
          _id: { $ne: id },
          $or: duplicateConditions,
        });
        
        if (existingCustomer) {
          let duplicateField = "";
          if (existingCustomer.customerName === body.customerName) {
            duplicateField = "name";
          } else if (existingCustomer.customerPhone === body.customerPhone) {
            duplicateField = "phone number";
          } else if (existingCustomer.customerEmail === body.customerEmail) {
            duplicateField = "email";
          }
          
          throw new ApiError(
            "BAD_REQUEST",
            `A customer with the same ${duplicateField} already exists`
          );
        }
      }
      
      const updatedCustomer = await super.editDocument(
        CustomerModel,
        id,
        updateData
      );
      return updatedCustomer;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Customer with id ${id} not found`);
    }
  }

  // 🟢 Delete customer
  public async DeleteOneCustomer(id: string) {
    try {
      const result = await super.deleteDocument(CustomerModel, id);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Customer with id ${id} not found`);
    }
  }

  // ✅ Export customers to Excel format
  public async ExportCustomers(filters?: any) {
    try {
      const query = filters?.queries || [];
      const customers = await CustomerModel.find(
        query.length > 0 ? { $and: query } : {}
      );

      const exportData = customers.map((customer: any) => ({
        customerName: customer.customerName,
        customerEmail: customer.customerEmail || '',
        customerPhone: customer.customerPhone,
        customerAddress: customer.customerAddress || '',
        customerSource: customer.customerSource || '',
        customerLocation: customer.customerLocation || '', // ✅ إضافة customerLocation
        customerNotes: customer.customerNotes || '',
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }));

      return exportData;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Import customers from Excel
  public async ImportCustomers(customersData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[],
        duplicates: [] as any[]
      };

      for (const customerData of customersData) {
        try {
          // التحقق من الحقول المطلوبة الجديدة
          if (!customerData.customerName || !customerData.customerPhone || 
              !customerData.customerSource || !customerData.customerAddress) {
            results.failed.push({
              customerPhone: customerData.customerPhone || 'N/A',
              customerName: customerData.customerName || 'N/A',
              error: "Missing required fields: customerName, customerPhone, customerSource, or customerAddress"
            });
            continue;
          }

    
          const duplicateConditions :any = [
            { customerName: customerData.customerName },
            { customerPhone: customerData.customerPhone }
          ];

          if (customerData.customerEmail) {
            duplicateConditions.push({ customerEmail: customerData.customerEmail });
          }

          const existingCustomer = await CustomerModel.findOne({
            $or: duplicateConditions,
          });

          if (existingCustomer) {
            // تحديث العميل الموجود
            const customerToSave = pick(customerData, this.keys);
            
            try {
              await CustomerModel.findByIdAndUpdate(
                existingCustomer._id,
                customerToSave,
                { new: true, runValidators: true }
              );
              results.updated.push(customerData.customerPhone);
            } catch (updateError: any) {
              results.failed.push({
                customerPhone: customerData.customerPhone,
                error: `Update failed: ${updateError.message}`
              });
            }
          } else {
            // إنشاء عميل جديد
            try {
              await CustomerModel.create(pick(customerData, this.keys));
              results.success.push(customerData.customerPhone);
            } catch (createError: any) {
              results.failed.push({
                customerPhone: customerData.customerPhone,
                error: `Creation failed: ${createError.message}`
              });
            }
          }
        } catch (error: any) {
          results.failed.push({
            customerPhone: customerData.customerPhone || 'N/A',
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Bulk update customers
  public async BulkUpdateCustomers(customersData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[]
      };

      for (const customerData of customersData) {
        try {
          const { customerPhone, ...updateData } = customerData;
          
          if (!customerPhone) {
            results.failed.push({
              customerPhone: 'N/A',
              error: "Phone number is required for bulk update"
            });
            continue;
          }

          // التحقق من عدم تكرار البيانات عند التحديث
          if (updateData.customerName || updateData.customerPhone || updateData.customerEmail) {
            const duplicateConditions = [];
            
            if (updateData.customerName) {
              duplicateConditions.push({ customerName: updateData.customerName });
            }
            if (updateData.customerPhone) {
              duplicateConditions.push({ customerPhone: updateData.customerPhone });
            }
            if (updateData.customerEmail) {
              duplicateConditions.push({ customerEmail: updateData.customerEmail });
            }
            
            const existingCustomer = await CustomerModel.findOne({
              customerPhone: { $ne: customerPhone },
              $or: duplicateConditions,
            });
            
            if (existingCustomer) {
              let duplicateField = "";
              if (existingCustomer.customerName === updateData.customerName) {
                duplicateField = "name";
              } else if (existingCustomer.customerPhone === updateData.customerPhone) {
                duplicateField = "phone number";
              } else if (existingCustomer.customerEmail === updateData.customerEmail) {
                duplicateField = "email";
              }
              
              results.failed.push({
                customerPhone,
                error: `A customer with the same ${duplicateField} already exists`
              });
              continue;
            }
          }

          const updatedCustomer = await CustomerModel.findOneAndUpdate(
            { customerPhone },
            { $set: pick(updateData, this.keys) },
            { new: true }
          );

          if (updatedCustomer) {
            results.success.push(customerPhone);
          } else {
            results.failed.push({
              customerPhone,
              error: "Customer not found"
            });
          }
        } catch (error: any) {
          results.failed.push({
            customerPhone: customerData.customerPhone || 'N/A',
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }
}