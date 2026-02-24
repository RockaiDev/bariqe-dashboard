
"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/shared/components/ui/alert-dialog";
import { useTranslations } from "next-intl";

interface CancelOrderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

const CancelOrderDialog = ({ isOpen, onClose, onConfirm, isPending }: CancelOrderDialogProps) => {
  const t = useTranslations("profile.orders");

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("cancelConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("cancelConfirmDescription")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>{useTranslations("common")("cancel")}</AlertDialogCancel>
          <AlertDialogAction 
            onClick={(e) => {
                e.preventDefault();
                onConfirm();
            }}
            disabled={isPending}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isPending ? useTranslations("common")("loading") : useTranslations("common")("yes")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default CancelOrderDialog;

