import { useIntl } from 'react-intl';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "add" | "edit" | "delete" | "custom";
  isDestructive?: boolean;
}

export default function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = "custom",
  isDestructive = false
}: ConfirmationDialogProps) {
  const intl = useIntl();

  // Default texts based on variant
  const getDefaultTexts = () => {
    switch (variant) {
      case "add":
        return {
          title: title || intl.formatMessage({ id: "common.confirm_close" }),
          description: description || intl.formatMessage({ id: "common.unsaved_data_warning" }),
          message: message || intl.formatMessage({ id: "common.unsaved_changes_question" }),
          confirmText: confirmText || intl.formatMessage({ id: "common.close_without_saving" }),
          cancelText: cancelText || intl.formatMessage({ id: "common.continue_adding" })
        };
      case "edit":
        return {
          title: title || intl.formatMessage({ id: "common.confirm_close" }),
          description: description || intl.formatMessage({ id: "common.unsaved_changes_warning" }),
          message: message || intl.formatMessage({ id: "common.unsaved_changes_question" }),
          confirmText: confirmText || intl.formatMessage({ id: "common.close_without_saving" }),
          cancelText: cancelText || intl.formatMessage({ id: "common.continue_editing" })
        };
      case "delete":
        return {
          title: title || intl.formatMessage({ id: "common.confirm_delete" }),
          description: description || intl.formatMessage({ id: "common.delete_warning" }),
          message: message || intl.formatMessage({ id: "common.delete_question" }),
          confirmText: confirmText || intl.formatMessage({ id: "common.delete" }),
          cancelText: cancelText || intl.formatMessage({ id: "common.cancel" })
        };
      default:
        return {
          title: title || intl.formatMessage({ id: "common.confirm" }),
          description: description || "",
          message: message || intl.formatMessage({ id: "common.are_you_sure" }),
          confirmText: confirmText || intl.formatMessage({ id: "common.confirm" }),
          cancelText: cancelText || intl.formatMessage({ id: "common.cancel" })
        };
    }
  };

  const texts = getDefaultTexts();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[425px] w-full mx-auto flex flex-col items-start justify-center " 
        aria-describedby="confirmation-dialog-description"
      >
        <DialogHeader>
          <DialogTitle>{texts.title}</DialogTitle>
          {texts.description && (
            <DialogDescription id="confirmation-dialog-description">
              {texts.description}
            </DialogDescription>
          )}
        </DialogHeader>
        
        {texts.message && (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              {texts.message}
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            {texts.cancelText}
          </Button>
          <Button 
            variant={isDestructive || variant === "delete" ? "destructive" : "default"}
            className="text-white" 
            onClick={onConfirm}
          >
            {texts.confirmText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}