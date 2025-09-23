import { useState } from 'react';

interface UseConfirmationDialogProps {
  onConfirm?: () => void;
  onCancel?: () => void;
}

export function useConfirmationDialog({
  onConfirm,
  onCancel
}: UseConfirmationDialogProps = {}) {
  const [isOpen, setIsOpen] = useState(false);

  const showDialog = () => setIsOpen(true);
  const hideDialog = () => setIsOpen(false);

  const handleConfirm = () => {
    onConfirm?.();
    hideDialog();
  };

  const handleCancel = () => {
    onCancel?.();
    hideDialog();
  };

  return {
    isOpen,
    showDialog,
    hideDialog,
    handleConfirm,
    handleCancel,
    setIsOpen
  };
}