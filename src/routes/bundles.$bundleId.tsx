import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAirbox, type Module } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  ChevronLeft,
  Save,
  AlertTriangle,
  Plus,
  X,
  CheckCircle2,
  Boxes,
  Sparkles,
  Building2,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/bundles/$bundleId")({
  head: () => ({
    meta: [{ title: "Bundle Builder — Airbox" }],
  }),
  component: BundleBuilder,
});

function BundleBuilder() {
  const { bundleId } = Route.useParams();
  const navigate = useNavigate();
  const {
    bundles,
    modules,
    companies,
    updateBundle,
    setBundleModules,
    resolveDependencies,
    bulkAssign,
  } = useAirbox();

  const bundle = bundles.find((b) => b.id === bundleId);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [showDepDialog, setShowDepDialog] = useState<{ open: boolean; missing: string[] }>({
    open: false,
    missing: [],
  });
  const [draftMeta, setDraftMeta] = useState(() =>
    bundle
      ? {
          name: bundle.name,
          description: bundle.description,
          monthly_price: bundle.monthly_price,
          yearly_price: bundle.yearly_price,
        }
      : null,
  );

  if (!bundle || !draftMeta) {
    return (
      <Card className="p-12 text-center">
        <h3 className="font-medium">Bundle not found</h3>
        <Link to="/bundles" className="text-sm text-primary mt-2 inline-block">Back to bundles</Link>
      </Card>
    );
  }

  const moduleById = new Map(modules.map((m) => [m.id, m]));
  const selectedIds = new Set(bundle.module_ids);

  const categories = useMemo(
    () => Array.from(new Set(modules.map((m) => m.category))).sort(),
    [modules],
  );

  const available = useMemo(() => {
    const ql = q.toLowerCase();
    return modules.filter((m) => {
      if (selectedIds.has(m.id)) return false;
      if (cat !== "all" && m.category !== cat) return false;
      if (m.status !== "active") return false;
      if (!ql) return true;
      return m.name.toLowerCase().includes(ql) || m.category.toLowerCase().includes(ql);
    });
  }, [modules, selectedIds, q, cat]);

  const availableGrouped = useMemo(() => {
    const map = new Map<string, Module[]>();
    for (const m of available) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [available]);

  const selected = useMemo(
    () => bundle.module_ids.map((id) => moduleById.get(id)).filter(Boolean) as Module[],
    [bundle.module_ids, moduleById],
  );

  const selectedGrouped = useMemo(() => {
    const map = new Map<string, Module[]>();
    for (const m of selected) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [selected]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id || selectedIds.has(id)) return;
    addModules([id]);
  };

  const addModules = (ids: string[]) => {
    const { missing } = resolveDependencies([...bundle.module_ids, ...ids]);
    if (missing.length > 0) {
      // Stage to ask user
      setBundleModules(bundle.id, Array.from(new Set([...bundle.module_ids, ...ids])));
      setShowDepDialog({ open: true, missing });
    } else {
      setBundleModules(bundle.id, Array.from(new Set([...bundle.module_ids, ...ids])));
      toast.success(`${ids.length} module(s) added`);
    }
  };

  const removeModule = (id: string) => {
    setBundleModules(bundle.id, bundle.module_ids.filter((m) => m !== id));
  };

  const addCategoryAll = (category: string) => {
    const ids = available.filter((m) => m.category === category).map((m) => m.id);
    if (ids.length) addModules(ids);
  };

  const saveMeta = () => {
    updateBundle(bundle.id, draftMeta);
    toast.success("Bundle saved");
  };

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/bundles" className="hover:text-foreground inline-flex items-center gap-1">
          <ChevronLeft className="size-4" /> Bundles
        </Link>
        <span>/</span>
        <span className="text-foreground">{bundle.name}</span>
      </div>

      <PageHeader
        title={bundle.name}
        description={`Drag modules from the library, or use bulk actions. ${selected.length} of ${modules.length} modules selected.`}
        actions={
          <>
            <AssignDialog
              bundleId={bundle.id}
              companies={companies}
              onAssign={(ids, until) => bulkAssign(ids, bundle.id, until)}
            />
            <Button onClick={saveMeta} className="gap-1.5"><Save className="size-4" /> Save bundle</Button>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Library */}
        <Card className="lg:col-span-7 p-0 overflow-hidden">
          <div className="p-4 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Boxes className="size-4 text-primary" /> Module Library
              </h3>
              <Badge variant="secondary">{available.length} available</Badge>
            </div>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search modules…"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
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
            </div>
          </div>
          <div className="max-h-[640px] overflow-y-auto p-4 flex flex-col gap-4">
            {availableGrouped.map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {category} <span className="opacity-60">({items.length})</span>
                  </div>
                  <button
                    onClick={() => addCategoryAll(category)}
                    className="text-[11px] text-primary font-medium hover:underline inline-flex items-center gap-1"
                  >
                    <Plus className="size-3" /> Add all
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {items.map((m) => (
                    <ModuleChip key={m.id} module={m} onAdd={() => addModules([m.id])} />
                  ))}
                </div>
              </div>
            ))}
            {availableGrouped.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">
                Everything's added — nothing more to pick.
              </div>
            )}
          </div>
        </Card>

        {/* Bundle preview / drop target */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          <Card className="p-5">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Sparkles className="size-4 text-primary" /> Bundle details
            </h3>
            <div className="grid gap-3">
              <div>
                <Label>Name</Label>
                <Input value={draftMeta.name} onChange={(e) => setDraftMeta({ ...draftMeta, name: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={2} value={draftMeta.description} onChange={(e) => setDraftMeta({ ...draftMeta, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Monthly $</Label>
                  <Input type="number" value={draftMeta.monthly_price} onChange={(e) => setDraftMeta({ ...draftMeta, monthly_price: +e.target.value })} />
                </div>
                <div>
                  <Label>Yearly $</Label>
                  <Input type="number" value={draftMeta.yearly_price} onChange={(e) => setDraftMeta({ ...draftMeta, yearly_price: +e.target.value })} />
                </div>
              </div>
            </div>
          </Card>

          <Card
            className="p-0 overflow-hidden flex-1"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="p-4 border-b border-border bg-gradient-to-r from-primary/10 to-primary-glow/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold">In this bundle</h3>
                  <p className="text-[11px] text-muted-foreground">Drop here to add. Click × to remove.</p>
                </div>
                <Badge>{selected.length}</Badge>
              </div>
            </div>
            <div className="max-h-[480px] overflow-y-auto p-4 flex flex-col gap-3">
              {selectedGrouped.map(([category, items]) => (
                <div key={category}>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                    {category}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {items.map((m) => (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1 pl-2 pr-1 py-1 text-xs rounded-md bg-primary/10 text-primary border border-primary/20"
                      >
                        {m.name}
                        <button
                          onClick={() => removeModule(m.id)}
                          className="hover:bg-primary/20 rounded p-0.5"
                          aria-label="Remove"
                        >
                          <X className="size-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
              {selected.length === 0 && (
                <div className="py-16 text-center text-sm text-muted-foreground border-2 border-dashed border-border rounded-xl">
                  Drag modules here, or click <Plus className="size-3 inline" /> on a card.
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <AlertDialog open={showDepDialog.open} onOpenChange={(o) => setShowDepDialog((s) => ({ ...s, open: o }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" /> Missing dependencies
            </AlertDialogTitle>
            <AlertDialogDescription>
              The following modules are required by your selection:
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex flex-wrap gap-1.5">
            {showDepDialog.missing.map((id) => (
              <Badge key={id} variant="secondary">
                {moduleById.get(id)?.name ?? id}
              </Badge>
            ))}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep as-is</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const { resolved } = resolveDependencies(bundle.module_ids);
                setBundleModules(bundle.id, resolved);
                toast.success("Dependencies added");
              }}
            >
              <CheckCircle2 className="size-4" /> Auto-add dependencies
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ModuleChip({ module: m, onAdd }: { module: Module; onAdd: () => void }) {
  return (
    <div
      draggable
      onDragStart={(e) => e.dataTransfer.setData("text/plain", m.id)}
      className="group flex items-center justify-between p-2.5 rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-sm cursor-grab active:cursor-grabbing transition-all"
    >
      <div className="min-w-0">
        <div className="text-sm font-medium truncate">{m.name}</div>
        <div className="text-[10px] text-muted-foreground">
          {m.group}
          {m.dependencies.length > 0 && ` · ${m.dependencies.length} dep`}
        </div>
      </div>
      <button
        onClick={onAdd}
        className="size-7 rounded-md bg-muted text-foreground/70 hover:bg-primary hover:text-primary-foreground grid place-items-center transition-colors"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

function AssignDialog({
  companies,
  onAssign,
}: {
  bundleId: string;
  companies: { id: string; name: string; industry: string }[];
  onAssign: (companyIds: string[], activeUntil: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [days, setDays] = useState(365);

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-1.5"><Building2 className="size-4" /> Assign</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Bulk assign bundle</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Active for (days)</Label>
            <Input type="number" value={days} onChange={(e) => setDays(+e.target.value)} />
          </div>
          <div className="border border-border rounded-lg max-h-72 overflow-y-auto">
            {companies.map((c) => (
              <label key={c.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 border-border hover:bg-muted/40 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sel.has(c.id)}
                  onChange={() => toggle(c.id)}
                  className="size-4 accent-[color:var(--color-primary)]"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">{c.name}</div>
                  <div className="text-[11px] text-muted-foreground">{c.industry}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={sel.size === 0}
            onClick={() => {
              const until = new Date(Date.now() + days * 86400000).toISOString();
              onAssign(Array.from(sel), until);
              toast.success(`Assigned to ${sel.size} compan${sel.size === 1 ? "y" : "ies"}`);
              setOpen(false);
              setSel(new Set());
            }}
          >
            Assign to {sel.size}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
