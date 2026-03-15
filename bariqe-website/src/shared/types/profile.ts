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


export interface ProductDetails {
  _id: string;
  productNameAr: string;
  productNameEn: string;
  productImage: string;
  productCode?: string;
  productNewPrice?: number;
  productOldPrice?: number;
}

export interface OrderItem {
  product: ProductDetails;
  quantity: number;
  itemDiscount: number;
  _id: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  nationalAddress: string;
  country: string;
}

export interface PaymentInfo {
  method: string;
  status: 'pending' | 'paid' | 'failed';
  invoiceId: string;
  paymentUrl: string;
  transactionId: string;
  
}

export interface ShippingInfo {
  carrier: 'jt_express' | string;
  trackingNumber?: string;
  sortingCode?: string;
  lastCenterName?: string;
  status?: string;
}

export interface Order {
  _id: string;
  orderNumber?: string;
  customer: string;
  shippingAddress: ShippingAddress;
  payment: PaymentInfo;
  shipping: ShippingInfo;
  products: OrderItem[];
  orderQuantity: string;
  subtotal: number;
  shippingCost: number;
  orderDiscount: number;
  total: number;
  orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  updatedAt: string;
  __v: number;
}