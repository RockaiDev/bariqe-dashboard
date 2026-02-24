"use client";
import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/shared/components/ui/button";
import Image from "next/image";
import { usePublicBusinessInfo } from "@/shared/hooks/usePublicApi";

export default function WhatsAppIcon() {
  const { data: businessInfo, isLoading: isLoadingBusinessInfo } =
    usePublicBusinessInfo({
      showErrorToast: false,
    });

  useEffect(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);
  const whatsappNumber = businessInfo?.result?.whatsapp || "1234567890";
  return (
    <div className="fixed bottom-6 right-6 z-50 group">
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{
          type: "spring",
          stiffness: 260,
          damping: 20,
          // إزالة الـ delay ليظهر الأيقون على طول
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          className="bg-green-500/20 backdrop-blur-sm hover:bg-green-500/30 border border-green-500/30 text-green-600 hover:text-green-700 p-3 sm:p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group-hover:shadow-green-500/25"
          onClick={() => {
            // Replace with your WhatsApp number
            window.open(`https://wa.me/${whatsappNumber}`, "_blank");
          }}
        >
          {/* استخدام SVG بدلاً من الصورة لضمان الظهور */}
          <svg
            width="30"
            height="30"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6 sm:w-8 sm:h-8"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516" />
          </svg>

          {/* Tooltip */}
          <span className="absolute right-full mr-3 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Chat with us on WhatsApp
          </span>

          {/* Ripple effect */}
          <span className="absolute inset-0 rounded-full bg-green-500/20 animate-ping"></span>
        </Button>
      </motion.div>
    </div>
  );
}

