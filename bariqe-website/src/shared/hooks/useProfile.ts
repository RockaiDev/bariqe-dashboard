
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react"; 
import { profileService } from "@/lib/services/profile";
import { toast } from "react-hot-toast";
import { UserProfile, Address, Order } from "@/shared/types/profile";
import { Product } from "@/shared/types";

// Keys for React Query
export const profileKeys = {
  profile: ["profile"],
  addresses: ["addresses"],
  orders: ["orders"],
  favorites: ["favorites"],
};

// Profile Hooks
export const useProfile = () => {
  const [hasToken, setHasToken] = useState(
    typeof window !== "undefined" && !!localStorage.getItem("token")
  );

  useEffect(() => {
    const handler = () => setHasToken(!!localStorage.getItem("token"));
    window.addEventListener("auth-change", handler);
    return () => window.removeEventListener("auth-change", handler);
  }, []);

  return useQuery<UserProfile>({
    queryKey: profileKeys.profile,
    queryFn: profileService.getProfile,
    retry: 0,
    staleTime: 5 * 60 * 1000,
    enabled: hasToken,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.profile, data);
      toast.success("Profile updated successfully");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
  });
};

// Address Hooks
export const useAddresses = () => {
  return useQuery<Address[]>({
    queryKey: profileKeys.addresses,
    queryFn: profileService.getAddresses,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success("Address added successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to add address");
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success("Address updated successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update address");
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success("Address deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete address");
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success("Default address set successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to set default address");
    }
  });
};


// Order Hooks
export const useOrders = () => {
  return useQuery<Order[]>({
    queryKey: profileKeys.orders,
    queryFn: profileService.getOrders,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: profileService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.orders });
      toast.success("Order cancelled successfully");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to cancel order");
    },
  });
};


// Favorites Hooks
export const useFavorites = () => {
  return useQuery<Product[]>({
    queryKey: profileKeys.favorites,
    queryFn: profileService.getFavorites,
  });
};

