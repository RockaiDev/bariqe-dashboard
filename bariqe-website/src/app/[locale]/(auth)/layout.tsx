"use client";

import React from 'react'
import Image from 'next/image'
import { GuestGuard } from "@/shared/components/guards";

const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <GuestGuard>
      <div className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden">
        {/* Background Image - Absolute text/elements in the design seem to be part of the background provided */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/auth-bg.png"
            alt="Authentication Background"
            fill
            className="object-cover hidden md:block"
            priority
            quality={100}
          />
          {/* Slight overlay to ensure card pops if needed, but design implies clean image */}
        </div>

        {/* Main Content Area */}
        <div className="relative z-10 w-full flex justify-center items-center">
          {children}
        </div>
      </div>
    </GuestGuard>
  )
}

export default AuthLayout