
"use client";

import React from "react";
import { Edit, Trash2, MapPin, CheckCircle2 } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Address } from "@/shared/types/profile";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetDefault: (address: Address) => void;
}

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }: AddressCardProps) => {
  const t = useTranslations("profile.addresses");

  return (
    <Card className={cn("relative overflow-hidden transition-all hover:shadow-md", address.isDefault ? "border-primary bg-primary/5" : "border-gray-200")}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                   <h3 className="font-semibold text-lg">{address.label}</h3>
                   <span className="text-sm text-gray-500">{address.fullName}</span>
                </div>
            </div>
            {address.isDefault && (
                <span className="flex items-center text-xs text-primary bg-primary/10 px-2 py-1 rounded-full font-medium">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    {t("default")}
                </span>
            )}
        </div>

        <div className="text-sm text-gray-600 space-y-1 mb-4 mt-2">
           <p>{address.building ? `${address.building}, ` : ''}{address.street}</p>
           <p>{address.neighborhood ? `${address.neighborhood}, ` : ''}{address.city}</p>
           <p>{address.region} {address.postalCode && `- ${address.postalCode}`}</p>
           <p dir="ltr" className="text-right inline-block w-full">{address.phone}</p>
        </div>

        <div className="flex gap-2 pt-2 border-t border-gray-100">
           <Button variant="ghost" size="sm" onClick={() => onEdit(address)} className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-0 h-auto px-2">
             <Edit className="w-4 h-4 mr-1" />
             {t("edit")}
           </Button>
           
           <Button variant="ghost" size="sm" onClick={() => onDelete(address._id)} className="text-red-500 hover:text-red-700 hover:bg-red-50 p-0 h-auto px-2">
             <Trash2 className="w-4 h-4 mr-1" />
             {t("delete")}
           </Button>

           {!address.isDefault && (
             <Button variant="link" size="sm" onClick={() => onSetDefault(address)} className="ml-auto text-xs text-gray-500 hover:text-primary">
               {t("setDefault")}
             </Button>
           )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AddressCard;
