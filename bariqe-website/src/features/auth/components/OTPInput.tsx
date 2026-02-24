import { cn } from "@/lib/utils";
import React, { useRef, useState, useEffect } from "react";

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

const OTPInput = ({ length = 6, value, onChange, className }: OTPInputProps) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Sync internal state with external value if needed (e.g. clear)
  useEffect(() => {
     if (value === "") {
        setOtp(new Array(length).fill(""));
     }
  }, [value, length]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const val = e.target.value;
    if (isNaN(Number(val))) return;

    const newOtp = [...otp];
    // Take the last character entered
    newOtp[index] = val.substring(val.length - 1);
    setOtp(newOtp);

    // Combine and call onChange
    const combinedOtp = newOtp.join("");
    onChange(combinedOtp);

    // Focus next input
    if (val && index < length - 1 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Backspace") {
      if (!otp[index] && index > 0 && inputRefs.current[index - 1]) {
        // Move to previous if current is empty
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split("").forEach((char, i) => {
      if (i < length) newOtp[i] = char;
    });
    setOtp(newOtp);
    onChange(newOtp.join(""));
    
    // Focus last filled
    const nextFocusIndex = Math.min(pastedData.length, length - 1);
    inputRefs.current[nextFocusIndex]?.focus();
  };

  return (
    <div className={cn("flex gap-1 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={digit}
          ref={(ref) => { inputRefs.current[index] = ref }}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-12 h-12 text-center text-xl font-bold border-2 border-yellow-400 rounded-lg focus:border-primary focus:outline-none transition-colors"
        />
      ))}
    </div>
  );
};

export default OTPInput;

