
import React from 'react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { cn } from '@/lib/utils';

interface PhoneInputProps {
  value: string;
  onChange: (value: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function CustomPhoneInput({
  value,
  onChange,
  placeholder = "Enter phone number",
  className,
  disabled = false,
}: PhoneInputProps) {
  return (
    <PhoneInput
      international
      countryCallingCodeEditable={false}
      defaultCountry="EG" // مصر كدولة افتراضية
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        '--PhoneInputCountryFlag-height': '1em',
        '--PhoneInputCountrySelectArrow-color': '#6b7280',
      } as React.CSSProperties}
    />
  );
}