// hooks/useDeleteConfirm.tsx
import { useState, useCallback } from "react";

interface UseDeleteConfirmOptions {
  onConfirm: (id?: string) => void | Promise<void>;
  itemName?: string;
  title?: string;
  description?: string;
}

export function useDeleteConfirm({
  onConfirm,
  itemName,
  title,
  description,
}: UseDeleteConfirmOptions) {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showConfirm = useCallback((id?: string) => {
    setPendingId(id || null);
    setIsOpen(true);
  }, []);

  const handleConfirm = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onConfirm(pendingId || undefined);
      setIsOpen(false);
    } finally {
      setIsDeleting(false);
      setPendingId(null);
    }
  }, [onConfirm, pendingId]);

  const handleCancel = useCallback(() => {
    setIsOpen(false);
    setPendingId(null);
  }, []);

  return {
    isOpen,
    isDeleting,
    showConfirm,
    handleConfirm,
    handleCancel,
    dialogProps: {
      open: isOpen,
      onOpenChange: setIsOpen,
      onConfirm: handleConfirm,
      isDeleting,
      itemName,
      title,
      description,
    },
  };
}