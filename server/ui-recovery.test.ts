import { createElement } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const state = vi.hoisted(() => ({
  dashboard: {} as any,
  suppliers: {} as any,
  retry: vi.fn(),
  buttons: [] as Array<{ children: unknown; onClick?: () => void }>,
}));

vi.mock("wouter", () => ({ useLocation: () => ["/", vi.fn()] }));
vi.mock("@/_core/hooks/useAuth", () => ({ useAuth: () => ({ user: { role: "admin" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/components/ui/button", async () => {
  const React = await import("react");
  return {
    Button: ({ children, onClick, variant: _variant, size: _size, ...props }: any) => {
      state.buttons.push({ children, onClick });
      return React.createElement("button", { ...props, onClick }, children);
    },
  };
});
vi.mock("@/lib/trpc", () => ({
  trpc: {
    insights: { dashboard: { useQuery: () => state.dashboard } },
    suppliers: {
      list: { useQuery: () => state.suppliers },
      create: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      update: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
      remove: { useMutation: () => ({ mutate: vi.fn(), isPending: false }) },
    },
    useUtils: () => ({ suppliers: { list: { invalidate: vi.fn() } } }),
  },
}));

import Dashboard from "../client/src/pages/Dashboard";
import Suppliers from "../client/src/pages/Suppliers";

describe("inventory interface recovery and relationship display", () => {
  beforeEach(() => {
    state.retry.mockReset();
    state.buttons.length = 0;
    state.dashboard = { data: undefined, isLoading: false, isError: true, refetch: state.retry };
    state.suppliers = {
      isLoading: false,
      data: {
        page: 1,
        pageSize: 10,
        pageCount: 1,
        total: 1,
        items: [{ id: 1, name: "Northline Supply", contactName: "Morgan Lee", email: "team@northline.test", phone: "555-0100", address: null, productCount: 2, productNames: "Atlas Clamp, Signal Cable", createdAt: new Date("2026-08-16") }],
      },
    };
  });

  it("renders dashboard failure feedback and wires its retry action", () => {
    const markup = renderToStaticMarkup(createElement(Dashboard));
    expect(markup).toContain("Operational summary is temporarily unavailable.");
    expect(markup).toContain("Retry dashboard");
    const retryButton = state.buttons.find(button => button.children === "Retry dashboard");
    retryButton?.onClick?.();
    expect(state.retry).toHaveBeenCalledOnce();
  });

  it("renders a supplier’s associated product names in the directory row", () => {
    const markup = renderToStaticMarkup(createElement(Suppliers));
    expect(markup).toContain("With products");
    expect(markup).toContain("2 products");
    expect(markup).toContain("Atlas Clamp, Signal Cable");
  });
});
