
import toast from 'react-hot-toast';

export const useToast = () => {
  const showSuccess = (message: string) => {
    toast.success(message, {
      duration: 3000,
      position: 'top-center',
    });
  };

  const showError = (message: string) => {
    toast.error(message, {
      duration: 5000,
      position: 'top-right',
    });
  };

  const showLoading = (message: string) => {
    return toast.loading(message);
  };

  const dismiss = (toastId?: string) => {
    toast.dismiss(toastId);
  };

  const dismissAll = () => {
    toast.dismiss();
  };

  return {
    showSuccess,
    showError,
    showLoading,
    dismiss,
    dismissAll,
  };
};


