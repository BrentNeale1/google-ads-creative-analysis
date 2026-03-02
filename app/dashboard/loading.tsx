/**
 * Loading skeleton displayed while the dashboard page fetches data server-side.
 * Mirrors the dashboard layout structure with pulsing placeholder elements.
 */
export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Filter bar skeleton */}
      <div className="bg-white border-b border-surface-gridline px-6 py-3 rounded-lg">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Date preset buttons */}
          <div className="h-8 w-12 bg-surface-gridline rounded-full" />
          <div className="h-8 w-14 bg-surface-gridline rounded-full" />
          <div className="h-8 w-14 bg-surface-gridline rounded-full" />
          <div className="h-8 w-16 bg-surface-gridline rounded-full" />
          {/* Divider */}
          <div className="h-6 w-px bg-surface-gridline mx-1" />
          {/* Campaign dropdown */}
          <div className="h-8 w-36 bg-surface-gridline rounded-lg" />
          {/* Ad group dropdown */}
          <div className="h-8 w-36 bg-surface-gridline rounded-lg" />
          {/* Clear button */}
          <div className="h-6 w-10 bg-surface-gridline rounded" />
        </div>
      </div>

      {/* Period info skeleton */}
      <div className="h-4 w-64 bg-surface-gridline rounded" />

      {/* Metric cards skeleton */}
      <section>
        <div className="h-4 w-28 bg-surface-gridline rounded mb-3" />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm"
            >
              <div className="h-3 w-16 bg-surface-gridline rounded mb-3" />
              <div className="h-7 w-20 bg-surface-gridline rounded mb-2" />
              <div className="h-3 w-14 bg-surface-gridline rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Charts skeleton */}
      <section>
        <div className="h-4 w-16 bg-surface-gridline rounded mb-3" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm min-h-[280px]">
            <div className="h-4 w-32 bg-surface-gridline rounded mb-4" />
            <div className="flex items-end gap-1 h-48">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 bg-surface-gridline rounded-t"
                  style={{ height: `${30 + Math.random() * 70}%` }}
                />
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm min-h-[280px]">
            <div className="h-4 w-40 bg-surface-gridline rounded mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-3 w-24 bg-surface-gridline rounded" />
                  <div
                    className="h-6 bg-surface-gridline rounded"
                    style={{ width: `${30 + Math.random() * 60}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Table skeleton */}
      <section>
        <div className="h-4 w-48 bg-surface-gridline rounded mb-3" />
        <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm">
          {/* Table header */}
          <div className="flex gap-4 mb-3 pb-3 border-b border-surface-gridline">
            <div className="h-3 w-32 bg-surface-gridline rounded" />
            <div className="h-3 w-16 bg-surface-gridline rounded" />
            <div className="h-3 w-16 bg-surface-gridline rounded" />
            <div className="h-3 w-16 bg-surface-gridline rounded" />
            <div className="h-3 w-16 bg-surface-gridline rounded" />
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex gap-4 py-2.5 border-b border-surface-gridline last:border-0"
            >
              <div className="h-3 w-32 bg-surface-gridline rounded" />
              <div className="h-3 w-16 bg-surface-gridline rounded" />
              <div className="h-3 w-16 bg-surface-gridline rounded" />
              <div className="h-3 w-16 bg-surface-gridline rounded" />
              <div className="h-3 w-16 bg-surface-gridline rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
