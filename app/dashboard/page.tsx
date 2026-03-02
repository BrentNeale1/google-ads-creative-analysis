import { dashboardSearchParams, resolveDateRange, getComparisonRange } from "./searchParams";
import {
  fetchKpiMetrics,
  fetchTimeSeries,
  fetchCreativeComparison,
  fetchFilterOptions,
} from "@/lib/queries/dashboard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { BarChart3 } from "lucide-react";

/** Force dynamic rendering -- data depends on URL params and DB */
export const dynamic = "force-dynamic";

interface DashboardPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = dashboardSearchParams.parse(await searchParams);

  // No account selected -- show prompt
  if (!params.account) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl border border-surface-gridline p-10 shadow-sm text-center max-w-md">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-brand-blue/10 text-brand-blue mx-auto mb-4">
            <BarChart3 size={24} />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Select an account
          </h2>
          <p className="text-sm text-gray-500">
            Choose an account from the sidebar to view your dashboard with
            performance metrics, charts, and creative analysis.
          </p>
        </div>
      </div>
    );
  }

  // Resolve date range from params
  const { dateFrom, dateTo } = resolveDateRange(params);
  const { compFrom, compTo } = getComparisonRange(dateFrom, dateTo);

  // Fetch all data in parallel
  const [currentKpi, comparisonKpi, timeSeries, creatives, filterOptions] =
    await Promise.all([
      fetchKpiMetrics(
        params.account,
        dateFrom,
        dateTo,
        params.campaign,
        params.adGroup,
      ),
      fetchKpiMetrics(
        params.account,
        compFrom,
        compTo,
        params.campaign,
        params.adGroup,
      ),
      fetchTimeSeries(
        params.account,
        dateFrom,
        dateTo,
        params.campaign,
        params.adGroup,
      ),
      fetchCreativeComparison(
        params.account,
        dateFrom,
        dateTo,
        params.campaign,
        params.adGroup,
      ),
      fetchFilterOptions(params.account),
    ]);

  return (
    <div className="space-y-6">
      {/* Filter bar */}
      <FilterBar
        campaigns={filterOptions.campaigns}
        adGroups={filterOptions.adGroups}
      />

      {/* Period info */}
      <div className="text-xs text-gray-400">
        Showing {dateFrom} to {dateTo} &middot; Compared with {compFrom} to{" "}
        {compTo}
      </div>

      {/* Metric Cards placeholder */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Key Metrics
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Current Period KPIs</p>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(currentKpi, null, 2)}
            </pre>
          </div>
          <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm">
            <p className="text-xs text-gray-500 mb-1">Comparison Period KPIs</p>
            <pre className="text-xs text-gray-700 overflow-auto max-h-40">
              {JSON.stringify(comparisonKpi, null, 2)}
            </pre>
          </div>
        </div>
      </section>

      {/* Charts placeholder */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Charts
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm min-h-[200px]">
            <p className="text-xs text-gray-500 mb-2">
              Time Series ({timeSeries.length} data points)
            </p>
            <pre className="text-xs text-gray-700 overflow-auto max-h-60">
              {JSON.stringify(timeSeries.slice(0, 5), null, 2)}
              {timeSeries.length > 5 && `\n... and ${timeSeries.length - 5} more`}
            </pre>
          </div>
          <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm min-h-[200px]">
            <p className="text-xs text-gray-500 mb-2">
              Creative Comparison ({creatives.length} creatives)
            </p>
            <pre className="text-xs text-gray-700 overflow-auto max-h-60">
              {JSON.stringify(creatives.slice(0, 5), null, 2)}
              {creatives.length > 5 && `\n... and ${creatives.length - 5} more`}
            </pre>
          </div>
        </div>
      </section>

      {/* Table placeholder */}
      <section>
        <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-3">
          Creative Performance Table
        </h2>
        <div className="bg-white rounded-xl border border-surface-gridline p-4 shadow-sm">
          <p className="text-xs text-gray-500 mb-2">
            All creatives ({creatives.length} rows)
          </p>
          <pre className="text-xs text-gray-700 overflow-auto max-h-80">
            {JSON.stringify(creatives, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}
