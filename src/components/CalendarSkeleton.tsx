import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

interface CalendarSkeletonProps {
  view: 'month' | 'week';
}

export const CalendarSkeleton = ({ view }: CalendarSkeletonProps) => {
  if (view === 'month') {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between mb-6">
              <Skeleton className="h-6 w-32" />
              <div className="flex gap-2">
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
            
            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="min-h-24 p-1 space-y-1">
                  <Skeleton className="h-4 w-8" />
                  {Math.random() > 0.6 && <Skeleton className="h-3 w-full" />}
                  {Math.random() > 0.8 && <Skeleton className="h-3 w-3/4" />}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Week view skeleton
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header skeleton */}
          <div className="flex items-center justify-between mb-6">
            <Skeleton className="h-6 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
          
          {/* Time slots */}
          <div className="space-y-2">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex gap-2">
                <Skeleton className="h-12 w-16" />
                <div className="flex-1 grid grid-cols-7 gap-1">
                  {Array.from({ length: 7 }).map((_, j) => (
                    <div key={j} className="min-h-12 space-y-1">
                      {Math.random() > 0.7 && <Skeleton className="h-3 w-full" />}
                      {Math.random() > 0.9 && <Skeleton className="h-3 w-2/3" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};