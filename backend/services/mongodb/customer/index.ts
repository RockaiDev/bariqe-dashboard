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

  // 🟢 Add new customer
  public async AddCustomer(body: any) {
    try {
      if (!body.customerName || !body.customerEmail || !body.customerPhone) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'customerName', 'customerEmail', 'customerPhone' are required"
        );
      }
      const existingCustomer = await CustomerModel.findOne({
        $or: [
          { customerEmail: body.customerEmail },
          { customerPhone: body.customerPhone },
        ],
      });
      if (existingCustomer) {
        throw new ApiError(
          "BAD_REQUEST",
          "A customer with the same email or phone number already exists"
        );
      }
      const newCustomer = pick(body, this.keys);
      const customer = await super.addDocument(CustomerModel, newCustomer);
      return customer;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit customer
  public async EditOneCustomer(id: string, body: any) {
    try {
      const updateData = pick(body, this.keys);
      
      // Check for duplicate email/phone before updating
      if (body.customerEmail || body.customerPhone) {
        const existingCustomer = await CustomerModel.findOne({
          _id: { $ne: id },
          $or: [
            ...(body.customerEmail ? [{ customerEmail: body.customerEmail }] : []),
            ...(body.customerPhone ? [{ customerPhone: body.customerPhone }] : []),
          ],
        });
        if (existingCustomer) {
          throw new ApiError(
            "BAD_REQUEST",
            "A customer with the same email or phone number already exists"
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

  // 🟢 Export customers to Excel format
  public async ExportCustomers(filters?: any) {
    try {
      const query = filters?.queries || [];
      const customers = await CustomerModel.find(
        query.length > 0 ? { $and: query } : {}
      );

      const exportData = customers.map((customer: any) => ({
        customerName: customer.customerName,
        customerEmail: customer.customerEmail,
        customerPhone: customer.customerPhone,
        customerAddress: customer.customerAddress || '',
        customerSource: customer.customerSource || '',
        customerNotes: customer.customerNotes || '',
        createdAt: customer.createdAt,
        updatedAt: customer.updatedAt
      }));

      return exportData;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Import customers from Excel
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
          // Validate required fields
          if (!customerData.customerName || !customerData.customerEmail || !customerData.customerPhone) {
            results.failed.push({
              customerEmail: customerData.customerEmail || 'N/A',
              error: "Missing required fields: customerName, customerEmail, or customerPhone"
            });
            continue;
          }

          // Check if customer exists by email or phone
          const existingCustomerByEmail = await CustomerModel.findOne({
            customerEmail: customerData.customerEmail
          });

          const existingCustomerByPhone = await CustomerModel.findOne({
            customerPhone: customerData.customerPhone
          });

          // Handle duplicate cases
          if (existingCustomerByEmail && existingCustomerByPhone) {
            if (existingCustomerByEmail._id.toString() !== existingCustomerByPhone._id.toString()) {
              // Email and phone exist but belong to different customers
              results.failed.push({
                customerEmail: customerData.customerEmail,
                customerPhone: customerData.customerPhone,
                error: "Email and phone number are associated with different existing customers"
              });
              continue;
            }
          } else if (existingCustomerByEmail || existingCustomerByPhone) {
            // Update existing customer
            const existingCustomer = existingCustomerByEmail || existingCustomerByPhone;
            
            // Check if the non-matching field is already taken by another customer
            if (existingCustomerByEmail && customerData.customerPhone !== existingCustomerByEmail.customerPhone) {
              const phoneExists = await CustomerModel.findOne({ customerPhone: customerData.customerPhone });
              if (phoneExists) {
                results.failed.push({
                  customerEmail: customerData.customerEmail,
                  customerPhone: customerData.customerPhone,
                  error: "Phone number is already associated with a different customer"
                });
                continue;
              }
            }

            if (existingCustomerByPhone && customerData.customerEmail !== existingCustomerByPhone.customerEmail) {
              const emailExists = await CustomerModel.findOne({ customerEmail: customerData.customerEmail });
              if (emailExists) {
                results.failed.push({
                  customerEmail: customerData.customerEmail,
                  customerPhone: customerData.customerPhone,
                  error: "Email is already associated with a different customer"
                });
                continue;
              }
            }

            // Prepare customer data
            const customerToSave = pick(customerData, this.keys);
            
            try {
              await CustomerModel.findByIdAndUpdate(
                existingCustomer._id,
                customerToSave,
                { new: true, runValidators: true }
              );
              results.updated.push(customerData.customerEmail);
            } catch (updateError: any) {
              results.failed.push({
                customerEmail: customerData.customerEmail,
                error: `Update failed: ${updateError.message}`
              });
            }
          } else {
            // Create new customer
            try {
              await CustomerModel.create(pick(customerData, this.keys));
              results.success.push(customerData.customerEmail);
            } catch (createError: any) {
              results.failed.push({
                customerEmail: customerData.customerEmail,
                error: `Creation failed: ${createError.message}`
              });
            }
          }
        } catch (error: any) {
          results.failed.push({
            customerEmail: customerData.customerEmail || 'N/A',
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Bulk update customers
  public async BulkUpdateCustomers(customersData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[]
      };

      for (const customerData of customersData) {
        try {
          const { customerEmail, ...updateData } = customerData;
          
          if (!customerEmail) {
            results.failed.push({
              customerEmail: 'N/A',
              error: "Email is required for bulk update"
            });
            continue;
          }

          // Check if updating email/phone would create duplicate
          if (updateData.customerEmail || updateData.customerPhone) {
            const existingCustomer = await CustomerModel.findOne({
              customerEmail: { $ne: customerEmail },
              $or: [
                ...(updateData.customerEmail ? [{ customerEmail: updateData.customerEmail }] : []),
                ...(updateData.customerPhone ? [{ customerPhone: updateData.customerPhone }] : []),
              ],
            });
            if (existingCustomer) {
              results.failed.push({
                customerEmail,
                error: "A customer with the same email or phone number already exists"
              });
              continue;
            }
          }

          const updatedCustomer = await CustomerModel.findOneAndUpdate(
            { customerEmail },
            { $set: pick(updateData, this.keys) },
            { new: true }
          );

          if (updatedCustomer) {
            results.success.push(customerEmail);
          } else {
            results.failed.push({
              customerEmail,
              error: "Customer not found"
            });
          }
        } catch (error: any) {
          results.failed.push({
            customerEmail: customerData.customerEmail || 'N/A',
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