
import publicAxiosInstance from "@/lib/publicAxiosInstance";
import { UserProfile, Address, CreateAddressData, Order } from "@/shared/types/profile";
import { UpdateProfileSchema } from "@/lib/validations/profile";
import { Product } from "@/shared/types";

export const profileService = {
  // Profile
  getProfile: async (): Promise<UserProfile> => {
    const response: any = await publicAxiosInstance.get("/customer/profile");
    // Handle potential response structures: { result: { customer: ... } } or { result: ... }
    return response.result?.customer || response.result || response;
  },

  updateProfile: async (data: UpdateProfileSchema): Promise<UserProfile> => {
    const response: any = await publicAxiosInstance.patch("/customer/profile", data);
    return response.result?.customer || response.result || response;
  },

  // Addresses
  getAddresses: async (): Promise<Address[]> => {
    const response: any = await publicAxiosInstance.get("/customer/addresses");
    // If response.result exists, use it. If response.result.addresses exists (unlikely if strictly following rest), use it.
    // Based on generic API: { result: [Array] }
    const addresses = response.result || response;
    return Array.isArray(addresses) ? addresses : [];
  },

  createAddress: async (data: CreateAddressData): Promise<Address> => {
    const response: any = await publicAxiosInstance.post("/customer/addresses", data);
    return response.result || response;
  },

  updateAddress: async ({ id, data }: { id: string; data: Partial<CreateAddressData> }): Promise<Address> => {
    const response: any = await publicAxiosInstance.patch(`/customer/addresses/${id}`, data);
    return response.result || response;
  },

  deleteAddress: async (id: string): Promise<void> => {
    await publicAxiosInstance.delete(`/customer/addresses/${id}`);
  },

  setDefaultAddress: async (id: string): Promise<void> => {
    await publicAxiosInstance.patch(`/customer/addresses/${id}`);
  },

  // Orders
  getOrders: async (): Promise<Order[]> => {
    const response: any = await publicAxiosInstance.get("/customer/orders");
    const orders = response.result || response;
    return Array.isArray(orders) ? orders : [];
  },

  cancelOrder: async (id: string): Promise<void> => {
    await publicAxiosInstance.post(`/customer/orders/${id}/cancel`);
  },

  // Favorites
  getFavorites: async (): Promise<Product[]> => {
    const response: any = await publicAxiosInstance.get("/customer/favorites");
    const favorites = response.result || response;
    return Array.isArray(favorites) ? favorites : [];
  },
};

