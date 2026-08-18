import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import type { ComponentType } from "react";
import DashboardLayout from "./DashboardLayout";

type ApplicationRole = "admin" | "manager" | "staff";

export function RouteGuard({
  component: Component,
  roles,
}: {
  component: ComponentType;
  roles?: ApplicationRole[];
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f7f8f5]">
        <Loader2 className="h-5 w-5 animate-spin text-[#4b7f67]" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}
