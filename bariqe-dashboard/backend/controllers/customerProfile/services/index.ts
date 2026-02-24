import CustomerModel from "../../../models/customerSchema";
import ApiError from "../../../utils/errors/ApiError";
import MongooseFeatures from "../../../services/mongodb/features";

export default class CustomerProfileService extends MongooseFeatures {
  
  public async getProfile(customerId: string) {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");
    return customer;
  }

  public async updateProfile(customerId: string, body: any) {
    // Prevent updating critical fields like password/email directly if needed
    // For now allow basic updates, assuming validation happens at controller or schema level
    const updateData = {
      customerName: body.name,
      customerPhone: body.phone, // Care: unique constraint
      avatar: body.avatar
    };
    
    // Check if phone/email is being updated and conflicts
    // Reuse logic from CustomerService.EditOneCustomer if needed or rely on database unique index error
    
    const customer = await CustomerModel.findByIdAndUpdate(customerId, updateData, { new: true, runValidators: true });
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");
    return customer;
  }

  // === Addresses ===
  
  public async addAddress(customerId: string, addressData: any) {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");

    if (addressData.isDefault) {
      // Unset other defaults
      customer.addresses.forEach((a: any) => a.isDefault = false);
    }

    customer.addresses.push(addressData);
    await customer.save();
    return customer.addresses;
  }

  public async updateAddress(customerId: string, addressId: string, addressData: any) {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");

    const address = customer.addresses.id(addressId);
    if (!address) throw new ApiError("NOT_FOUND", "Address not found");

    if (addressData.isDefault && !address.isDefault) {
       customer.addresses.forEach((a: any) => a.isDefault = false);
    }

    Object.assign(address, addressData);
    await customer.save();
    return customer.addresses;
  }

  public async deleteAddress(customerId: string, addressId: string) {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");

    const addressIndex = customer.addresses.findIndex((a: any) => a._id.toString() === addressId);
    if (addressIndex === -1) throw new ApiError("NOT_FOUND", "Address not found");
    
    customer.addresses.splice(addressIndex, 1);
    await customer.save();
    return customer.addresses;
  }

  public async getAddresses(customerId: string) {
    const customer = await CustomerModel.findById(customerId).select('addresses');
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");
    return customer.addresses;
  }

  // === Favorites ===

  public async getFavorites(customerId: string) {
    const customer = await CustomerModel.findById(customerId).populate('favorites');
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");
    return customer.favorites;
  }

  public async addFavorite(customerId: string, productId: string) {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");

    if (!customer.favorites.includes(productId as any)) {
      customer.favorites.push(productId as any);
      await customer.save();
    }
    return customer.favorites; // Or populate if needed
  }

  public async removeFavorite(customerId: string, productId: string) {
    const customer = await CustomerModel.findById(customerId);
    if (!customer) throw new ApiError("NOT_FOUND", "Customer not found");

    customer.favorites = customer.favorites.filter((id) => id.toString() !== productId);
    await customer.save();
    return customer.favorites;
  }

  // === Orders ===
  public async getMyOrders(customerId: string) {
    const OrderModel = require("../../../models/orderSchema").default; // Late require to avoid circular dependency if any
    const orders = await OrderModel.find({ customer: customerId })
      .populate("products.product", "productNameAr productNameEn productImage productCode")
      .sort({ createdAt: -1 });
    return orders;
  }
}
