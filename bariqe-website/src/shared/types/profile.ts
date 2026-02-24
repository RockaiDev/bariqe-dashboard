import { User } from "./auth";
import { Product } from "./index";

export type UserProfile = User;

export interface Address {
  _id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode?: string;
  country?: string;
  isDefault: boolean;
  neighborhood?: string;
  building?: string;
  blockNumber?: string;
  floor?: string;
  email?: string;
  nationalAddress?: string;
}

export interface CreateAddressData extends Omit<Address, "_id" | "isDefault"> {
  isDefault?: boolean;
}

export interface OrderItem {
  product: Product;
  quantity: number;
  price: number;
  itemDiscount?: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: Address;
  orderStatus: string;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled" | "paid" | "failed" | string;
  payment?: {
    status: string;
    method?: string;
    paymentUrl?: string;
    invoiceId?: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}

