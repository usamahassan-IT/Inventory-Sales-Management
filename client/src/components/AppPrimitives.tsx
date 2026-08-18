import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-5 border-b border-[#e6e8e3] pb-7 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#4b7f67]">{eyebrow}</p> : null}
        <h1 className="font-display text-3xl font-semibold tracking-[-0.035em] text-[#17221f] sm:text-[2.15rem]">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-[#6b756f]">{description}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({ label, value, detail, accent = "emerald", icon }: { label: string; value: string; detail: string; accent?: "emerald" | "amber" | "ink" | "rose"; icon: ReactNode }) {
  const colors = {
    emerald: "bg-[#e5f3ea] text-[#1c6b4a]",
    amber: "bg-[#fff1d6] text-[#a05c12]",
    ink: "bg-[#e8edeb] text-[#28423a]",
    rose: "bg-[#fde8e6] text-[#a63e35]",
  };
  return (
    <section className="surface-card group relative overflow-hidden p-5">
      <div className={`mb-7 flex h-10 w-10 items-center justify-center rounded-xl ${colors[accent]}`}>{icon}</div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7a847e]">{label}</p>
      <p className="mt-2 font-display text-[1.85rem] font-semibold leading-none tracking-[-0.045em] text-[#17221f]">{value}</p>
      <p className="mt-3 text-xs font-medium text-[#748078]">{detail}</p>
    </section>
  );
}

export function TablePagination({ page, pageCount, total, pageSize, onPageChange }: { page: number; pageCount: number; total: number; pageSize: number; onPageChange: (page: number) => void }) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col gap-3 border-t border-[#edf0eb] px-5 py-4 text-sm text-[#77817b] sm:flex-row sm:items-center sm:justify-between">
      <span>Showing <strong className="font-semibold text-[#3d4a43]">{start}–{end}</strong> of <strong className="font-semibold text-[#3d4a43]">{total}</strong></span>
      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-[#dde4dd] bg-white" disabled={page <= 1} onClick={() => onPageChange(page - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></Button>
        <span className="min-w-20 text-center text-xs font-semibold text-[#526057]">Page {page} / {pageCount}</span>
        <Button size="icon" variant="outline" className="h-8 w-8 rounded-lg border-[#dde4dd] bg-white" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></Button>
      </div>
    </div>
  );
}

export function EmptyTable({ title, description }: { title: string; description: string }) {
  return <div className="flex min-h-60 flex-col items-center justify-center px-6 text-center"><div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-[#edf3ef] text-[#4b7f67]"><Inbox className="h-5 w-5" /></div><p className="font-semibold text-[#34433b]">{title}</p><p className="mt-1 max-w-sm text-sm text-[#79837c]">{description}</p></div>;
}

export function StatusPill({ tone, children }: { tone: "success" | "warning" | "danger" | "neutral"; children: ReactNode }) {
  const toneClasses = { success: "bg-[#e7f5ec] text-[#23724f]", warning: "bg-[#fff3dc] text-[#9f5c0d]", danger: "bg-[#fdeae8] text-[#a34238]", neutral: "bg-[#edf0ee] text-[#526158]" };
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide ${toneClasses[tone]}`}>{children}</span>;
}
