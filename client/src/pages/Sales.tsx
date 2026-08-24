import { EmptyTable, PageHeader, StatusPill, TablePagination } from "@/components/AppPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownUp,
  Minus,
  Plus,
  ReceiptText,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));

type Line = { productId: string; quantity: string; unitPrice: string };
const initialLine: Line = { productId: "", quantity: "1", unitPrice: "" };

export default function Sales() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"saleDate" | "reference" | "totalAmount" | "staff">("saleDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [open, setOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [lines, setLines] = useState<Line[]>([{ ...initialLine }]);

  const input = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      sortBy,
      sortDirection,
      dateFrom: dateFrom ? new Date(`${dateFrom}T00:00:00`) : undefined,
      dateTo: dateTo ? new Date(`${dateTo}T23:59:59`) : undefined,
    }),
    [page, search, sortBy, sortDirection, dateFrom, dateTo]
  );

  const { data, isLoading } = trpc.sales.list.useQuery(input);
  const { data: products } = trpc.products.list.useQuery({
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDirection: "asc",
  });
  const utils = trpc.useUtils();

  const create = trpc.sales.create.useMutation({
    onSuccess: result => {
      toast.success(`Transaction ${result.reference} completed`);
      close();
      utils.sales.list.invalidate();
      utils.products.list.invalidate();
      utils.stock.list.invalidate();
      utils.insights.dashboard.invalidate();
      utils.insights.reports.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  function close() {
    setOpen(false);
    setCustomerName("");
    setLines([{ ...initialLine }]);
  }

  function updateLine(index: number, patch: Partial<Line>) {
    setLines(items =>
      items.map((line, lineIndex) => (lineIndex === index ? { ...line, ...patch } : line))
    );
  }

  function addLine() {
    setLines(items => [...items, { ...initialLine }]);
  }

  function removeLine(index: number) {
    setLines(items =>
      items.length > 1 ? items.filter((_, lineIndex) => lineIndex !== index) : items
    );
  }

  function selectedProduct(id: string) {
    return products?.items.find(item => item.id === Number(id));
  }

  const estimatedTotal = useMemo(() => {
    return lines.reduce((acc, line) => {
      if (!line.productId || !line.quantity) return acc;
      const product = selectedProduct(line.productId);
      const price = line.unitPrice ? Number(line.unitPrice) : product ? Number(product.price) : 0;
      return acc + price * Number(line.quantity);
    }, 0);
  }, [lines, products]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (lines.some(line => !line.productId || !line.quantity)) {
      toast.error("Please choose a product and enter a valid quantity for each row.");
      return;
    }
    create.mutate({
      customerName: customerName || null,
      items: lines.map(line => ({
        productId: Number(line.productId),
        quantity: Number(line.quantity),
        ...(line.unitPrice ? { unitPrice: Number(line.unitPrice) } : {}),
      })),
    });
  }

  function toggleSort(key: typeof sortBy) {
    if (sortBy === key) {
      setSortDirection(value => (value === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Transaction ledger"
        title="Sales & POS"
        description="Process point-of-sale customer checkouts with real-time stock deduction and full audit records."
        actions={
          <Button
            onClick={() => setOpen(true)}
            className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
          >
            <ShoppingCart className="mr-2 h-4 w-4" />
            New Transaction
          </Button>
        }
      />

      <section className="surface-card overflow-hidden">
        {/* Filter controls */}
        <div className="flex flex-col gap-3.5 border-b border-border/70 p-4.5 sm:p-5 xl:flex-row xl:items-center xl:justify-between dark:border-white/[0.06]">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search reference, customer, or staff…"
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
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateFrom}
                onChange={e => {
                  setDateFrom(e.target.value);
                  setPage(1);
                }}
                className="field-input w-auto text-xs"
                aria-label="Sales from date"
              />
              <span className="text-xs font-bold text-muted-foreground">to</span>
              <input
                type="date"
                value={dateTo}
                onChange={e => {
                  setDateTo(e.target.value);
                  setPage(1);
                }}
                className="field-input w-auto text-xs"
                aria-label="Sales to date"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => setSortDirection(value => (value === "asc" ? "desc" : "asc"))}
              className="h-10.5 rounded-xl border-border bg-card text-xs font-bold text-foreground hover:bg-muted"
            >
              <ArrowDownUp className="mr-2 h-3.5 w-3.5" />
              Sort: {sortDirection === "asc" ? "Oldest first" : "Newest first"}
            </Button>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[780px]">
            <thead>
              <tr>
                {[
                  ["reference", "Reference ID"],
                  ["saleDate", "Sale date & time"],
                  ["staff", "Recorded by"],
                  ["totalAmount", "Total amount"],
                ].map(([key, label]) => (
                  <th key={key}>
                    <button
                      className="inline-flex items-center gap-1.5 font-bold transition-colors hover:text-foreground"
                      onClick={() => toggleSort(key as typeof sortBy)}
                    >
                      {label}
                      <ArrowDownUp
                        className={`h-3 w-3 ${
                          sortBy === key ? "text-primary" : "opacity-40"
                        }`}
                      />
                    </button>
                  </th>
                ))}
                <th>Customer</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-muted-foreground">
                    Loading sales transactions…
                  </td>
                </tr>
              ) : data?.items.length ? (
                data.items.map(sale => (
                  <tr key={sale.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500/10 font-mono text-[10px] font-bold text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300">
                          TX
                        </div>
                        <span className="font-mono text-xs font-bold text-foreground">
                          {sale.reference}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div>
                        <p className="font-medium text-foreground">
                          {new Date(sale.saleDate).toLocaleDateString()}
                        </p>
                        <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">
                          {new Date(sale.saleDate).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-foreground">{sale.staffName}</span>
                    </td>
                    <td>
                      <span className="font-display font-bold text-foreground">
                        {money(sale.totalAmount)}
                      </span>
                    </td>
                    <td>
                      {sale.customerName ? (
                        <span className="text-xs font-medium text-foreground">{sale.customerName}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Walk-in customer</span>
                      )}
                    </td>
                    <td>
                      <StatusPill tone="success">Complete</StatusPill>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-0">
                    <EmptyTable
                      title="No sales transactions recorded"
                      description="Adjust your date filters or process your first transaction to populate the ledger."
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

      {/* POS Checkout Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <form
            onSubmit={submit}
            className="surface-card max-h-[90vh] w-full max-w-3xl overflow-y-auto p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border/70 pb-4 dark:border-white/[0.06]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Point of sale
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                  Record new sale
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Inventory balances update automatically once the transaction is saved.
                </p>
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                onClick={close}
                className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <label className="mt-6 block max-w-md">
              <span className="field-label">
                Customer identifier / Name <span className="font-normal text-muted-foreground/70">(optional)</span>
              </span>
              <input
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Walk-in customer"
                className="field-input"
              />
            </label>

            {/* Line Items Table */}
            <div className="mt-6 overflow-hidden rounded-2xl border border-border/80 dark:border-white/[0.08]">
              <div className="grid grid-cols-[minmax(210px,1fr)_90px_110px_36px] gap-3 bg-muted/50 px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground dark:bg-muted/30">
                <span>Product</span>
                <span>Quantity</span>
                <span>Unit price</span>
                <span />
              </div>
              <div className="divide-y divide-border/60 dark:divide-white/[0.04]">
                {lines.map((line, index) => {
                  const product = selectedProduct(line.productId);
                  return (
                    <div
                      key={index}
                      className="grid grid-cols-[minmax(210px,1fr)_90px_110px_36px] items-center gap-3 p-3.5"
                    >
                      <select
                        required
                        value={line.productId}
                        onChange={e => updateLine(index, { productId: e.target.value })}
                        className="field-select"
                      >
                        <option value="">Choose catalogue item…</option>
                        {products?.items.map(item => (
                          <option key={item.id} value={item.id} disabled={item.quantity === 0}>
                            {item.name} ({item.quantity} available) — {money(item.price)}
                          </option>
                        ))}
                      </select>
                      <input
                        required
                        min="1"
                        max={product?.quantity ?? undefined}
                        type="number"
                        value={line.quantity}
                        onChange={e => updateLine(index, { quantity: e.target.value })}
                        className="field-input"
                      />
                      <input
                        min="0"
                        step="0.01"
                        type="number"
                        value={line.unitPrice}
                        placeholder={product ? String(product.price) : "0.00"}
                        onChange={e => updateLine(index, { unitPrice: e.target.value })}
                        className="field-input"
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        disabled={lines.length === 1}
                        onClick={() => removeLine(index)}
                        className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 disabled:opacity-30"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addLine}
                className="h-9 rounded-xl border-border text-xs font-bold text-foreground hover:bg-muted"
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add line item
              </Button>

              <div className="text-right">
                <span className="text-xs text-muted-foreground">Estimated Total: </span>
                <span className="font-display text-lg font-bold text-foreground">
                  {money(estimatedTotal)}
                </span>
              </div>
            </div>

            <div className="mt-7 flex items-center justify-end gap-2.5 border-t border-border/70 pt-4 dark:border-white/[0.06]">
              <Button
                type="button"
                variant="outline"
                onClick={close}
                className="h-10 rounded-xl border-border px-4 text-xs font-bold text-foreground hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                disabled={create.isPending}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
              >
                <ReceiptText className="mr-2 h-4 w-4" />
                {create.isPending ? "Processing…" : "Complete sale"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
