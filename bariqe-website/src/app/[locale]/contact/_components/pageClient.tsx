"use client";
import React from "react";
import ContactForm from "./form/ContactForm";
import ContactMap from "./map/ContactMap";
import { usePublicBusinessInfo } from "@/shared/hooks/usePublicApi";
import { Loader2 } from "lucide-react";

interface PageClientProps {
  locale: string;
}

export default function PageClient({ locale }: PageClientProps) {
  const { data: businessInfo, isLoading } = usePublicBusinessInfo({
    showErrorToast: false,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  const hasLocations = businessInfo?.result?.locations && businessInfo.result.locations.length > 0;

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-4 gap-12`}>
      {/* Contact Form */}
      <div className="lg:col-span-2">
        <ContactForm />
      </div>

      {/* Map */}
      { (
        <div className=" lg:col-span-2 p-2">
          <ContactMap />
        </div>
      )}
    </div>
  );
}