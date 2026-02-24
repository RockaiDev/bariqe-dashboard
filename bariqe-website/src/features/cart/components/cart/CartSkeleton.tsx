import { Skeleton } from '@/shared/components/ui/skeleton';

export function CartSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="border rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <Skeleton className="w-full sm:w-24 h-40 sm:h-24 rounded" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 sm:h-6 w-full sm:w-3/4" />
              <Skeleton className="h-4 w-2/3 sm:w-1/2" />
              <Skeleton className="h-8 sm:h-10 w-full sm:w-32" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
