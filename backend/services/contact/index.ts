// ContactService.ts
import { pick } from 'lodash';
import MongooseFeatures from '../mongodb/features/index';
import CustomerModel from '../../models/customerSchema';
import ContactModel from '../../models/contactSchema';
import ApiError from '../../utils/errors/ApiError';
export default class ContactService extends MongooseFeatures {
  public keys: string[];

  constructor() {
    super();
    // Allowed fields in body
    this.keys = [
      "contactName",
      "email",
      "customer",
      "phoneNumber",
      "address",
      "services",
      "message",
      "status"
    ];
  }

  // ✅ Helper function للتحقق من Customer
  private async validateCustomer(customerId: string) {
    if (!customerId) return; // Customer is optional

    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      throw new ApiError("BAD_REQUEST", "Invalid customer ID");
    }

    return customer;
  }

  // 🟢 Get all contacts with pagination & sorting
  public async GetContacts(query: any) {
    const keys = this.keys.sort();
    const {
      perPage,
      page,
      sorts = [],
      queries = [],
    } = pick(query, ["perPage", "page", "sorts", "queries"]);

    // Get paginated results first
    const result = await super.PaginateHandler(
      ContactModel,
      Number(perPage),
      Number(page),
      sorts,
      queries
    );

    // ✅ Populate customer
    if (result.data && result.data.length > 0) {
      await ContactModel.populate(result.data, {
        path: 'customer',
        select: 'customerName customerEmail customerPhone customerCompany'
      });
    }

    return { result, keys };
  }

  // 🟢 Get one contact by ID
  public async GetOneContact(id: string) {
    try {
      const contact = await ContactModel.findById(id).populate({
        path: 'customer',
        select: 'customerName customerEmail customerPhone customerCompany'
      });

      if (!contact) throw new ApiError("NOT_FOUND", "Contact not found");

      return contact;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Add new contact
  public async AddContact(body: any) {
    try {
      // 🟢 Check if any of the required fields are missing, including both forms of data
      if ((!body.contactName && !body.customerName) || (!body.phoneNumber && !body.customerPhone) || (!body.email && !body.customerEmail) || (!body.message && !body.customerMessage)) {
        throw new ApiError(
          "BAD_REQUEST",
          "Fields 'contactName', 'phoneNumber', 'email', 'message' are required"
        );
      }
      // 🟢 Map both forms of data to standardized schema data
      if (body.customerName) body.contactName = body.customerName;
      if (body.customerEmail) body.email = body.customerEmail;
      if (body.customerPhone) body.phoneNumber = body.customerPhone;
      if (body.customerMessage) body.message = body.customerMessage;

      // ✅ التحقق من Customer إذا تم تقديمه
      if (body.customer) {
        await this.validateCustomer(body.customer);
      }

      // ✅ Validate services array
      if (body.services && !Array.isArray(body.services)) {
        throw new ApiError("BAD_REQUEST", "Services must be an array");
      }

      const newContact = pick(body, this.keys);
      const contact = await super.addDocument(ContactModel, newContact);

      // ✅ Populate customer before return
      await contact.populate({
        path: 'customer',
        select: 'customerName customerEmail customerPhone customerCompany'
      });

      return contact;
    } catch (error) {
      throw error;
    }
  }

  // 🟢 Edit contact
  public async EditOneContact(id: string, body: any) {
    try {
      // ✅ التحقق من Customer إذا تم تقديمه
      if (body.customer) {
        await this.validateCustomer(body.customer);
      }

      const updateData = pick(body, this.keys);
      const updatedContact = await ContactModel.findByIdAndUpdate(
        id,
        updateData,
        { new: true }
      ).populate({
        path: 'customer',
        select: 'customerName customerEmail customerPhone customerCompany'
      });

      if (!updatedContact) {
        throw new ApiError("NOT_FOUND", `Contact with id ${id} not found`);
      }

      return updatedContact;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Contact with id ${id} not found`);
    }
  }

  // 🟢 Delete contact
  public async DeleteOneContact(id: string) {
    try {
      const result = await super.deleteDocument(ContactModel, id);
      return result;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Contact with id ${id} not found`);
    }
  }

  // 🟢 Update contact status
  public async UpdateContactStatus(id: string, status: boolean) {
    try {
      const updatedContact = await ContactModel.findByIdAndUpdate(
        id,
        { status },
        { new: true }
      ).populate({
        path: 'customer',
        select: 'customerName customerEmail customerPhone customerCompany'
      });

      if (!updatedContact) {
        throw new ApiError("NOT_FOUND", `Contact with id ${id} not found`);
      }

      return updatedContact;
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError("NOT_FOUND", `Contact with id ${id} not found`);
    }
  }

  // ✅ Export Contacts
  public async ExportContacts(query?: any) {
    try {
      console.log('Export query received:', query);

      const keys = this.keys.sort();
      const {
        perPage = 999999,
        page = 1,
        sorts = [],
        queries = [],
      } = pick(query, ["perPage", "page", "sorts", "queries"]);

      console.log('Export filters:', { sorts, queries });

      const result = await super.PaginateHandler(
        ContactModel,
        Number(perPage),
        Number(page),
        sorts,
        queries
      );

      console.log(`Found ${result.data.length} contacts for export out of ${result.count} total`);

      // ✅ Populate customer
      if (result.data && result.data.length > 0) {
        await ContactModel.populate(result.data, {
          path: 'customer',
          select: 'customerName customerEmail customerPhone customerCompany'
        });
      }

      // ✅ تحويل البيانات لصيغة الإكسبورت
      const exportData = result.data.map((contact: any) => {
        let customerName = '';
        let customerEmail = '';
        let customerPhone = '';
        let customerCompany = '';
        let customerId = '';

        if (contact.customer && typeof contact.customer === 'object') {
          customerName = contact.customer.customerName || '';
          customerEmail = contact.customer.customerEmail || '';
          customerPhone = contact.customer.customerPhone || '';
          customerCompany = contact.customer.customerCompany || '';
          customerId = contact.customer._id || '';
        }

        // تحويل services array لـ string format
        let servicesText = '';
        if (contact.services && contact.services.length > 0) {
          servicesText = contact.services.join('; ');
        }

        return {
          contactName: contact.contactName || "",
          email: contact.email || "",
          phoneNumber: contact.phoneNumber || "",
          address: contact.address || "",
          customerId: customerId,
          customerName: customerName,
          customerEmail: customerEmail,
          customerPhone: customerPhone,
          customerCompany: customerCompany,
          services: servicesText,
          servicesRaw: contact.services || [],
          message: contact.message || "",
          status: contact.status || false,
          createdAt: contact.createdAt || null,
          updatedAt: contact.updatedAt || null
        };
      });

      return exportData;
    } catch (error) {
      console.error('Export contacts error:', error);
      throw error;
    }
  }

  // ✅ Export Contact Statistics
  public async ExportContactStatistics(query?: any) {
    try {
      console.log('Export statistics query received:', query);

      const {
        perPage = 999999,
        page = 1,
        sorts = [],
        queries = [],
      } = pick(query, ["perPage", "page", "sorts", "queries"]);

      const result = await super.PaginateHandler(
        ContactModel,
        Number(perPage),
        Number(page),
        sorts,
        queries
      );

      // Statistics by status
      const byStatus = {
        active: result.data.filter((c: any) => c.status === true).length,
        inactive: result.data.filter((c: any) => c.status === false).length
      };

      // Statistics by services
      const serviceStats: Record<string, number> = {};
      result.data.forEach((contact: any) => {
        if (contact.services && contact.services.length > 0) {
          contact.services.forEach((service: string) => {
            serviceStats[service] = (serviceStats[service] || 0) + 1;
          });
        }
      });

      // Contacts with/without customers
      const customerStats = {
        withCustomer: result.data.filter((c: any) => c.customer).length,
        withoutCustomer: result.data.filter((c: any) => !c.customer).length
      };

      return {
        total: result.data.length,
        byStatus,
        byServices: serviceStats,
        byCustomer: customerStats
      };
    } catch (error) {
      console.error('Export statistics error:', error);
      throw error;
    }
  }

  // ✅ Import contacts
  public async ImportContacts(contactsData: any[]) {
    try {
      const results = {
        success: [] as string[],
        failed: [] as any[],
        updated: [] as string[]
      };

      for (const contactData of contactsData) {
        try {
          // Check if contact exists by email
          const existingContact = await ContactModel.findOne({
            email: contactData.email
          });

          // ✅ Get customer if provided
          let customerId = null;

          if (contactData.customerEmail) {
            const customer = await CustomerModel.findOne({
              customerEmail: contactData.customerEmail
            });

            if (customer) {
              customerId = customer._id;
            } else if (contactData.customerName) {
              const customerByName = await CustomerModel.findOne({
                customerName: contactData.customerName
              });
              if (customerByName) {
                customerId = customerByName._id;
              }
            }
          }

          // ✅ Parse services from string to array
          let services = [];
          if (contactData.services && typeof contactData.services === 'string') {
            services = contactData.services.split(';').map((s: string) => s.trim());
          } else if (Array.isArray(contactData.services)) {
            services = contactData.services;
          }

          // ✅ Prepare contact data
          const contactToSave = {
            ...contactData,
            customer: customerId,
            services: services,
            status: contactData.status === 'Active' || contactData.status === true
          };

          // Remove customer name/email fields
          delete contactToSave.customerName;
          delete contactToSave.customerEmail;
          delete contactToSave.customerPhone;
          delete contactToSave.customerCompany;

          if (existingContact) {
            // Update existing contact
            await ContactModel.findByIdAndUpdate(
              existingContact._id,
              contactToSave,
              { new: true }
            );
            results.updated.push(contactData.email);
          } else {
            // Create new contact
            await ContactModel.create(contactToSave);
            results.success.push(contactData.email);
          }
        } catch (error: any) {
          results.failed.push({
            email: contactData.email,
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