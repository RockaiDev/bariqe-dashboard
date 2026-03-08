
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/lib/services/profile";
import { toast } from "react-hot-toast";
import { UserProfile, Address, Order } from "@/shared/types/profile";
import { Product } from "@/shared/types";
import { useTranslations } from "next-intl";


// Keys for React Query
export const profileKeys = {
  profile: ["profile"],
  addresses: ["addresses"],
  orders: ["orders"],
  favorites: ["favorites"],
};

// Profile Hooks
export const useProfile = () => {
  return useQuery<UserProfile>({
    queryKey: profileKeys.profile,
    queryFn: profileService.getProfile,
    retry: 0, // Don't retry for unauthenticated users
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("profile.personalInfo.messages");
  return useMutation({
    mutationFn: profileService.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(profileKeys.profile, data);
      toast.success(t("updateSuccess"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("updateFailed"));
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
  const t = useTranslations("profile.addresses.messages");
  return useMutation({
    mutationFn: profileService.createAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success(t("addSuccess"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("addFailed"));
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("profile.addresses.messages");
  return useMutation({
    mutationFn: profileService.updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success(t("updateSuccess"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("updateFailed"));
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("profile.addresses.messages");
  return useMutation({
    mutationFn: profileService.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success(t("deleteSuccess"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("deleteFailed"));
    },
  });
};

export const useSetDefaultAddress = () => {
  const queryClient = useQueryClient();
  const t = useTranslations("profile.addresses.messages");
  return useMutation({
    mutationFn: profileService.updateAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.addresses });
      toast.success(t("defaultSuccess"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("defaultFailed"));
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
  const t = useTranslations("profile.orders.messages");
  return useMutation({
    mutationFn: profileService.cancelOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.orders });
      toast.success(t("cancelSuccess"));
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || t("cancelFailed"));
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

