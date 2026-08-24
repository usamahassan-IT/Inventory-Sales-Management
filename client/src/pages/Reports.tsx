import { PageHeader } from "@/components/AppPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertCircle,
  BarChart3,
  CalendarDays,
  LineChart,
  PackageSearch,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const toDateInput = (date: Date) => date.toISOString().slice(0, 10);
const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function Reports() {
  const [dateFrom, setDateFrom] = useState(() =>
    toDateInput(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000))
  );
  const [dateTo, setDateTo] = useState(() => toDateInput(new Date()));

  const input = useMemo(
    () => ({
      dateFrom: new Date(`${dateFrom}T00:00:00`),
      dateTo: new Date(`${dateTo}T23:59:59`),
    }),
    [dateFrom, dateTo]
  );

  const { data, isLoading, isError, refetch } = trpc.insights.reports.useQuery(input);

  const salesData =
    data?.salesOverTime.map(item => ({
      ...item,
      revenue: Number(item.revenue),
      date: new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    })) ?? [];

  const topProducts =
    data?.topProducts.map(item => ({
      ...item,
      revenue: Number(item.revenue),
    })) ?? [];

  const stockData =
    data?.stockTrend.map(item => ({
      ...item,
      date: new Date(`${item.date}T00:00:00`).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      }),
    })) ?? [];

  const chartState = (content: React.ReactNode, empty: string) =>
    isLoading ? (
      <Loading />
    ) : isError ? (
      <ReportError retry={() => refetch()} />
    ) : (
      content ?? <Empty text={empty} />
    );

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Performance intelligence"
        title="Analytics & Reports"
        description="Monitor sales velocity, top-performing SKUs, and inventory flow dynamics over customizable operational windows."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="field-input w-auto text-xs font-bold"
                aria-label="Report start date"
              />
              <span className="text-xs font-bold text-muted-foreground">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="field-input w-auto text-xs font-bold"
                aria-label="Report end date"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-10.5 rounded-xl border-border bg-card text-xs font-bold text-foreground hover:bg-muted"
            >
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
              Refresh
            </Button>
          </div>
        }
      />

      <section className="grid gap-6 xl:grid-cols-2">
        {/* Sales Over Time Area Chart */}
        <ChartCard
          icon={<TrendingUp className="h-4.5 w-4.5" />}
          title="Revenue velocity"
          description="Daily completed transaction revenue over time"
        >
          <div className="h-[300px]">
            {chartState(
              salesData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={salesData} margin={{ left: -10, right: 10, top: 12, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="currentColor" className="opacity-10" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "currentColor", fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={value => `$${value}`}
                      tick={{ fill: "currentColor", fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [money(value), "Revenue"]}
                      contentStyle={{
                        borderRadius: 14,
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="#4f46e5"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#salesGrad)"
                      activeDot={{ r: 6, fill: "#4f46e5", stroke: "#818cf8", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null,
              "No completed sales recorded in this date range."
            )}
          </div>
        </ChartCard>

        {/* Top-Selling Products Bar Chart */}
        <ChartCard
          icon={<PackageSearch className="h-4.5 w-4.5" />}
          title="Top-demand products"
          description="Total units sold ranked by SKU volume"
        >
          <div className="h-[300px]">
            {chartState(
              topProducts.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProducts}
                    layout="vertical"
                    margin={{ left: 10, right: 15, top: 12, bottom: 0 }}
                  >
                    <CartesianGrid stroke="currentColor" className="opacity-10" horizontal={false} />
                    <XAxis
                      type="number"
                      tick={{ fill: "currentColor", fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={120}
                      tick={{ fill: "currentColor", fontSize: 11 }}
                      className="text-foreground font-semibold"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [`${value} units`, "Units Sold"]}
                      contentStyle={{
                        borderRadius: 14,
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null,
              "No product sales transactions recorded in this period."
            )}
          </div>
        </ChartCard>

        {/* Stock Level Trend */}
        <ChartCard
          icon={<BarChart3 className="h-4.5 w-4.5" />}
          title="Net inventory movement"
          description="Net daily delta across all warehouse movements"
        >
          <div className="h-[300px]">
            {chartState(
              stockData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockData} margin={{ left: -10, right: 10, top: 12, bottom: 0 }}>
                    <CartesianGrid stroke="currentColor" className="opacity-10" vertical={false} />
                    <XAxis
                      dataKey="date"
                      tick={{ fill: "currentColor", fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "currentColor", fontSize: 11 }}
                      className="text-muted-foreground"
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: number) => [
                        `${value > 0 ? "+" : ""}${value} units`,
                        "Net Movement",
                      ]}
                      contentStyle={{
                        borderRadius: 14,
                        backgroundColor: "var(--card)",
                        color: "var(--foreground)",
                        border: "1px solid var(--border)",
                        boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
                        fontSize: 12,
                        fontWeight: 600,
                      }}
                    />
                    <Bar dataKey="netMovement" fill="#4f46e5" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : null,
              "No inventory adjustments recorded in this period."
            )}
          </div>
        </ChartCard>

        {/* Operational Note Card */}
        <section className="surface-card p-6 sm:p-7">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-400">
                <CalendarDays className="h-3.5 w-3.5" />
                <span>Executive Summary</span>
              </div>
              <h2 className="mt-4 font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Grounded in verifiable operational activity.
              </h2>
              <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                All metrics, graphs, and volume velocity streams calculate directly from immutable
                database ledgers. Use the date filters above to analyze seasonal demand, evaluate
                supplier restock speeds, or prepare financial reports.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-border/80 bg-muted/40 p-4 dark:border-white/[0.06] dark:bg-white/[0.02]">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Active Analysis Range
              </p>
              <p className="mt-1 font-mono text-xs font-bold text-foreground">
                {new Date(`${dateFrom}T00:00:00`).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                —{" "}
                {new Date(`${dateTo}T00:00:00`).toLocaleDateString(undefined, {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}

function ChartCard({
  icon,
  title,
  description,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card p-6">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <h2 className="font-display text-base font-bold text-foreground">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function Loading() {
  return (
    <div className="flex h-full items-center justify-center text-xs font-semibold text-muted-foreground">
      <RefreshCw className="mr-2 h-4 w-4 animate-spin text-primary" />
      Loading analytics…
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-center text-xs font-medium text-muted-foreground">
      {text}
    </div>
  );
}

function ReportError({ retry }: { retry: () => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <AlertCircle className="h-6 w-6 text-rose-500" />
      <p className="text-xs font-semibold text-foreground">Failed to render this chart dataset.</p>
      <Button
        size="sm"
        variant="outline"
        onClick={retry}
        className="h-8 rounded-xl border-border text-xs font-bold text-foreground hover:bg-muted"
      >
        Retry
      </Button>
    </div>
  );
}
