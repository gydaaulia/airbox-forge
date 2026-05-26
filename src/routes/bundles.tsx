import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useAirbox, type Bundle, type Module, type PricingType } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Copy,
  Archive,
  Package,
  Pencil,
  ArrowRight,
  Search,
  ChevronLeft,
  ChevronRight,
  Check,
  Boxes,
  DollarSign,
  ClipboardCheck,
  X,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn, formatIDR } from "@/lib/utils";

export const Route = createFileRoute("/bundles")({
  head: () => ({
    meta: [
      { title: "Product Bundles — Airbox" },
      { name: "description", content: "Manage product bundles and packages." },
    ],
  }),
  component: BundlesPage,
});

function BundlesPage() {
  const { bundles, createBundle, updateBundle, setBundleModules, duplicateBundle, archiveBundle, toggleBundleStatus } = useAirbox();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Bundle | null>(null);

  const visible = useMemo(
    () =>
      bundles
        .filter((b) => !b.is_template)
        .filter((b) =>
          q
            ? b.name.toLowerCase().includes(q.toLowerCase()) ||
              b.code.toLowerCase().includes(q.toLowerCase())
            : true,
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [bundles, q],
  );

  return (
    <div>
      <PageHeader
        title="Product Bundles"
        description="Create and assign product bundles. Use the guided wizard to build a bundle from the module library."
        actions={
          <Button className="gap-1.5" onClick={() => { setEditing(null); setOpen(true); }}>
            <Plus className="size-4" /> New bundle
          </Button>
        }
      />

      <CreateBundleWizard
        open={open}
        setOpen={(v) => { setOpen(v); if (!v) setEditing(null); }}
        editBundle={editing}
        onComplete={(meta, moduleIds) => {
          if (editing) {
            updateBundle(editing.id, meta);
            setBundleModules(editing.id, moduleIds);
            toast.success("Bundle updated");
          } else {
            const id = createBundle({ ...meta, module_ids: [], status: "active", is_template: false });
            if (moduleIds.length) setBundleModules(id, moduleIds);
            toast.success("Bundle created");
            navigate({ to: "/bundles/$bundleId", params: { bundleId: id } });
          }
        }}
      />


      <Card className="p-4 mb-5">
        <div className="relative max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bundles…" className="pl-9" />
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-medium">No bundles yet</h3>
          <p className="text-xs text-muted-foreground mt-1">Launch the wizard to bundle modules into a package.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={() => setOpen(true)}><Plus className="size-4" /> New bundle</Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((b) => (
            <BundleCard
              key={b.id}
              bundle={b}
              onEdit={() => { setEditing(b); setOpen(true); }}
              onDuplicate={() => {
                duplicateBundle(b.id);
                toast.success("Bundle duplicated");
              }}
              onArchive={() => {
                archiveBundle(b.id);
                toast("Bundle archived");
              }}
              onToggle={() => toggleBundleStatus(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}


function BundleCard({
  bundle,
  onEdit,
  onDuplicate,
  onArchive,
  onToggle,
}: {
  bundle: Bundle;
  onEdit: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onToggle: () => void;
}) {
  return (
    <Card className="p-5 hover:shadow-[var(--shadow-elegant)] transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight">{bundle.name}</h3>
            <Badge variant={bundle.status === "active" ? "default" : "secondary"} className="capitalize text-[10px]">
              {bundle.status}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{bundle.code}</div>
        </div>
        <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary-glow/10 grid place-items-center">
          <Package className="size-4 text-primary" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[2rem]">{bundle.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-md bg-muted/60">
          <div className="text-xs font-semibold">{bundle.module_ids.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Modules</div>
        </div>
        <div className="p-2 rounded-md bg-muted/60">
          <div className="text-xs font-semibold">{formatIDR(bundle.monthly_price)}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">/mo</div>
        </div>
        <div className="p-2 rounded-md bg-muted/60">
          <div className="text-xs font-semibold">{formatIDR(bundle.yearly_price)}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">/yr</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onDuplicate} className="h-8 px-2" title="Duplicate">
            <Copy className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onArchive} className="h-8 px-2" title="Archive">
            <Archive className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 px-2 text-xs">
            {bundle.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onEdit} className="h-8 px-2 gap-1 text-xs">
            <Pencil className="size-3.5" /> Edit
          </Button>
          <Link
            to="/bundles/$bundleId"
            params={{ bundleId: bundle.id }}
            className="text-xs font-medium text-primary flex items-center gap-1 hover:gap-1.5 transition-all"
          >
            Open <ArrowRight className="size-3.5" />
          </Link>
        </div>
      </div>
    </Card>
  );
}


// =============== Wizard ===============

type Meta = Omit<Bundle, "id" | "created_at" | "module_ids" | "status" | "is_template">;

const STEPS = [
  { key: "details", label: "Details", icon: Package },
  { key: "modules", label: "Modules", icon: Boxes },
  { key: "pricing", label: "Pricing", icon: DollarSign },
  { key: "review", label: "Review", icon: ClipboardCheck },
] as const;

function CreateBundleWizard({
  open,
  setOpen,
  editBundle,
  onComplete,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  editBundle?: Bundle | null;
  onComplete: (meta: Meta, moduleIds: string[]) => void;
}) {
  const { modules, resolveDependencies } = useAirbox();
  const isEdit = !!editBundle;
  const initialMeta = (): Meta =>
    editBundle
      ? {
          name: editBundle.name,
          code: editBundle.code,
          description: editBundle.description,
          category: editBundle.category,
          pricing_type: editBundle.pricing_type,
          monthly_price: editBundle.monthly_price,
          yearly_price: editBundle.yearly_price,
        }
      : {
          name: "",
          code: "",
          description: "",
          category: "Custom",
          pricing_type: "monthly",
          monthly_price: 0,
          yearly_price: 0,
        };
  const [step, setStep] = useState(0);
  const [meta, setMeta] = useState<Meta>(initialMeta);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(editBundle?.module_ids ?? []),
  );
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");

  // Re-sync when a different bundle is opened for editing
  useEffect(() => {
    if (open) {
      setStep(0);
      setMeta(initialMeta());
      setSelected(new Set(editBundle?.module_ids ?? []));
      setQ("");
      setCat("all");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, editBundle?.id]);

  const reset = () => {
    setStep(0);
    setMeta(initialMeta());
    setSelected(new Set(editBundle?.module_ids ?? []));
    setQ("");
    setCat("all");
  };

  const close = (v: boolean) => {
    setOpen(v);
    if (!v) reset();
  };



  const categories = useMemo(
    () => Array.from(new Set(modules.map((m) => m.category))).sort(),
    [modules],
  );

  const filtered = useMemo(() => {
    const ql = q.toLowerCase();
    return modules.filter((m) => {
      if (m.status !== "active") return false;
      if (cat !== "all" && m.category !== cat) return false;
      if (!ql) return true;
      return m.name.toLowerCase().includes(ql) || m.category.toLowerCase().includes(ql);
    });
  }, [modules, q, cat]);

  const grouped = useMemo(() => {
    const map = new Map<string, Module[]>();
    for (const m of filtered) {
      if (!map.has(m.category)) map.set(m.category, []);
      map.get(m.category)!.push(m);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const moduleById = useMemo(() => new Map(modules.map((m) => [m.id, m])), [modules]);

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const toggleCategory = (category: string, items: Module[]) => {
    const ids = items.map((m) => m.id);
    const allIn = ids.every((id) => selected.has(id));
    setSelected((s) => {
      const n = new Set(s);
      if (allIn) ids.forEach((id) => n.delete(id));
      else ids.forEach((id) => n.add(id));
      return n;
    });
  };

  const { missing } = useMemo(
    () => resolveDependencies(Array.from(selected)),
    [selected, resolveDependencies],
  );

  const autoAddDeps = () => {
    const { resolved } = resolveDependencies(Array.from(selected));
    setSelected(new Set(resolved));
    toast.success("Dependencies added");
  };

  const canNext = (() => {
    if (step === 0) return meta.name.trim().length > 0;
    if (step === 1) return selected.size > 0;
    return true;
  })();

  const next = () => {
    if (step === 0 && !meta.code) {
      setMeta((m) => ({ ...m, code: m.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_") }));
    }
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const finish = () => {
    onComplete(
      { ...meta, code: meta.code || meta.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_") },
      Array.from(selected),
    );
    close(false);
  };

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create a new bundle</DialogTitle>
          <DialogDescription>
            Step {step + 1} of {STEPS.length} — {STEPS[step].label}
          </DialogDescription>
        </DialogHeader>

        {/* Stepper */}
        <div className="flex items-center justify-between gap-2 pb-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.key} className="flex items-center gap-2 flex-1">
                <div
                  className={cn(
                    "size-8 rounded-full grid place-items-center text-xs font-semibold shrink-0 border",
                    done && "bg-primary text-primary-foreground border-primary",
                    active && "bg-primary/10 text-primary border-primary",
                    !done && !active && "bg-muted text-muted-foreground border-border",
                  )}
                >
                  {done ? <Check className="size-4" /> : <Icon className="size-4" />}
                </div>
                <div className={cn("text-xs font-medium", active ? "text-foreground" : "text-muted-foreground")}>
                  {s.label}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={cn("h-px flex-1", done ? "bg-primary" : "bg-border")} />
                )}
              </div>
            );
          })}
        </div>

        <div className="min-h-[360px]">
          {step === 0 && (
            <div className="grid gap-3">
              <div>
                <Label>Bundle name *</Label>
                <Input
                  autoFocus
                  value={meta.name}
                  onChange={(e) => setMeta({ ...meta, name: e.target.value })}
                  placeholder="e.g. Logistics Starter"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Code</Label>
                  <Input
                    value={meta.code}
                    onChange={(e) => setMeta({ ...meta, code: e.target.value })}
                    placeholder="Auto-generated from name"
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Input value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  rows={3}
                  value={meta.description}
                  onChange={(e) => setMeta({ ...meta, description: e.target.value })}
                  placeholder="What is this bundle for? Who is it for?"
                />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2 flex-1">
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
                <Badge variant="secondary">{selected.size} selected</Badge>
              </div>

              {missing.length > 0 && (
                <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-warning/40 bg-warning/10 text-xs">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-4 text-warning" />
                    <span>
                      {missing.length} dependency module(s) are required by your selection.
                    </span>
                  </div>
                  <Button size="sm" variant="outline" onClick={autoAddDeps}>
                    Auto-add
                  </Button>
                </div>
              )}

              <div className="max-h-[340px] overflow-y-auto pr-1 flex flex-col gap-4 border border-border rounded-lg p-3">
                {grouped.map(([category, items]) => {
                  const allIn = items.every((m) => selected.has(m.id));
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          {category} <span className="opacity-60">({items.length})</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleCategory(category, items)}
                          className="text-[11px] text-primary font-medium hover:underline"
                        >
                          {allIn ? "Clear all" : "Select all"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {items.map((m) => {
                          const on = selected.has(m.id);
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => toggle(m.id)}
                              className={cn(
                                "flex items-center justify-between gap-2 px-2.5 py-2 rounded-md border text-left transition-colors",
                                on
                                  ? "border-primary bg-primary/10"
                                  : "border-border bg-card hover:border-primary/40",
                              )}
                            >
                              <div className="min-w-0">
                                <div className="text-xs font-medium truncate">{m.name}</div>
                                <div className="text-[10px] text-muted-foreground">{m.group}</div>
                              </div>
                              <div
                                className={cn(
                                  "size-4 rounded border grid place-items-center shrink-0",
                                  on ? "bg-primary border-primary text-primary-foreground" : "border-input",
                                )}
                              >
                                {on && <Check className="size-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {grouped.length === 0 && (
                  <div className="py-10 text-center text-sm text-muted-foreground">
                    No modules match your filters.
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              <div>
                <Label>Pricing model</Label>
                <select
                  value={meta.pricing_type}
                  onChange={(e) => setMeta({ ...meta, pricing_type: e.target.value as PricingType })}
                  className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
                >
                  <option value="free">Free</option>
                  <option value="monthly">Monthly only</option>
                  <option value="yearly">Yearly only</option>
                  <option value="both">Monthly + Yearly</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Monthly price (Rp)</Label>
                  <Input
                    type="number"
                    value={meta.monthly_price}
                    onChange={(e) => setMeta({ ...meta, monthly_price: +e.target.value })}
                    disabled={meta.pricing_type === "free" || meta.pricing_type === "yearly"}
                  />
                </div>
                <div>
                  <Label>Yearly price (Rp)</Label>
                  <Input
                    type="number"
                    value={meta.yearly_price}
                    onChange={(e) => setMeta({ ...meta, yearly_price: +e.target.value })}
                    disabled={meta.pricing_type === "free" || meta.pricing_type === "monthly"}
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                You can change pricing any time from the bundle builder.
              </p>
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-4">
              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">Bundle</div>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-semibold">{meta.name || "Untitled"}</div>
                    <div className="text-[11px] font-mono text-muted-foreground">
                      {meta.code || meta.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}
                    </div>
                  </div>
                  <Badge variant="secondary">{meta.category}</Badge>
                </div>
                {meta.description && (
                  <p className="text-xs text-muted-foreground mt-2">{meta.description}</p>
                )}
                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-md bg-muted/60">
                    <div className="text-sm font-semibold">{selected.size}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">Modules</div>
                  </div>
                  <div className="p-2 rounded-md bg-muted/60">
                    <div className="text-sm font-semibold">{formatIDR(meta.monthly_price)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">/mo</div>
                  </div>
                  <div className="p-2 rounded-md bg-muted/60">
                    <div className="text-sm font-semibold">{formatIDR(meta.yearly_price)}</div>
                    <div className="text-[10px] text-muted-foreground uppercase">/yr</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Included modules ({selected.size})
                </div>
                {selected.size === 0 ? (
                  <p className="text-xs text-muted-foreground">No modules selected.</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                    {Array.from(selected).map((id) => {
                      const m = moduleById.get(id);
                      if (!m) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 pl-2 pr-1 py-0.5 text-[11px] rounded-md bg-primary/10 text-primary border border-primary/20"
                        >
                          {m.name}
                          <button onClick={() => toggle(id)} className="hover:bg-primary/20 rounded p-0.5">
                            <X className="size-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}
              </Card>
            </div>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between sm:justify-between">
          <Button variant="ghost" onClick={back} disabled={step === 0} className="gap-1">
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={next} disabled={!canNext} className="gap-1">
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={finish} className="gap-1">
              <Check className="size-4" /> Create bundle
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
