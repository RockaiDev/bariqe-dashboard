
import { z } from "zod";

export const updateProfileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  email: z.string().email("Invalid email address"),
  currentPassword: z.string().optional(),
  password: z.string().optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

export const addressSchema = z.object({
  label: z.string().default("Home"),
  fullName: z.string().min(2, "Full Name is required"),
  phone: z.string().min(10, "Phone number must be at least 10 characters"),
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  region: z.string().min(1, "Region is required"),
  postalCode: z.string().optional(),
  isDefault: z.boolean().default(false),
  
  // Optional/Legacy fields allowed in form but might not be saved strictly by backend schema unless strict: false
  neighborhood: z.string().optional(),
  building: z.string().optional(),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
});

export type AddressSchema = z.infer<typeof addressSchema>;

