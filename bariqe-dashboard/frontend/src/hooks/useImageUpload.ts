// hooks/useImageUpload.ts
import { useMutation } from "@tanstack/react-query";
import axiosInstance from "@/helper/axiosInstance";
import toast from "react-hot-toast";

interface UploadOptions {
  folder?: string;
  prefix?: string;
}

export function useImageUpload() {
  return useMutation({
    mutationFn: async ({ file, options }: { file: File; options?: UploadOptions }) => {
      const formData = new FormData();
      formData.append("image", file);
      
      if (options?.folder) {
        formData.append("folder", options.folder);
      }
      
      if (options?.prefix) {
        formData.append("prefix", options.prefix);
      }

      // ✅ تصحيح الـ endpoint
      const response :any= await axiosInstance.post("/business-info/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      console.log(response);
      // ✅ تصحيح طريقة الحصول على الـ URL
      return response.url as string;
    },
    onError: (error: any) => {
      console.error("Upload error:", error);
      toast.error(
        error?.response?.data?.message || "Failed to upload image"
      );
    },
  });
}