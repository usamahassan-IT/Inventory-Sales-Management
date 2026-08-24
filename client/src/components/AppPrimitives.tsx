import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Inbox } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5 border-b border-border/80 pb-7 sm:flex-row sm:items-end sm:justify-between dark:border-white/[0.08]">
      <div className="max-w-2xl">
        {eyebrow ? (
          <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-indigo-600 dark:border-indigo-400/20 dark:bg-indigo-400/10 dark:text-indigo-400">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500" />
            <span>{eyebrow}</span>
          </div>
        ) : null}
        <h1 className="font-display text-2.5xl sm:text-3xl font-black tracking-tight text-foreground">
          {title}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div> : null}
    </div>
  );
}

export function MetricCard({
  title,
  label,
  value,
  note,
  detail,
  icon,
  tone = "indigo",
  accent,
}: {
  title?: string;
  label?: string;
  value: string | number;
  note?: string;
  detail?: string;
  icon?: ReactNode;
  tone?: "indigo" | "blue" | "amber" | "rose" | "neutral" | "emerald" | "mint" | "cyan" | "ink";
  accent?: string;
}) {
  const effectiveTitle = title || label || "";
  const effectiveNote = note || detail;

  const toneMap: Record<string, { bg: string; text: string; border: string }> = {
    indigo: {
      bg: "bg-indigo-500/10 dark:bg-indigo-400/15",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-500/20 dark:border-indigo-400/20",
    },
    blue: {
      bg: "bg-blue-500/10 dark:bg-blue-400/15",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20 dark:border-blue-400/20",
    },
    cyan: {
      bg: "bg-blue-500/10 dark:bg-blue-400/15",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20 dark:border-blue-400/20",
    },
    emerald: {
      bg: "bg-blue-500/10 dark:bg-blue-400/15",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20 dark:border-blue-400/20",
    },
    mint: {
      bg: "bg-blue-500/10 dark:bg-blue-400/15",
      text: "text-blue-600 dark:text-blue-400",
      border: "border-blue-500/20 dark:border-blue-400/20",
    },
    amber: {
      bg: "bg-amber-500/10 dark:bg-amber-400/15",
      text: "text-amber-600 dark:text-amber-400",
      border: "border-amber-500/20 dark:border-amber-400/20",
    },
    rose: {
      bg: "bg-rose-500/10 dark:bg-rose-400/15",
      text: "text-rose-600 dark:text-rose-400",
      border: "border-rose-500/20 dark:border-rose-400/20",
    },
    ink: {
      bg: "bg-indigo-500/10 dark:bg-indigo-400/15",
      text: "text-indigo-600 dark:text-indigo-400",
      border: "border-indigo-500/20 dark:border-indigo-400/20",
    },
    neutral: {
      bg: "bg-muted",
      text: "text-muted-foreground",
      border: "border-border",
    },
  };

  const selectedTone = accent || tone || "indigo";
  const current = toneMap[selectedTone] || toneMap.indigo;

  return (
    <div className="surface-card-interactive relative overflow-hidden p-5.5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {effectiveTitle}
          </p>
          <p className="mt-2 font-display text-2.5xl sm:text-3xl font-black tracking-tight text-foreground">
            {value}
          </p>
        </div>
        {icon ? (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${current.bg} ${current.text} ${current.border} border`}
          >
            {icon}
          </div>
        ) : null}
      </div>
      {effectiveNote ? (
        <div className="mt-3.5 flex items-center gap-1.5 border-t border-border/60 pt-3 text-xs text-muted-foreground dark:border-white/[0.05]">
          <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/60 dark:bg-indigo-400/60" />
          <span>{effectiveNote}</span>
        </div>
      ) : null}
    </div>
  );
}

export function StatusPill({
  tone = "neutral",
  children,
}: {
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
  children: ReactNode;
}) {
  const styles = {
    success:
      "bg-blue-500/10 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300 border-blue-500/20 dark:border-blue-400/20",
    warning:
      "bg-amber-500/10 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300 border-amber-500/20 dark:border-amber-400/20",
    danger:
      "bg-rose-500/10 text-rose-700 dark:bg-rose-400/15 dark:text-rose-300 border-rose-500/20 dark:border-rose-400/20",
    info: "bg-indigo-500/10 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300 border-indigo-500/20 dark:border-indigo-400/20",
    neutral: "bg-muted text-muted-foreground border-border",
  };

  const dots = {
    success: "bg-blue-500 dark:bg-blue-400",
    warning: "bg-amber-500 dark:bg-amber-400",
    danger: "bg-rose-500 dark:bg-rose-400",
    info: "bg-indigo-500 dark:bg-indigo-400",
    neutral: "bg-muted-foreground/60",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[tone]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dots[tone]}`} />
      <span>{children}</span>
    </span>
  );
}

export function TablePagination({
  page,
  pageCount,
  total,
  pageSize,
  onPageChange,
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}) {
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-col gap-3 border-t border-border/80 px-5 py-4 text-xs font-medium text-muted-foreground sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
      <span>
        Showing <strong className="font-bold text-foreground">{start}–{end}</strong> of{" "}
        <strong className="font-bold text-foreground">{total}</strong> records
      </span>
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="outline"
          className="h-8.5 w-8.5 rounded-xl border-border bg-card shadow-xs hover:bg-muted"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="min-w-20 text-center text-xs font-bold text-foreground">
          Page {page} of {pageCount || 1}
        </span>
        <Button
          size="icon"
          variant="outline"
          className="h-8.5 w-8.5 rounded-xl border-border bg-card shadow-xs hover:bg-muted"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

export function EmptyTable({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400">
        <Inbox className="h-6 w-6" />
      </div>
      <h3 className="mt-4 font-display text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
