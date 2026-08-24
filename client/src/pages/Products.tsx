import { EmptyTable, PageHeader, StatusPill, TablePagination } from "@/components/AppPrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownUp,
  Edit3,
  Package,
  PackagePlus,
  Search,
  SlidersHorizontal,
  Trash2,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const money = (value: number | string) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value));

const blank = { name: "", sku: "", category: "", price: "", quantity: "0", supplierId: "" };

export default function Products() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"createdAt" | "name" | "sku" | "category" | "price" | "quantity">("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [form, setForm] = useState(blank);
  const [editing, setEditing] = useState<any>(null);
  const [open, setOpen] = useState(false);

  const input = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      category: category || undefined,
      lowStockOnly,
      sortBy,
      sortDirection,
    }),
    [page, search, category, lowStockOnly, sortBy, sortDirection]
  );

  const { data, isLoading } = trpc.products.list.useQuery(input);
  const { data: categories } = trpc.products.categories.useQuery();
  const { data: suppliers } = trpc.suppliers.list.useQuery({
    page: 1,
    pageSize: 100,
    sortBy: "name",
    sortDirection: "asc",
  });
  const utils = trpc.useUtils();

  const create = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Product created successfully");
      close();
      utils.products.list.invalidate();
      utils.insights.dashboard.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const update = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Product updated successfully");
      close();
      utils.products.list.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  const remove = trpc.products.remove.useMutation({
    onSuccess: () => {
      toast.success("Product removed from catalogue");
      utils.products.list.invalidate();
      utils.insights.dashboard.invalidate();
    },
    onError: error => toast.error(error.message),
  });

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: Number(form.price),
      supplierId: form.supplierId ? Number(form.supplierId) : null,
    };
    if (editing) update.mutate({ id: editing.id, ...payload });
    else create.mutate({ ...payload, quantity: Number(form.quantity) });
  }

  function toggleSort(key: typeof sortBy) {
    if (sortBy === key) {
      setSortDirection(current => (current === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
    setPage(1);
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Catalogue"
        title="Product inventory"
        description="Manage product variants, supplier contracts, unit pricing, and real-time inventory levels."
        actions={
          canManage ? (
            <Button
              onClick={() => setOpen(true)}
              className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
            >
              <PackagePlus className="mr-2 h-4 w-4" />
              Add product
            </Button>
          ) : undefined
        }
      />

      <section className="surface-card overflow-hidden">
        {/* Filters Bar */}
        <div className="flex flex-col gap-3.5 border-b border-border/70 p-4.5 sm:p-5 lg:flex-row lg:items-center lg:justify-between dark:border-white/[0.06]">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search product name, SKU, or category…"
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
              value={category}
              onChange={e => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="field-select w-auto min-w-[150px]"
            >
              <option value="">All categories</option>
              {categories?.map(item => (
                <option key={item.category} value={item.category}>
                  {item.category}
                </option>
              ))}
            </select>

            <Button
              variant={lowStockOnly ? "default" : "outline"}
              onClick={() => {
                setLowStockOnly(value => !value);
                setPage(1);
              }}
              className={`h-10.5 rounded-xl text-xs font-bold transition-colors ${
                lowStockOnly
                  ? "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-500"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              <SlidersHorizontal className="mr-2 h-3.5 w-3.5" />
              {lowStockOnly ? "Low stock filtered" : "Low stock filter"}
            </Button>
          </div>
        </div>

        {/* Product Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[900px]">
            <thead>
              <tr>
                {[
                  ["name", "Product name"],
                  ["sku", "SKU"],
                  ["category", "Category"],
                  ["price", "Unit price"],
                  ["quantity", "In stock"],
                ].map(([key, label]) => (
                  <th key={key}>
                    <button
                      onClick={() => toggleSort(key as typeof sortBy)}
                      className="inline-flex items-center gap-1.5 font-bold transition-colors hover:text-foreground"
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
                <th>Supplier</th>
                <th>Status</th>
                {canManage ? <th className="text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="py-14 text-center text-muted-foreground">
                    Loading product inventory…
                  </td>
                </tr>
              ) : data?.items.length ? (
                data.items.map(product => (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted font-display text-xs font-bold text-foreground">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{product.name}</p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Updated {new Date(product.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="rounded-md border border-border bg-muted/50 px-2 py-1 font-mono text-xs font-bold text-foreground dark:bg-white/[0.04]">
                        {product.sku}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-medium text-foreground">{product.category}</span>
                    </td>
                    <td>
                      <span className="font-display font-bold text-foreground">
                        {money(product.price)}
                      </span>
                    </td>
                    <td>
                      <span className="font-display text-sm font-bold text-foreground">
                        {product.quantity}
                      </span>
                    </td>
                    <td>
                      {product.supplierName ? (
                        <span className="text-xs font-medium text-foreground">
                          {product.supplierName}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <StatusPill
                        tone={
                          product.quantity === 0
                            ? "danger"
                            : product.isLowStock
                            ? "warning"
                            : "success"
                        }
                      >
                        {product.quantity === 0
                          ? "Out of stock"
                          : product.isLowStock
                          ? "Low stock"
                          : "Healthy"}
                      </StatusPill>
                    </td>
                    {canManage ? (
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              setEditing(product);
                              setForm({
                                name: product.name,
                                sku: product.sku,
                                category: product.category,
                                price: String(product.price),
                                quantity: String(product.quantity),
                                supplierId: product.supplierId ? String(product.supplierId) : "",
                              });
                              setOpen(true);
                            }}
                            title="Edit product"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                            onClick={() => {
                              if (confirm(`Remove ${product.name}? This action cannot be undone.`)) {
                                remove.mutate({ id: product.id });
                              }
                            }}
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    ) : null}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="p-0">
                    <EmptyTable
                      title="No products found"
                      description="Try adjusting your search terms or filter criteria, or add your first product."
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

      {/* Add / Edit Product Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <form
            onSubmit={submit}
            className="surface-card max-h-[90vh] w-full max-w-lg overflow-y-auto p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border/70 pb-4 dark:border-white/[0.06]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Catalogue
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                  {editing ? "Edit product" : "Add new product"}
                </h2>
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

            <div className="mt-6 grid gap-4.5 sm:grid-cols-2">
              <label className="sm:col-span-2">
                <span className="field-label">Product name</span>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Premium Wireless Headphones"
                  className="field-input"
                />
              </label>

              <label>
                <span className="field-label">SKU Identifier</span>
                <input
                  required
                  value={form.sku}
                  onChange={e => setForm({ ...form, sku: e.target.value.toUpperCase() })}
                  placeholder="e.g. HDPH-PRO-01"
                  className="field-input font-mono"
                />
              </label>

              <label>
                <span className="field-label">Category</span>
                <input
                  required
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Electronics"
                  className="field-input"
                />
              </label>

              <label>
                <span className="field-label">Unit price ($)</span>
                <input
                  required
                  min="0"
                  step="0.01"
                  type="number"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  placeholder="0.00"
                  className="field-input"
                />
              </label>

              {!editing ? (
                <label>
                  <span className="field-label">Initial quantity</span>
                  <input
                    required
                    min="0"
                    type="number"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    placeholder="0"
                    className="field-input"
                  />
                </label>
              ) : null}

              <label className="sm:col-span-2">
                <span className="field-label">Assigned supplier</span>
                <select
                  value={form.supplierId}
                  onChange={e => setForm({ ...form, supplierId: e.target.value })}
                  className="field-select"
                >
                  <option value="">No supplier assigned</option>
                  {suppliers?.items.map(supplier => (
                    <option key={supplier.id} value={supplier.id}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </label>
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
                disabled={create.isPending || update.isPending}
                className="h-10 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
              >
                {create.isPending || update.isPending
                  ? "Saving…"
                  : editing
                  ? "Save changes"
                  : "Create product"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
