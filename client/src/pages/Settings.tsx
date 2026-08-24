import { PageHeader, StatusPill, TablePagination } from "@/components/AppPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  AlertTriangle,
  Crown,
  Save,
  Shield,
  ShieldCheck,
  UserCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function Settings() {
  const { data: setting } = trpc.settings.get.useQuery();
  const [threshold, setThreshold] = useState("");

  useEffect(() => {
    if (setting) setThreshold(String(setting.lowStockThreshold));
  }, [setting]);

  const { data: users, isLoading } = trpc.users.list.useQuery({
    page: 1,
    pageSize: 100,
    sortBy: "createdAt",
    sortDirection: "desc",
  });

  const utils = trpc.useUtils();

  const updateSetting = trpc.settings.update.useMutation({
    onSuccess: () => {
      toast.success("Low-stock alert threshold updated successfully");
      utils.settings.get.invalidate();
      utils.products.list.invalidate();
      utils.insights.dashboard.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Team member role privileges updated");
      utils.users.list.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Administration"
        title="Workspace settings"
        description="Configure low-stock sensitivity thresholds, view security role definitions, and assign team access privileges."
      />

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        {/* Safety Stock Configuration */}
        <section className="surface-card p-6 sm:p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">
            Low-stock alert threshold
          </h2>
          <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
            Products at or below this global quantity trigger warning status badges across the
            dashboard radar, inventory catalogues, and telemetry reports.
          </p>

          <form
            onSubmit={e => {
              e.preventDefault();
              updateSetting.mutate({ lowStockThreshold: Number(threshold) });
            }}
            className="mt-6"
          >
            <label>
              <span className="field-label">Units remaining trigger</span>
              <div className="flex gap-2.5">
                <input
                  required
                  min="0"
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  placeholder="10"
                  className="field-input font-mono font-bold"
                />
                <Button
                  disabled={updateSetting.isPending}
                  className="h-10.5 shrink-0 rounded-xl bg-primary px-5 text-xs font-bold text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateSetting.isPending ? "Saving…" : "Save"}
                </Button>
              </div>
            </label>
          </form>
        </section>

        {/* Security Role Definitions */}
        <section className="surface-card p-6 sm:p-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="mt-4 font-display text-lg font-bold text-foreground">
            Role definitions & privileges
          </h2>
          <p className="mt-1.5 text-xs text-muted-foreground">
            Three distinct privilege tiers designed to separate operational responsibilities.
          </p>

          <div className="mt-5 grid gap-3.5 sm:grid-cols-3">
            <RoleCard
              icon={<Crown className="h-4 w-4 text-amber-500" />}
              role="Administrator"
              text="Full system control, settings, user permissions, and every operational domain."
            />
            <RoleCard
              icon={<Shield className="h-4 w-4 text-blue-500" />}
              role="Manager"
              text="Manages product catalog, supplier contracts, inventory adjustments, and analytics."
            />
            <RoleCard
              icon={<UserCheck className="h-4 w-4 text-indigo-500" />}
              role="Staff"
              text="Point of sale checkout, customer lookups, and viewing available catalogue."
            />
          </div>
        </section>
      </section>

      {/* Team Access Table */}
      <section className="surface-card overflow-hidden">
        <div className="flex items-center gap-3.5 border-b border-border/70 p-5 dark:border-white/[0.06]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted font-display text-xs font-bold text-foreground">
            <UsersRound className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-foreground">Team access directory</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Assign or update operational roles across authenticated staff members.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[680px]">
            <thead>
              <tr>
                <th>Team member</th>
                <th>Email address</th>
                <th>Current role</th>
                <th>Joined</th>
                <th className="text-right">Privilege assignment</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-14 text-center text-muted-foreground">
                    Loading team members…
                  </td>
                </tr>
              ) : (
                users?.items.map(member => (
                  <tr key={member.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted font-display text-xs font-bold text-foreground">
                          {(member.name || "U").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-bold text-foreground">
                          {member.name || "Unnamed user"}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {member.email || "—"}
                      </span>
                    </td>
                    <td>
                      <StatusPill
                        tone={
                          member.role === "admin"
                            ? "info"
                            : member.role === "manager"
                            ? "warning"
                            : "neutral"
                        }
                      >
                        {member.role === "admin"
                          ? "Administrator"
                          : member.role === "manager"
                          ? "Manager"
                          : "Staff"}
                      </StatusPill>
                    </td>
                    <td>
                      <span className="font-mono text-xs text-muted-foreground">
                        {new Date(member.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex justify-end">
                        <select
                          disabled={member.role === "admin"}
                          defaultValue={member.role}
                          onChange={e =>
                            updateRole.mutate({
                              id: member.id,
                              role: e.target.value as "admin" | "manager" | "staff",
                            })
                          }
                          className="field-select h-9 w-36 text-xs font-bold disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {["admin", "manager", "staff"].map(r => (
                            <option key={r} value={r}>
                              {r.charAt(0).toUpperCase() + r.slice(1)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {users ? (
          <TablePagination
            page={users.page}
            pageCount={users.pageCount}
            total={users.total}
            pageSize={users.pageSize}
            onPageChange={() => {}}
          />
        ) : null}
      </section>
    </div>
  );
}

function RoleCard({
  icon,
  role,
  text,
}: {
  icon: React.ReactNode;
  role: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-border/80 bg-muted/40 p-4 transition-colors hover:bg-muted/70 dark:border-white/[0.06] dark:bg-white/[0.02]">
      <div className="flex items-center gap-2">
        {icon}
        <p className="font-display text-xs font-bold uppercase tracking-wider text-foreground">
          {role}
        </p>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
