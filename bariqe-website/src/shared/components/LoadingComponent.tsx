// components/shared/LoadingComponent.tsx
import { cn } from "@/lib/utils";

interface LoadingComponentProps {
  className?: string;
  message?: string;
  size?: "sm" | "md" | "lg";
  fullScreen?: boolean;
}

export default function LoadingComponent({
  className,
  message = "Loading...",
  size = "md",
  fullScreen = true,
}: LoadingComponentProps) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-8 w-8", 
    lg: "h-12 w-12"
  };

  const containerClass = fullScreen 
    ? "fixed inset-0 z-50 flex items-center justify-center bg-white" 
    : "flex items-center justify-center";

  return (
    <div className={cn(containerClass, className)}>
      <div className="flex flex-col items-center justify-center gap-2">
        <div className={cn(
          "animate-spin rounded-full border-b-2 border-primary",
          sizes[size]
        )}></div>
        <span className="text-gray-500 text-sm">{message}</span>
      </div>
    </div>
  );
}
