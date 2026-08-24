import { MetricCard, PageHeader, StatusPill } from "@/components/AppPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  Package,
  PackageCheck,
  ReceiptText,
  Sparkles,
} from "lucide-react";
import { useLocation } from "wouter";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value));

export default function Dashboard() {
  const [, navigate] = useLocation();
  const { data, isLoading, isError, refetch } = trpc.insights.dashboard.useQuery();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-border/80 bg-card p-6.5 shadow-sm sm:p-8 dark:border-white/[0.08]">
        <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-400">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Real-Time Inventory & POS Intelligence</span>
            </div>
            <h1 className="mt-3.5 font-display text-3xl sm:text-4xl font-black tracking-tight text-foreground">
              Command & Control Nexus
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Live telemetry monitoring inventory levels, real-time POS receipts, restock movements, and supplier operations.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Button
              onClick={() => navigate("/sales")}
              className="h-11 rounded-2xl bg-primary px-5 text-sm font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90"
            >
              <ReceiptText className="mr-2 h-4 w-4" />
              POS Checkout
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/stock")}
              className="h-11 rounded-2xl border-border bg-card px-5 text-sm font-bold text-foreground shadow-xs hover:bg-muted"
            >
              <Boxes className="mr-2 h-4 w-4" />
              Record Movement
            </Button>
          </div>
        </div>
      </div>

      {isError ? (
        <section
          role="alert"
          className="flex flex-col gap-3.5 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4.5 text-sm text-rose-700 sm:flex-row sm:items-center sm:justify-between dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-300"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-300">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-bold">Operational summary is temporarily unavailable.</p>
              <p className="mt-0.5 text-xs opacity-90">
                Your data was not changed. Retry the request to refresh the dashboard.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => refetch()}
            className="w-fit rounded-xl border-rose-500/30 bg-card text-rose-700 hover:bg-rose-500/10 dark:text-rose-300"
          >
            Retry dashboard
          </Button>
        </section>
      ) : null}

      {/* KPI Cards */}
      <section className="grid gap-4.5 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Product catalogue"
          title="Product catalogue"
          value={isLoading ? "—" : String(data?.totalProducts ?? 0)}
          detail="Active SKUs under management"
          note="Active SKUs under management"
          tone="indigo"
          icon={<Package className="h-5 w-5" />}
        />
        <MetricCard
          label="Sales revenue"
          title="Sales revenue"
          value={isLoading ? "—" : money(data?.totalSalesRevenue ?? 0)}
          detail={`${data?.transactionCount ?? 0} completed transactions`}
          note={`${data?.transactionCount ?? 0} completed transactions`}
          tone="blue"
          icon={<CircleDollarSign className="h-5 w-5" />}
        />
        <MetricCard
          label="Low-stock watch"
          title="Low-stock watch"
          value={isLoading ? "—" : String(data?.lowStockCount ?? 0)}
          detail={`At or below the ${data?.lowStockThreshold ?? 0}-unit alert line`}
          note={`At or below the ${data?.lowStockThreshold ?? 0}-unit alert line`}
          tone={data?.lowStockCount ? "amber" : "neutral"}
          icon={<AlertTriangle className="h-5 w-5" />}
        />
        <MetricCard
          label="Today’s pace"
          title="Today’s pace"
          value={isLoading ? "—" : String(data?.transactionCount ?? 0)}
          detail="Transactions in the current view"
          note="Transactions in the current view"
          tone="indigo"
          icon={<ReceiptText className="h-5 w-5" />}
        />
      </section>

      {/* Split Activity Feed */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Recent Transactions */}
        <div className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 p-5 dark:border-white/[0.06]">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Recent transactions</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Latest recorded sales activity</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/sales")}
              className="rounded-xl text-xs font-bold text-primary hover:bg-primary/10"
            >
              View ledger
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="divide-y divide-border/60 dark:divide-white/[0.04]">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Loading transactions…</div>
            ) : data?.recentTransactions.length ? (
              data.recentTransactions.map(sale => (
                <div
                  key={sale.id}
                  className="flex items-center justify-between gap-4 p-4.5 transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 font-mono text-xs font-bold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
                      TX
                    </div>
                    <div>
                      <p className="font-mono text-xs font-bold text-foreground">{sale.reference}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {sale.customerName || "Walk-in customer"} ·{" "}
                        {new Date(sale.saleDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="font-display text-base font-bold text-foreground">
                    {money(sale.totalAmount)}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400">
                  <ReceiptText className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">Start the day’s ledger</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Record a completed sale to see live transaction activity here.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate("/sales")}
                  className="mt-3.5 rounded-xl border-border text-xs font-bold text-foreground hover:bg-muted"
                >
                  Record a sale
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Radar */}
        <aside className="surface-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border/70 p-5 dark:border-white/[0.06]">
            <div>
              <h2 className="font-display text-lg font-bold text-foreground">Needs attention</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">Inventory at or below the alert threshold</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/products")}
              className="rounded-xl text-xs font-bold text-primary hover:bg-primary/10"
            >
              Review all
            </Button>
          </div>

          <div className="divide-y divide-border/60 dark:divide-white/[0.04]">
            {isLoading ? (
              <div className="p-6 text-sm text-muted-foreground">Checking stock levels…</div>
            ) : data?.lowStockProducts.length ? (
              data.lowStockProducts.map(product => (
                <div
                  key={product.id}
                  className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-muted/40 dark:hover:bg-white/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{product.name}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                      {product.sku}
                    </p>
                  </div>
                  <StatusPill tone={product.quantity === 0 ? "danger" : "warning"}>
                    {product.quantity} units left
                  </StatusPill>
                </div>
              ))
            ) : (
              <div className="flex min-h-48 flex-col items-center justify-center p-8 text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:bg-blue-400/15 dark:text-blue-400">
                  <PackageCheck className="h-5 w-5" />
                </div>
                <p className="mt-3 text-sm font-bold text-foreground">Inventory is healthy</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Every product is currently stocked above configured alert lines.
                </p>
              </div>
            )}
          </div>
        </aside>
      </section>
    </div>
  );
}
