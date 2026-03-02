import { dashboardSearchParams, resolveDateRange, getComparisonRange } from "./searchParams";
import {
  fetchKpiMetrics,
  fetchTimeSeries,
  fetchCreativeComparison,
  fetchFilterOptions,
} from "@/lib/queries/dashboard";
import { FilterBar } from "@/components/dashboard/FilterBar";
import { MetricCards } from "@/components/dashboard/MetricCards";
import { ChartSection } from "@/components/dashboard/ChartSection";
import { PerformanceTable } from "@/components/dashboard/PerformanceTable";
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
    <div className="space-y-6 p-6">
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

      {/* KPI Metric Cards */}
      <MetricCards current={currentKpi} comparison={comparisonKpi} />

      {/* Charts Section */}
      <ChartSection timeSeries={timeSeries} creatives={creatives} />

      {/* Sortable performance table */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Creative Performance
        </h2>
        <PerformanceTable data={creatives} />
      </section>
    </div>
  );
}
