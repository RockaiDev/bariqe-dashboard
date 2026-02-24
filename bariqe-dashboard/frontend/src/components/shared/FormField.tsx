import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { CustomPhoneInput } from "./phone-input";
// إضافة هذا

interface FormFieldProps {
  id: string;
  label: string;
  value: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onPhoneChange?: (value: string | undefined) => void; // إضافة هذا للهاتف
  placeholder?: string;
  required?: boolean;
  type?: "text" | "email" | "password" | "number" | "tel" | "url" | "search" | "date" | "time" | "datetime-local" | "file";
  min?: string | number;
  max?: string | number;
  step?: string | number;
  disabled?: boolean;
  className?: string;
  variant?: "input" | "textarea" | "phone" | "default"; // إضافة "phone"
  rows?: number;
  error?: string;
  helperText?: string;
  dir?: "ltr" | "rtl"; // إضافة هذا لتحديد الاتجاه
}

export function FormField({
  id,
  label,
  value,
  onChange,
  onPhoneChange,
  placeholder,
  required = false,
  type = "text",
  min,
  max,
  step,
  disabled = false,
  className = "",
  variant = "input",
  rows = 3,
  error,
  helperText,
  dir = "ltr"

}: FormFieldProps) {
  const renderField = () => {
    if (variant === "textarea") {
      return (
        <Textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={onChange}
          required={required}
          disabled={disabled}
          rows={rows}
          className={`resize-none ${error ? "border-red-500 focus:border-red-500" : ""}`}
        />
      );
    }
    
    // إصلاح: إضافة else if بدلاً من الأقواس المنفصلة
    else if (variant === "phone") {
      return (
        <CustomPhoneInput
          value={value}
          onChange={onPhoneChange || (() => {})}
          placeholder={placeholder}
          className={error ? "border-red-500 focus:border-red-500" : ""}
          disabled={disabled}
        />
      );
    }

    return (
      <Input
        dir={dir}
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={error ? "border-red-500 focus:border-red-500" : ""}
      />
    );
  };

  return (
    <div className={`grid gap-2 ${className}`}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      
      {renderField()}
      
      {error && (
        <p className="text-sm text-red-500 mt-1">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 mt-1">{helperText}</p>
      )}
    </div>
  )
}