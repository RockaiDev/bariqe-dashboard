// icon spinner من lucide
import { cn } from "@/lib/utils";

export default function LoadingComponent({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen bg-white",
        className
      )}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-gray-500 text-sm">Loading...</span>
      </div>
    </div>
  );
}
