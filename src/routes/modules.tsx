import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAirbox } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Search, Upload, Filter, Boxes } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/modules")({
  head: () => ({
    meta: [
      { title: "Module Library — Airbox" },
      { name: "description", content: "Browse and import the Airbox ERP module catalogue." },
    ],
  }),
  component: ModulesPage,
});

function ModulesPage() {
  const { modules, importModules, toggleModuleStatus } = useAirbox();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [statusF, setStatusF] = useState<"all" | "active" | "inactive">("all");
  const [importJson, setImportJson] = useState("");
  const [importOpen, setImportOpen] = useState(false);

  const categories = useMemo(
    () => Array.from(new Set(modules.map((m) => m.category))).sort(),
    [modules],
  );

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return modules.filter((m) => {
      if (cat !== "all" && m.category !== cat) return false;
      if (statusF !== "all" && m.status !== statusF) return false;
      if (!ql) return true;
      return (
        m.name.toLowerCase().includes(ql) ||
        m.code.toLowerCase().includes(ql) ||
        m.category.toLowerCase().includes(ql) ||
        m.group.toLowerCase().includes(ql)
      );
    });
  }, [modules, q, cat, statusF]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof modules>();
    for (const m of filtered) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const handleImport = () => {
    const res = importModules(importJson);
    if (res.error) toast.error("Import failed: " + res.error);
    else {
      toast.success(`Imported ${res.added} module(s).`);
      setImportOpen(false);
      setImportJson("");
    }
  };

  const sample = JSON.stringify(
    [
      { module_name: "Loyalty Program", category: "CRM", group: "Sales", dependencies: ["Customer Database"] },
      { module_name: "Insurance Claims", category: "Accounting & Finance", group: "Finance", dependencies: ["General Ledger"] },
    ],
    null,
    2,
  );

  return (
    <div>
      <PageHeader
        title="Module Library"
        description={`${modules.length} modules across ${categories.length} categories. Search, filter or bulk-import via JSON.`}
        actions={
          <Dialog open={importOpen} onOpenChange={setImportOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Upload className="size-4" /> Bulk import (JSON)</Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Bulk import modules</DialogTitle>
                <DialogDescription>
                  Paste a JSON array of modules. Duplicates (by name) are skipped automatically.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                rows={12}
                placeholder={sample}
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                className="font-mono text-xs"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setImportJson(sample)}>Load sample</Button>
                <Button onClick={handleImport} disabled={!importJson.trim()}>Import</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card className="p-4 mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search modules by name, code, group…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-muted-foreground" />
            <select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="h-9 rounded-lg border border-input bg-card text-sm px-2.5"
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <select
              value={statusF}
              onChange={(e) => setStatusF(e.target.value as "all" | "active" | "inactive")}
              className="h-9 rounded-lg border border-input bg-card text-sm px-2.5"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </Card>

      <div className="flex flex-col gap-5">
        {grouped.map(([category, items]) => (
          <Card key={category} className="p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="size-7 rounded-md bg-primary/10 text-primary grid place-items-center">
                  <Boxes className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">{category}</h3>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {items.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{m.name}</div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.group} · {m.code}
                      {m.dependencies.length > 0 && ` · ${m.dependencies.length} dep`}
                    </div>
                  </div>
                  <Switch
                    checked={m.status === "active"}
                    onCheckedChange={() => toggleModuleStatus(m.id)}
                  />
                </div>
              ))}
            </div>
          </Card>
        ))}
        {grouped.length === 0 && (
          <Card className="p-12 text-center text-sm text-muted-foreground">
            No modules match your filters.
          </Card>
        )}
      </div>
    </div>
  );
}
