import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface ReportSkeletonProps {
  showKPIs?: boolean;
  showChart?: boolean;
  showTable?: boolean;
}

export function ReportSkeleton({ 
  showKPIs = true, 
  showChart = true, 
  showTable = true 
}: ReportSkeletonProps) {
  return (
    <div className="space-y-6 animate-in fade-in-50 duration-300">
      {/* KPI Skeletons */}
      {showKPIs && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Chart Skeleton */}
      {showChart && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-48" />
          </CardHeader>
          <CardContent>
            <div className="h-[350px] flex items-end gap-2 p-4">
              {[40, 65, 45, 80, 55, 70, 60, 75, 50, 85, 65, 55].map((height, i) => (
                <Skeleton 
                  key={i} 
                  className="flex-1 rounded-t-md" 
                  style={{ height: `${height}%` }} 
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table Skeleton */}
      {showTable && (
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-40" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex gap-4 pb-2 border-b">
                {[100, 80, 120, 80, 60].map((w, i) => (
                  <Skeleton key={i} className="h-4" style={{ width: w }} />
                ))}
              </div>
              {[1, 2, 3, 4, 5].map((row) => (
                <div key={row} className="flex gap-4 py-2">
                  {[100, 80, 120, 80, 60].map((w, i) => (
                    <Skeleton key={i} className="h-4" style={{ width: w }} />
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
