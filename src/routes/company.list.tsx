import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Search,
  SlidersHorizontal,
  Calendar,
  Plus,
  Eye,
  Pencil,
  Trash2,
  CheckCircle2,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export const Route = createFileRoute("/company/list")({
  head: () => ({
    meta: [
      { title: "Company List — Airbox" },
      { name: "description", content: "Browse, filter and manage registered companies." },
    ],
  }),
  component: CompanyListPage,
});

type Row = {
  id: string;
  name: string;
  email: string;
  code: string;
  industry: string;
  regDate: string; // ISO
  status: "active" | "inactive";
  tone: string; // avatar tone
};

const ROWS: Row[] = [
  { id: "1", name: "PT Wahana Digital", email: "hello@wahanadigital.id", code: "WHD-ID", industry: "Technology", regDate: "2025-03-14", status: "inactive", tone: "sky" },
  { id: "2", name: "PT Indo Cargo Express", email: "ops@indocargo.id", code: "ICE-ID", industry: "Logistics & Supply Chain", regDate: "2025-01-30", status: "active", tone: "violet" },
  { id: "3", name: "PT Nusantara Tech", email: "hello@nusantaratech.id", code: "NST-ID", industry: "Technology", regDate: "2024-06-10", status: "inactive", tone: "emerald" },
  { id: "4", name: "PT Garuda Logistics", email: "info@garudalogistics.id", code: "GRL-ID", industry: "Aviation & Aerospace", regDate: "2024-03-22", status: "active", tone: "amber" },
  { id: "5", name: "PT Airbox Indonesia", email: "corporate@airbox.id", code: "AIR-ID", industry: "Logistics & Supply Chain", regDate: "2024-01-15", status: "active", tone: "rose" },
  { id: "6", name: "PT Sentosa Retail", email: "cs@sentosaretail.id", code: "SNR-ID", industry: "Retail", regDate: "2023-11-04", status: "inactive", tone: "cyan" },
  { id: "7", name: "PT Mitra Konstruksi", email: "office@mitrakonstruksi.id", code: "MTK-ID", industry: "Construction", regDate: "2023-08-19", status: "active", tone: "indigo" },
];

const TONE: Record<string, string> = {
  sky: "from-sky-500 to-sky-400",
  violet: "from-violet-500 to-violet-400",
  emerald: "from-emerald-500 to-emerald-400",
  amber: "from-amber-500 to-amber-400",
  rose: "from-rose-500 to-rose-400",
  cyan: "from-cyan-500 to-cyan-400",
  indigo: "from-indigo-500 to-indigo-400",
};

const PAGE_SIZE = 5;

function fmt(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" });
}

function CompanyListPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [sortDesc, setSortDesc] = useState(true);
  const [page, setPage] = useState(1);
  const [openFilter, setOpenFilter] = useState(false);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = ROWS.filter((r) => {
      if (status !== "all" && r.status !== status) return false;
      if (!term) return true;
      return (
        r.name.toLowerCase().includes(term) ||
        r.code.toLowerCase().includes(term) ||
        r.industry.toLowerCase().includes(term) ||
        r.email.toLowerCase().includes(term)
      );
    });
    list.sort((a, b) =>
      sortDesc ? b.regDate.localeCompare(a.regDate) : a.regDate.localeCompare(b.regDate),
    );
    return list;
  }, [q, status, sortDesc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageRows = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div>
      <PageHeader
        title="Company List"
        description="All registered tenants with their subscription status."
        actions={
          <Button asChild className="gap-1.5">
            <Link to="/company/registration">
              <Plus className="size-4" /> Register Company
            </Link>
          </Button>
        }
      />

      {/* Search + filters bar */}
      <div className="flex flex-col md:flex-row gap-2 mb-4">
        <div className="flex-1 relative">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
            placeholder="Search name, code, industry…"
            className="pl-9 h-10 bg-muted/40"
          />
        </div>
        <div className="relative">
          <Button
            variant="outline"
            className="h-10 gap-1.5"
            onClick={() => setOpenFilter((o) => !o)}
          >
            <SlidersHorizontal className="size-4" />
            Filters
            {status !== "all" && (
              <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary capitalize">
                {status}
              </span>
            )}
          </Button>
          {openFilter && (
            <div className="absolute right-0 mt-1 z-20 w-52 rounded-lg border border-border bg-popover shadow-lg p-2">
              <div className="text-[11px] font-medium text-muted-foreground px-2 py-1">Status</div>
              {(["all", "active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    setPage(1);
                    setOpenFilter(false);
                  }}
                  className={cn(
                    "w-full text-left text-sm px-2 py-1.5 rounded-md capitalize hover:bg-muted",
                    status === s && "bg-muted font-medium",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
        <Button
          variant="outline"
          className="h-10 gap-1.5"
          onClick={() => setSortDesc((v) => !v)}
        >
          <Calendar className="size-4" />
          Date {sortDesc ? "↓" : "↑"}
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr className="text-[11px] uppercase tracking-wider text-muted-foreground">
                <th className="text-left font-semibold px-5 py-3">Company</th>
                <th className="text-left font-semibold px-4 py-3">Code</th>
                <th className="text-left font-semibold px-4 py-3">Industry</th>
                <th className="text-left font-semibold px-4 py-3">
                  <button
                    onClick={() => setSortDesc((v) => !v)}
                    className="inline-flex items-center gap-1 hover:text-foreground"
                  >
                    Reg. Date {sortDesc ? "↓" : "↑"}
                  </button>
                </th>
                <th className="text-left font-semibold px-4 py-3">Status</th>
                <th className="text-right font-semibold px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pageRows.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "size-9 rounded-lg bg-gradient-to-br grid place-items-center text-white text-sm font-semibold shrink-0",
                          TONE[r.tone] ?? TONE.sky,
                        )}
                      >
                        {r.name.replace(/^PT\s+/, "").charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-medium truncate">{r.name}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-[11px] text-foreground/80">
                      {r.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/90">{r.industry}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="size-3.5" />
                      {fmt(r.regDate)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "active" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[11px] font-medium">
                        <CheckCircle2 className="size-3.5" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium">
                        <MinusCircle className="size-3.5" /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        title="View"
                        className="size-8 grid place-items-center rounded-md text-sky-600 hover:bg-sky-500/10"
                      >
                        <Eye className="size-4" />
                      </button>
                      <button
                        title="Edit"
                        className="size-8 grid place-items-center rounded-md text-muted-foreground hover:bg-muted"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        title="Delete"
                        className="size-8 grid place-items-center rounded-md text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {pageRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-14 text-center text-sm text-muted-foreground">
                    No companies match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer / pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card">
          <div className="text-xs text-muted-foreground">
            {filtered.length === 0
              ? "No results"
              : `Showing ${start + 1}–${start + pageRows.length} of ${filtered.length} companies`}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="size-8 grid place-items-center rounded-md border border-border text-muted-foreground disabled:opacity-40 hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </button>
            {Array.from({ length: totalPages }).map((_, i) => {
              const n = i + 1;
              const active = n === currentPage;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={cn(
                    "size-8 grid place-items-center rounded-md text-xs font-medium",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "border border-border text-foreground hover:bg-muted",
                  )}
                >
                  {n}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="size-8 grid place-items-center rounded-md border border-border text-muted-foreground disabled:opacity-40 hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>
      </Card>
    </div>
  );
}
