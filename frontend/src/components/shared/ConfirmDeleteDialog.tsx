import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIntl } from "react-intl";

export function ConfirmDeleteDialog({ open, setOpen, itemName, onConfirm }: {
  open: boolean;
  setOpen: (val: boolean) => void;
  itemName: string;
  onConfirm: () => void;
}) {
  const intl = useIntl();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] text-center">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <DialogTitle className="text-xl">
            {intl.formatMessage({ id: 'delete.confirm.title' }, { item: itemName })}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{intl.formatMessage({ id: 'delete.confirm.description' })}</p>
        </div>
        <div className="mt-4 flex gap-2 justify-center items-center w-full">
          <Button type="button" className="cursor-pointer" variant="outline" onClick={() => setOpen(false)}>{intl.formatMessage({ id: 'common.cancel' })}</Button>
          <Button variant="destructive" className="text-white cursor-pointer" onClick={onConfirm}>{intl.formatMessage({ id: 'common.delete' })}</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}