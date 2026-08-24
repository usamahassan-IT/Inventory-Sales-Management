import { EmptyTable, PageHeader, TablePagination } from "@/components/AppPrimitives";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowDownUp,
  Building2,
  Edit3,
  Mail,
  Package,
  Phone,
  Plus,
  Search,
  Trash2,
  User,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

const blank = { name: "", contactName: "", email: "", phone: "", address: "" };

export default function Suppliers() {
  const { user } = useAuth();
  const canManage = user?.role === "admin" || user?.role === "manager";
  const [search, setSearch] = useState("");
  const [relationship, setRelationship] = useState<"all" | "withProducts" | "withoutProducts">("all");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"name" | "contactName" | "createdAt">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(blank);

  const input = useMemo(
    () => ({
      page,
      pageSize: 10,
      search: search || undefined,
      relationship,
      sortBy,
      sortDirection,
    }),
    [page, search, relationship, sortBy, sortDirection]
  );

  const { data, isLoading } = trpc.suppliers.list.useQuery(input);
  const utils = trpc.useUtils();

  const create = trpc.suppliers.create.useMutation({
    onSuccess: () => {
      toast.success("Supplier partner added successfully");
      close();
      utils.suppliers.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const update = trpc.suppliers.update.useMutation({
    onSuccess: () => {
      toast.success("Supplier partner updated successfully");
      close();
      utils.suppliers.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  const remove = trpc.suppliers.remove.useMutation({
    onSuccess: () => {
      toast.success("Supplier removed from directory");
      utils.suppliers.list.invalidate();
    },
    onError: e => toast.error(e.message),
  });

  function close() {
    setOpen(false);
    setEditing(null);
    setForm(blank);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const values = {
      ...form,
      contactName: form.contactName || null,
      email: form.email || null,
      phone: form.phone || null,
      address: form.address || null,
    };
    if (editing) update.mutate({ id: editing.id, ...values });
    else create.mutate(values);
  }

  function sort(key: typeof sortBy) {
    if (sortBy === key) {
      setSortDirection(v => (v === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDirection("asc");
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Partner directory"
        title="Suppliers & Vendors"
        description="Maintain authorized vendor credentials, primary points of contact, and linked inventory lines."
        actions={
          canManage ? (
            <Button
              onClick={() => setOpen(true)}
              className="h-10 rounded-xl bg-primary px-4 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add supplier
            </Button>
          ) : undefined
        }
      />

      <section className="surface-card overflow-hidden">
        {/* Filter controls */}
        <div className="flex flex-col gap-3.5 border-b border-border/70 p-4.5 sm:p-5 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
          <div className="relative max-w-md flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-3.5 h-4 w-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search supplier, contact, or email…"
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

          <select
            value={relationship}
            onChange={e => {
              setRelationship(e.target.value as typeof relationship);
              setPage(1);
            }}
            className="field-select w-auto min-w-[160px]"
          >
            <option value="all">All suppliers</option>
            <option value="withProducts">With products</option>
            <option value="withoutProducts">Without products</option>
          </select>
        </div>

        {/* Suppliers Table */}
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[920px]">
            <thead>
              <tr>
                {[
                  ["name", "Supplier partner"],
                  ["contactName", "Primary contact"],
                ].map(([key, label]) => (
                  <th key={key}>
                    <button
                      className="inline-flex items-center gap-1.5 font-bold transition-colors hover:text-foreground"
                      onClick={() => sort(key as typeof sortBy)}
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
                <th>Contact details</th>
                <th>Associated products</th>
                <th>Joined</th>
                {canManage ? <th className="text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={canManage ? 6 : 5} className="py-14 text-center text-muted-foreground">
                    Loading suppliers…
                  </td>
                </tr>
              ) : data?.items.length ? (
                data.items.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted font-display text-xs font-bold text-foreground">
                          <Building2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{item.name}</p>
                          {item.address ? (
                            <p className="mt-0.5 max-w-xs truncate text-[11px] text-muted-foreground">
                              {item.address}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td>
                      {item.contactName ? (
                        <div className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{item.contactName}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/60">Not specified</span>
                      )}
                    </td>
                    <td>
                      <div>
                        {item.email ? (
                          <div className="flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="text-xs font-medium text-foreground">{item.email}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                        {item.phone ? (
                          <div className="mt-0.5 flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            <span>{item.phone}</span>
                          </div>
                        ) : null}
                      </div>
                    </td>
                    <td>
                      <div>
                        <span className="inline-flex items-center gap-1 rounded-md border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-xs font-bold text-blue-700 dark:border-blue-400/20 dark:bg-blue-400/10 dark:text-blue-300">
                          <Package className="h-3 w-3" />
                          {item.productCount} product{Number(item.productCount) === 1 ? "" : "s"}
                        </span>
                        <p className="mt-1 max-w-72 truncate text-xs text-muted-foreground">
                          {item.productNames || "No linked products"}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    {canManage ? (
                      <td>
                        <div className="flex justify-end gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                            onClick={() => {
                              setEditing(item);
                              setForm({
                                name: item.name,
                                contactName: item.contactName || "",
                                email: item.email || "",
                                phone: item.phone || "",
                                address: item.address || "",
                              });
                              setOpen(true);
                            }}
                            title="Edit supplier"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                            onClick={() => {
                              if (confirm(`Remove ${item.name}? This will unassign linked products.`)) {
                                remove.mutate({ id: item.id });
                              }
                            }}
                            title="Delete supplier"
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
                  <td colSpan={canManage ? 6 : 5} className="p-0">
                    <EmptyTable
                      title="No suppliers found"
                      description="Update your search keywords or filter criteria, or add a new supplier partner."
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

      {/* Add / Edit Supplier Modal */}
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
          <form
            onSubmit={submit}
            className="surface-card w-full max-w-lg p-6 sm:p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-border/70 pb-4 dark:border-white/[0.06]">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  Partner directory
                </p>
                <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                  {editing ? "Edit supplier partner" : "Add supplier partner"}
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
                <span className="field-label">Supplier entity name</span>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Apex Industrial Global"
                  className="field-input"
                />
              </label>

              <label>
                <span className="field-label">Primary contact name</span>
                <input
                  value={form.contactName}
                  onChange={e => setForm({ ...form, contactName: e.target.value })}
                  placeholder="e.g. Sarah Jenkins"
                  className="field-input"
                />
              </label>

              <label>
                <span className="field-label">Contact phone</span>
                <input
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value })}
                  placeholder="+1 (555) 019-2834"
                  className="field-input font-mono"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="field-label">Contact email</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="vendor-desk@apex-global.io"
                  className="field-input"
                />
              </label>

              <label className="sm:col-span-2">
                <span className="field-label">Facility / HQ Address</span>
                <textarea
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  placeholder="Street address, city, state, zip code…"
                  className="min-h-20 w-full rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-white/10 dark:bg-muted/40 dark:focus:border-indigo-400"
                />
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
                  : "Create supplier"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
