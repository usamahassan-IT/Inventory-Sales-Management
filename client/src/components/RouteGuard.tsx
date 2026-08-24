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
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <Component />
    </DashboardLayout>
  );
}
