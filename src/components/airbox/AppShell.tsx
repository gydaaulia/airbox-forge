import { Link, useLocation } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Boxes,
  Building2,
  Bell,
  Search,
  Sparkles,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/modules", label: "Module Library", icon: Boxes },
  { to: "/bundles", label: "Product Bundles", icon: Package },
  { to: "/rbac", label: "Roles & Permissions", icon: Shield },
  { to: "/companies", label: "Companies", icon: Building2 },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();

  if (pathname.startsWith("/accept-invite")) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">

      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
        <div className="px-6 pt-6 pb-8 flex items-center gap-2">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center shadow-[var(--shadow-elegant)]">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight text-white">Airbox</div>
            <div className="text-[11px] uppercase tracking-wider text-sidebar-foreground/60">
              Bundle Admin
            </div>
          </div>
        </div>

        <nav className="px-3 flex flex-col gap-1">
          {NAV.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent text-white"
                    : "text-sidebar-foreground/80 hover:text-white hover:bg-sidebar-accent/60",
                )}
              >
                <Icon className="size-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-sidebar-border/70 bg-sidebar-accent/40 p-4">
            <div className="text-xs font-medium text-white">Need more modules?</div>
            <p className="text-[11px] text-sidebar-foreground/70 mt-1">
              Use Bulk Import to register up to 500 modules from JSON.
            </p>
            <Link
              to="/modules"
              className="mt-3 inline-block text-[11px] font-medium text-primary-foreground bg-primary px-2.5 py-1.5 rounded-md hover:opacity-90"
            >
              Open importer
            </Link>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-10 h-16 bg-background/80 backdrop-blur border-b border-border flex items-center gap-4 px-6">
          <div className="flex-1 max-w-xl relative">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search modules, bundles, companies…"
              className="w-full pl-9 pr-3 h-9 rounded-lg border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <button className="size-9 rounded-lg border border-input bg-card grid place-items-center hover:bg-muted">
            <Bell className="size-4 text-muted-foreground" />
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium leading-none">Admin Console</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">ops@airbox.io</div>
            </div>
            <div className="size-9 rounded-full bg-gradient-to-br from-primary to-primary-glow grid place-items-center text-white text-xs font-semibold">
              AB
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 lg:p-8 min-w-0">{children}</main>
      </div>
    </div>
  );
}
