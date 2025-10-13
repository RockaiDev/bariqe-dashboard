// components/shared/DeleteConfirmDialog.tsx
import { useIntl } from "react-intl";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  isDeleting?: boolean;
  itemName?: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  isDeleting = false,
  itemName,
}: DeleteConfirmDialogProps) {
  const intl = useIntl();

  const defaultTitle = intl.formatMessage(
    { id: "common.confirm_delete_title" },
    { item: itemName || "" }
  );

  const defaultDescription = intl.formatMessage(
    { id: "common.confirm_delete_description" },
    { item: itemName || "" }
  );

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <AlertDialogTitle className="text-xl">
              {title || defaultTitle}
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-base mt-2">
            {description || defaultDescription}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {intl.formatMessage({ id: "common.cancel" })}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isDeleting ? (
              <>
                <span className="inline-block animate-spin mr-2">⏳</span>
                {intl.formatMessage({ id: "common.deleting" })}
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                {intl.formatMessage({ id: "common.delete" })}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}