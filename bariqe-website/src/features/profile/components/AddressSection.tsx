
"use client";

import React, { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { useAddresses, useCreateAddress, useUpdateAddress, useDeleteAddress, useSetDefaultAddress } from "@/shared/hooks/useProfile";
import AddressCard from "./AddressCard";
import AddressModal from "./AddressModal";
import { Address } from "@/shared/types/profile";
import { AddressSchema } from "@/lib/validations/profile";
import { useTranslations } from "next-intl";
import { id } from "zod/v4/locales";

const AddressSection = () => {
  const t = useTranslations("profile.addresses");
  const { data: addresses, isLoading } = useAddresses();

  const { mutate: createAddress, isPending: isCreating } = useCreateAddress();
  const { mutate: updateAddress, isPending: isUpdating } = useUpdateAddress();
  const { mutate: deleteAddress } = useDeleteAddress();
  const { mutate: setDefaultAddress } = useSetDefaultAddress();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const handleAddClick = () => {
    setEditingAddress(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (address: Address) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    if (confirm("Are you sure you want to delete this address?")) {
        deleteAddress(id);
    }
  };

  const handleSetDefault = (address: Address) => {
      setDefaultAddress({id:address._id, data:{...address, isDefault: true}});
  }

  const handleSubmit = (data: AddressSchema) => {
    if (editingAddress) {
      updateAddress(
        { id: editingAddress._id, data },
        {
          onSuccess: () => setIsModalOpen(false),
        }
      );
    } else {
      createAddress(data, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  if (isLoading) {
    return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className=" p-6 rounded-lg shadow-sm border space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-primary">{t("title")}</h2>
        <Button onClick={handleAddClick} variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary hover:text-white">
          <Plus className="h-4 w-4" />
          {t("add")}
        </Button>
      </div>

      {!addresses || !Array.isArray(addresses) || addresses.length === 0 ? (
        <div className="text-center py-10 text-gray-500 bg-gray-50 rounded-lg">
          {t("noAddresses")}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((address) => (
            <AddressCard
              key={address._id}
              address={address}
              onEdit={handleEditClick}
              onDelete={handleDeleteClick}
              onSetDefault={handleSetDefault}
            />
          ))}
        </div>
      )}

      <AddressModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editingAddress}
        isSubmitting={isCreating || isUpdating}
      />
    </div>
  );
};

export default AddressSection;

