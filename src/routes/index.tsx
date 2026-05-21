import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useAirbox } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Boxes,
  Building2,
  TrendingUp,
  ArrowUpRight,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Airbox Bundle Admin" },
      { name: "description", content: "Overview of modules, bundles and subscriptions." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { modules, bundles, companies, subscriptions } = useAirbox();

  const activeSubs = subscriptions.filter((s) => s.status === "active");
  const activeBundles = bundles.filter((b) => b.status === "active" && !b.is_template);
  const templates = bundles.filter((b) => b.is_template);

  const mrr = useMemo(
    () =>
      activeSubs.reduce((sum, s) => {
        const b = bundles.find((bb) => bb.id === s.bundle_id);
        if (!b) return sum;
        return sum + (b.monthly_price || Math.round(b.yearly_price / 12));
      }, 0),
    [activeSubs, bundles],
  );

  const topBundles = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of activeSubs) counts.set(s.bundle_id, (counts.get(s.bundle_id) ?? 0) + 1);
    return bundles
      .map((b) => ({ name: b.name, subs: counts.get(b.id) ?? 0 }))
      .sort((a, b) => b.subs - a.subs)
      .slice(0, 6);
  }, [activeSubs, bundles]);

  const categoryUsage = useMemo(() => {
    const inUse = new Map<string, number>();
    for (const b of activeBundles) {
      for (const mid of b.module_ids) {
        const m = modules.find((mm) => mm.id === mid);
        if (!m) continue;
        inUse.set(m.category, (inUse.get(m.category) ?? 0) + 1);
      }
    }
    return Array.from(inUse.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [modules, activeBundles]);

  const stats = [
    {
      label: "Total Modules",
      value: modules.length,
      icon: Boxes,
      hint: `${new Set(modules.map((m) => m.category)).size} categories`,
      tone: "text-primary",
    },
    {
      label: "Active Bundles",
      value: activeBundles.length,
      icon: Package,
      hint: `${templates.length} templates`,
      tone: "text-chart-3",
    },
    {
      label: "Subscriptions",
      value: activeSubs.length,
      icon: Building2,
      hint: `${companies.length} companies`,
      tone: "text-chart-2",
    },
    {
      label: "Monthly Revenue",
      value: `$${mrr.toLocaleString()}`,
      icon: TrendingUp,
      hint: "estimated MRR",
      tone: "text-chart-4",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Welcome back"
        description="Overview of your product bundle catalogue, modules and customer subscriptions."
        actions={
          <>
            <Link
              to="/bundles"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted"
            >
              <Package className="size-4" /> Manage bundles
            </Link>
            <Link
              to="/templates"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 shadow-[var(--shadow-elegant)]"
            >
              <Layers className="size-4" /> New from template
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5 shadow-[var(--shadow-card)]">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {s.label}
                </div>
                <div className="text-3xl font-semibold mt-2 tracking-tight">{s.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{s.hint}</div>
              </div>
              <div className={`size-10 rounded-lg bg-muted grid place-items-center ${s.tone}`}>
                <s.icon className="size-5" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        <Card className="p-5 lg:col-span-2 shadow-[var(--shadow-card)]">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold">Top bundles by subscription</h3>
              <p className="text-xs text-muted-foreground">Active customers per bundle</p>
            </div>
            <Badge variant="secondary">Live</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topBundles}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--color-card)",
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="subs" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-5 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold">Module usage by category</h3>
          <p className="text-xs text-muted-foreground">Across active bundles</p>
          <div className="mt-4 flex flex-col gap-3">
            {categoryUsage.map((c) => {
              const max = Math.max(...categoryUsage.map((x) => x.count));
              const pct = (c.count / max) * 100;
              return (
                <div key={c.category}>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-foreground/80">{c.category}</span>
                    <span className="text-muted-foreground tabular-nums">{c.count}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-primary to-primary-glow"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="p-5 mt-6 shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-semibold">Recent subscriptions</h3>
            <p className="text-xs text-muted-foreground">Latest company bundle assignments</p>
          </div>
          <Link to="/companies" className="text-xs font-medium text-primary flex items-center gap-1 hover:underline">
            View all <ArrowUpRight className="size-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-border">
          {subscriptions.slice(-5).reverse().map((s) => {
            const company = companies.find((c) => c.id === s.company_id);
            const bundle = bundles.find((b) => b.id === s.bundle_id);
            return (
              <div key={s.id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">{company?.name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">
                    {bundle?.name} · expires {new Date(s.active_until).toLocaleDateString()}
                  </div>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"} className="capitalize">
                  {s.status}
                </Badge>
              </div>
            );
          })}
          {subscriptions.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No subscriptions yet.</div>
          )}
        </div>
      </Card>
    </div>
  );
}
