import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { RouteGuard } from "./components/RouteGuard";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Products from "./pages/Products";
import Reports from "./pages/Reports";
import Sales from "./pages/Sales";
import Settings from "./pages/Settings";
import Stock from "./pages/Stock";
import Suppliers from "./pages/Suppliers";

const staff = ["admin", "manager", "staff"] as const;
const manager = ["admin", "manager"] as const;

function App() {
  return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster richColors position="top-right"/><Switch>
    <Route path="/" component={() => <RouteGuard component={Dashboard} roles={[...staff]} />} />
    <Route path="/products" component={() => <RouteGuard component={Products} roles={[...staff]} />} />
    <Route path="/suppliers" component={() => <RouteGuard component={Suppliers} roles={[...staff]} />} />
    <Route path="/stock" component={() => <RouteGuard component={Stock} roles={[...manager]} />} />
    <Route path="/sales" component={() => <RouteGuard component={Sales} roles={[...staff]} />} />
    <Route path="/reports" component={() => <RouteGuard component={Reports} roles={[...manager]} />} />
    <Route path="/settings" component={() => <RouteGuard component={Settings} roles={["admin"]} />} />
    <Route component={NotFound} />
  </Switch></TooltipProvider></ThemeProvider></ErrorBoundary>;
}

export default App;
