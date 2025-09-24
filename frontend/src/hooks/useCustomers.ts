// src/hooks/useCustomers.ts
import { keepPreviousData, useQuery } from "@tanstack/react-query"
import axiosInstance from "@/helper/axiosInstance"

export interface Customer {
  _id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerCompany?: string
  customerNotes?: string
}

export interface CustomerFilters {
  page?: number
  perPage?: number
  sorts?: [string, "asc" | "desc"][]
  queries?: [string, string, string][] // e.g. [["customerName", "==", "John"]]
  search?: string
}

interface CustomerResponse {
  data: Customer[]
  pagination: {
    currentPage: number
    perPage: number
    total: number
    hasNextPage: boolean
  }
  count: number
}

async function fetchCustomers(filters: CustomerFilters): Promise<CustomerResponse> {
  try {
    const response = await axiosInstance.get("/customers", { params: filters })
    return response
  } catch (err: any) {
    // Error normalization
    throw new Error(err.response?.data?.message || err.message || "Failed to fetch customers.")
  }
}

export default function useCustomers(filters: CustomerFilters) {
  return useQuery<CustomerResponse, Error>({
    queryKey: ["customers", filters],
    queryFn: () => fetchCustomers(filters),
    placeholderData: keepPreviousData,  // <-- instead of keepPreviousData: true
    staleTime: 30_000,
    retry: 2,
    refetchOnWindowFocus: false
  })
}