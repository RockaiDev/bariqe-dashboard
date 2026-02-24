import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIntl } from "react-intl";

export function ConfirmLogoutDialog({ open, setOpen, onConfirm, isLoading }: {
  open: boolean;
  setOpen: (val: boolean) => void;
  onConfirm: () => void;
  isLoading?: boolean;
}) {
  const intl = useIntl();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[420px] text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-yellow-700" />
          </div>
          <DialogTitle className="text-xl">{intl.formatMessage({ id: 'logout.confirm.title' })}</DialogTitle>
          <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'logout.confirm.description' })}</p>
        </div>
        <div className="mt-4 flex gap-2 justify-center items-center w-full">
          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            {intl.formatMessage({ id: 'common.cancel' })}
          </Button>
          <Button
            variant="destructive"
            className="text-white cursor-pointer"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "..." : intl.formatMessage({ id: 'logout.confirm.confirmButton' })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
