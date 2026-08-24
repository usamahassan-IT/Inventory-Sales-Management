import { EmptyTable, PageHeader, StatusPill, TablePagination } from "@/components/AppPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownToLine,
  ArrowDownUp,
  ArrowUpToLine,
  Plus,
  Search,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const blank = { productId: "", direction: "inbound", quantity: "", reason: "", notes: "" };

export default function Stock() {
  const [search, setSearch] = useState("");
  const [direction, setDirection] = useState("");
  const [page, setPage] = useState(1);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(blank);

  const input = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      direction: direction ? (direction as "inbound" | "outbound") : undefined,
      sortBy: "occurredAt" as const,
      sortDirection,
    }),
    [page, search, direction, sortDirection]
  );

  const { data, isLoading } = trpc.stock.list.useQuery(input);
  const { data: products } = trpc.products.list.useQuery({
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDirection: "asc",
  });
  const utils = trpc.useUtils();

  const create = trpc.stock.create.useMutation({
    onSuccess: result => {
      toast.success(`Stock balance adjusted — ${result.quantityAfter} units available`);
      setOpen(false);
      setForm(blank);
      utils.stock.list.invalidate();
      utils.products.list.invalidate();
      utils.insights.dashboard.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    create.mutate({
      productId: Number(form.productId),
      direction: form.direction as "inbound" | "outbound",
      quantity: Number(form.quantity),
      reason: form.reason,
      notes: form.notes || null,
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Inventory control"
        title="Stock activity"
        description="Maintain a real-time audit trail of inbound receipts, warehouse restocks, and outbound balance adjustments."
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Record movement
          </Button>
        }
      />

      <section className="surface-card overflow-hidden">
        {/* Filter controls */}
        <div className="flex flex-col gap-3.5 border-b border-border/70 p-4.5 sm:p-5 lg:flex-row lg:items-center lg:justify-between dark:border-white/[0.06]">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, SKU, or reason…"
              className="field-input pl-10"
            />
            {search ? (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <select
              value={direction}
              onChange={e => {
                setDirection(e.target.value);
                setPage(1);
              }}
              className="field-select w-auto min-w-[150px]"
            >
              <option value="">All movement types</option>
              <option value="inbound">Inbound (+ stock)</option>
              <option value="outbound">Outbound (− stock)</option>
            </select>

            <Button
              variant="outline"
              onClick={() => setSortDirection(value => (value === "asc" ? "desc" : "asc"))}
              className="h-10.5 rounded-xl border-border bg-card text-xs font-bold text-foreground hover:bg-muted"
            >
              <ArrowDownUp className="mr-2 h-3.5 w-3.5" />
              {sortDirection === "asc" ? "Oldest first" : "Newest first"}
            </Button>
          </div>
        </div>

        {/* Audit Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[850px]">
            <thead>
              <tr>
                <th>Movement</th>
                <th>Product</th>
                <th>Reason / Notes</th>
                <th>Quantity</th>
                <th>Balance change</th>
                <th>Recorded by</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-muted-foreground">
                    Loading stock activity log…
                  </td>
                </tr>
              ) : data?.items.length ? (
                data.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <StatusPill tone={item.direction === "inbound" ? "success" : "warning"}>
                        {item.direction === "inbound" ? (
                          <>
                            <ArrowUpToLine className="mr-1 h-3.5 w-3.5 text-blue-500" />
                            Inbound
                          </>
                        ) : (
                          <>
                            <ArrowDownToLine className="mr-1 h-3.5 w-3.5 text-amber-500" />
                            Outbound
                          </>
                        )}
                      </StatusPill>
                    </td>
                    <td>
                      <div>
                        <p className="font-bold text-foreground">{item.productName}</p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {item.sku}
                        </p>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-semibold text-foreground">{item.reason}</p>
                        <p className="mt-0.5 max-w-xs truncate text-xs text-muted-foreground">
                          {item.notes || "No notes recorded"}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span
                        className={`font-display text-sm font-bold ${
                          item.direction === "inbound"
                            ? "text-blue-600 dark:text-blue-400"
                            : "text-amber-600 dark:text-amber-400"
                        }`}
                      >
                        {item.direction === "inbound" ? "+" : "−"}
                        {item.quantity}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="text-muted-foreground">{item.quantityBefore}</span>
                        <span className="text-muted-foreground/60">→</span>
                        <span className="font-bold text-foreground">{item.quantityAfter}</span>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-foreground">
                        {item.staffName || "System automated"}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(item.occurredAt).toLocaleDateString()}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-0">
                    <EmptyTable
                      title="No stock movements recorded"
                      description="Record an inbound delivery or stock adjustment to establish an auditable movement trail."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {data ? (
          <TablePagination
            page={data.page}
            pageCount={data.pageCount}
            total={data.total}
            pageSize={data.pageSize}
            onPageChange={setPage}
          />
        ) : null}
      </section>

      {/* Record Movement Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <form
            onSubmit={submit}
            className="surface-card w-full max-w-lg p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border/70 pb-4 dark:border-white/[0.06]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Inventory control
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                  Record stock movement
                </h2>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={() => setOpen(false)}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-6 grid gap-4.5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="field-label">Target product</span>
                <select
                  required
                  value={form.productId}
                  onChange={e => setForm({ ...form, productId: e.target.value })}
                  className="field-select"
                >
                  <option value="">Select catalogue product…</option>
                  {products?.items.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.quantity} units currently in stock)
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="field-label">Direction</span>
                <select
                  value={form.direction}
                  onChange={e => setForm({ ...form, direction: e.target.value })}
                  className="field-select"
                >
                  <option value="inbound">Inbound (+ Add Stock)</option>
                  <option value="outbound">Outbound (− Remove Stock)</option>
                </select>
              </label>

              <label>
                <span className="field-label">Quantity</span>
                <input
                  required
                  min="1"
                  type="number"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  placeholder="1"
                  className="field-input"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="field-label">Reason / Reference</span>
                <input
                  required
                  value={form.reason}
                  onChange={e => setForm({ ...form, reason: e.target.value })}
                  placeholder="e.g. Supplier Restock, Warehouse Count Correction, Damaged Item"
                  className="field-input"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="field-label">Additional notes (optional)</span>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  placeholder="Add batch numbers, container tags, or delivery notes…"
                  className="min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-muted/40 dark:focus:border-indigo-400"
                />
              </label>
            </div>

            <div className="mt-7 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4 dark:border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                className="h-10 rounded-xl border-border px-4 text-xs font-bold text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                disabled={create.isPending}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
              >
                {create.isPending ? "Saving…" : "Save movement"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
