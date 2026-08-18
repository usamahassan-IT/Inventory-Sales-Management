import { PageHeader, StatusPill, TablePagination } from "@/components/AppPrimitives";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, Save, ShieldCheck, UsersRound } from "lucide-react";
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
      toast.success("Low-stock threshold updated");
      utils.settings.get.invalidate();
      utils.products.list.invalidate();
      utils.insights.dashboard.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  const updateRole = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Team role updated");
      utils.users.list.invalidate();
    },
    onError: (e: { message: string }) => toast.error(e.message),
  });

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Administration"
        title="Workspace settings"
        description="Control low-stock sensitivity and assign clear operational access across the team."
      />
      <section className="grid gap-5 xl:grid-cols-[.75fr_1.25fr]">
        <section className="surface-card p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#fff1d8] text-[#a35f15]">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#2c3d34]">
            Low-stock alert line
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#728078]">
            Products at or below this global quantity are highlighted across the dashboard and product catalogue.
          </p>
          <form
            onSubmit={e => {
              e.preventDefault();
              updateSetting.mutate({ lowStockThreshold: Number(threshold) });
            }}
            className="mt-6"
          >
            <label>
              <span className="field-label">Units remaining</span>
              <div className="flex gap-2">
                <input
                  required
                  min="0"
                  type="number"
                  value={threshold}
                  onChange={e => setThreshold(e.target.value)}
                  className="field-input"
                />
                <Button
                  disabled={updateSetting.isPending}
                  className="h-10 shrink-0 rounded-xl bg-[#1f5f48] hover:bg-[#174c39]"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save
                </Button>
              </div>
            </label>
          </form>
        </section>
        <section className="surface-card p-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e8f2ec] text-[#2b704f]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <h2 className="mt-4 font-display text-lg font-semibold tracking-tight text-[#2c3d34]">
            Role definitions
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <RoleCard role="Administrator" text="Controls team access, settings, and every operational area." />
            <RoleCard role="Manager" text="Manages inventory, suppliers, sales, and performance reports." />
            <RoleCard role="Staff" text="Records sales and views the catalogue and assigned transactions." />
          </div>
        </section>
      </section>
      <section className="surface-card overflow-hidden">
        <div className="flex items-center gap-3 border-b border-[#edf0eb] px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#edf5ef] text-[#29704f]">
            <UsersRound className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold tracking-tight text-[#2c3d34]">Team access</h2>
            <p className="mt-0.5 text-xs text-[#77837b]">
              Adjust operating roles. Administrators cannot change their own role.
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="data-table w-full min-w-[680px]">
            <thead>
              <tr>
                <th>Team member</th>
                <th>Sign-in email</th>
                <th>Current role</th>
                <th>Joined</th>
                <th className="text-right">Change role</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center">
                    Loading team…
                  </td>
                </tr>
              ) : (
                users?.items.map(member => (
                  <tr key={member.id}>
                    <td className="font-semibold text-[#36473e]">{member.name || "Unnamed user"}</td>
                    <td>{member.email || "—"}</td>
                    <td>
                      <StatusPill
                        tone={
                          member.role === "admin" ? "success" : member.role === "manager" ? "warning" : "neutral"
                        }
                      >
                        {member.role}
                      </StatusPill>
                    </td>
                    <td>{new Date(member.createdAt).toLocaleDateString()}</td>
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
                          className="field-select h-8 w-32 disabled:cursor-not-allowed disabled:bg-[#f6f7f5]"
                        >
                          {["admin", "manager", "staff"].map(role => (
                            <option key={role} value={role}>
                              {role}
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

function RoleCard({ role, text }: { role: string; text: string }) {
  return (
    <div className="rounded-xl border border-[#e5ebe5] bg-[#fbfcfa] p-3">
      <p className="text-xs font-bold uppercase tracking-[.11em] text-[#3f7359]">{role}</p>
      <p className="mt-2 text-xs leading-5 text-[#738078]">{text}</p>
    </div>
  );
}
