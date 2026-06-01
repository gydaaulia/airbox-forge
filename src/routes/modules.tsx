import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAirbox, type Module } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Search,
  Upload,
  Filter,
  Boxes,
  Plus,
  Tag,
  Eye,
  Pencil,
  Trash2,
  Package,
  Link2,
} from "lucide-react";
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
  const {
    modules,
    categories,
    bundles,
    importModules,
    toggleModuleStatus,
    addModule,
    updateModule,
    deleteModule,
  } = useAirbox();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [statusF, setStatusF] = useState<"all" | "active" | "inactive">("all");
  const [importJson, setImportJson] = useState("");
  const [importOpen, setImportOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Module | null>(null);
  const [viewing, setViewing] = useState<Module | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [catOpen, setCatOpen] = useState(false);

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
      toast.success(
        `Imported ${res.added} module(s)${res.newCategories?.length ? ` · ${res.newCategories.length} new category(ies)` : ""}.`,
      );
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

  const deletingMod = deletingId ? modules.find((m) => m.id === deletingId) ?? null : null;

  return (
    <div>
      <PageHeader
        title="Module Library"
        description={`${modules.length} modules across ${categories.length} categories. Add manually, manage categories, or bulk-import.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" className="gap-1.5" onClick={() => setCatOpen(true)}>
              <Tag className="size-4" /> Categories
            </Button>
            <Dialog open={importOpen} onOpenChange={setImportOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-1.5">
                  <Upload className="size-4" /> Bulk import
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Bulk import modules</DialogTitle>
                  <DialogDescription>
                    Paste a JSON array. Duplicates (by name) are skipped. New categories are
                    auto-registered.
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
                  <Button variant="outline" onClick={() => setImportJson(sample)}>
                    Load sample
                  </Button>
                  <Button onClick={handleImport} disabled={!importJson.trim()}>
                    Import
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="size-4" /> Add module
            </Button>
          </div>
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
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card hover:border-primary/40 transition-colors group"
                >
                  <button
                    type="button"
                    onClick={() => setViewing(m)}
                    className="min-w-0 text-left flex-1"
                  >
                    <div className="text-sm font-medium truncate group-hover:text-primary transition-colors">
                      {m.name}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {m.group} · {m.code}
                      {m.dependencies.length > 0 && ` · ${m.dependencies.length} dep`}
                    </div>
                  </button>
                  <div className="flex items-center gap-1 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => setViewing(m)}
                      title="View details"
                    >
                      <Eye className="size-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="size-7"
                      onClick={() => setEditing(m)}
                      title="Edit"
                    >
                      <Pencil className="size-3.5" />
                    </Button>
                    <Switch
                      checked={m.status === "active"}
                      onCheckedChange={() => toggleModuleStatus(m.id)}
                    />
                  </div>
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

      {/* Add / Edit Module */}
      <ModuleFormDialog
        open={addOpen || editing !== null}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
        editing={editing}
        modules={modules}
        categories={categories}
        onSubmit={(input) => {
          if (editing) {
            updateModule(editing.id, input);
            toast.success("Module updated.");
          } else {
            const res = addModule(input);
            if (!res.ok) {
              toast.error(res.error);
              return false;
            }
            toast.success("Module added.");
          }
          return true;
        }}
      />

      {/* Module Detail */}
      <ModuleDetailDialog
        module={viewing}
        onClose={() => setViewing(null)}
        onEdit={(m) => {
          setViewing(null);
          setEditing(m);
        }}
        onDelete={(m) => {
          setViewing(null);
          setDeletingId(m.id);
        }}
        allModules={modules}
        bundles={bundles}
      />

      {/* Category manager */}
      <CategoryManagerDialog open={catOpen} onClose={() => setCatOpen(false)} />

      {/* Delete confirm */}
      <AlertDialog open={deletingMod !== null} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deletingMod?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This cannot be undone. The module will be removed from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deletingMod) return;
                const res = deleteModule(deletingMod.id);
                if (!res.ok) toast.error(res.error);
                else toast.success("Module deleted.");
                setDeletingId(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============== Module Form Dialog ==============
function ModuleFormDialog({
  open,
  onClose,
  editing,
  modules,
  categories,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  editing: Module | null;
  modules: Module[];
  categories: string[];
  onSubmit: (input: {
    name: string;
    category: string;
    group: string;
    dependencies: string[];
  }) => boolean;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [group, setGroup] = useState("");
  const [deps, setDeps] = useState<Set<string>>(new Set());
  const [depQ, setDepQ] = useState("");

  // Reset on open
  useMemo(() => {
    if (open) {
      setName(editing?.name ?? "");
      setCategory(editing?.category ?? categories[0] ?? "");
      setGroup(editing?.group ?? "");
      setDeps(new Set(editing?.dependencies ?? []));
      setDepQ("");
    }
  }, [open, editing, categories]);

  const depCandidates = useMemo(() => {
    const ql = depQ.toLowerCase();
    return modules
      .filter((m) => (editing ? m.id !== editing.id : true))
      .filter((m) => (ql ? m.name.toLowerCase().includes(ql) : true))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [modules, depQ, editing]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit module" : "Add module"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Update the module metadata and dependencies."
              : "Create a single module manually. The code is auto-generated from the name."}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div>
            <Label className="text-xs">Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Loyalty Program"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Category</Label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="h-9 w-full rounded-lg border border-input bg-card text-sm px-2.5"
              >
                <option value="">— select —</option>
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-[10px] text-muted-foreground mt-1">
                Need a new category? Use "Categories" in the header.
              </p>
            </div>
            <div>
              <Label className="text-xs">Group</Label>
              <Input
                value={group}
                onChange={(e) => setGroup(e.target.value)}
                placeholder="e.g. Sales"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">Dependencies ({deps.size} selected)</Label>
            <Input
              placeholder="Search modules…"
              value={depQ}
              onChange={(e) => setDepQ(e.target.value)}
              className="mb-2"
            />
            <ScrollArea className="h-48 rounded-md border border-border">
              <div className="p-2 flex flex-col gap-0.5">
                {depCandidates.map((m) => {
                  const checked = deps.has(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-accent cursor-pointer text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = new Set(deps);
                          if (e.target.checked) next.add(m.id);
                          else next.delete(m.id);
                          setDeps(next);
                        }}
                      />
                      <span className="flex-1 truncate">{m.name}</span>
                      <span className="text-[10px] text-muted-foreground">{m.category}</span>
                    </label>
                  );
                })}
                {depCandidates.length === 0 && (
                  <p className="text-xs text-muted-foreground p-3 text-center">No modules.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={() => {
              const ok = onSubmit({
                name,
                category,
                group,
                dependencies: Array.from(deps),
              });
              if (ok) onClose();
            }}
            disabled={!name.trim() || !category.trim() || !group.trim()}
          >
            {editing ? "Save changes" : "Add module"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============== Module Detail Dialog ==============
function ModuleDetailDialog({
  module: m,
  onClose,
  onEdit,
  onDelete,
  allModules,
  bundles,
}: {
  module: Module | null;
  onClose: () => void;
  onEdit: (m: Module) => void;
  onDelete: (m: Module) => void;
  allModules: Module[];
  bundles: ReturnType<typeof useAirbox>["bundles"];
}) {
  const byId = useMemo(() => new Map(allModules.map((x) => [x.id, x])), [allModules]);
  if (!m) return null;
  const directDeps = m.dependencies.map((id) => byId.get(id)).filter(Boolean) as Module[];
  const dependents = allModules.filter((x) => x.dependencies.includes(m.id));
  const inBundles = bundles.filter((b) => b.module_ids.includes(m.id));

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Boxes className="size-4 text-primary" />
            {m.name}
          </DialogTitle>
          <DialogDescription>
            {m.category} · {m.group} · <code className="text-xs">{m.code}</code> ·{" "}
            <Badge variant={m.status === "active" ? "default" : "secondary"} className="text-[10px]">
              {m.status}
            </Badge>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DetailSection
            icon={<Link2 className="size-3.5" />}
            title={`Direct dependencies (${directDeps.length})`}
            empty="No dependencies."
          >
            {directDeps.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm py-1">
                <span className="truncate">{d.name}</span>
                <span className="text-[10px] text-muted-foreground">{d.category}</span>
              </li>
            ))}
          </DetailSection>

          <DetailSection
            icon={<Link2 className="size-3.5 rotate-180" />}
            title={`Required by (${dependents.length})`}
            empty="No modules depend on this."
          >
            {dependents.map((d) => (
              <li key={d.id} className="flex items-center justify-between text-sm py-1">
                <span className="truncate">{d.name}</span>
                <span className="text-[10px] text-muted-foreground">{d.category}</span>
              </li>
            ))}
          </DetailSection>

          <div className="md:col-span-2">
            <DetailSection
              icon={<Package className="size-3.5" />}
              title={`Included in product bundles (${inBundles.length})`}
              empty="Not used by any bundle yet."
            >
              {inBundles.map((b) => (
                <li
                  key={b.id}
                  className="flex items-center justify-between text-sm py-1.5 border-b border-border/40 last:border-0"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{b.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {b.code} · {b.category} · {b.module_ids.length} modules
                    </div>
                  </div>
                  <Badge variant={b.status === "active" ? "default" : "secondary"} className="text-[10px]">
                    {b.status}
                  </Badge>
                </li>
              ))}
            </DetailSection>
          </div>
        </div>

        <DialogFooter className="justify-between sm:justify-between">
          <Button
            variant="destructive"
            className="gap-1.5"
            onClick={() => onDelete(m)}
          >
            <Trash2 className="size-4" /> Delete
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button className="gap-1.5" onClick={() => onEdit(m)}>
              <Pencil className="size-4" /> Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailSection({
  icon,
  title,
  empty,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : [children];
  const isEmpty = arr.filter(Boolean).length === 0;
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-muted-foreground">
        {icon}
        {title}
      </div>
      {isEmpty ? (
        <p className="text-xs text-muted-foreground italic">{empty}</p>
      ) : (
        <ul className="max-h-40 overflow-auto">{children}</ul>
      )}
    </div>
  );
}

// ============== Category Manager ==============
function CategoryManagerDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { categories, modules, addCategory, renameCategory, deleteCategory } = useAirbox();
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<{ old: string; next: string } | null>(null);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of modules) map.set(m.category, (map.get(m.category) ?? 0) + 1);
    return map;
  }, [modules]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage categories</DialogTitle>
          <DialogDescription>
            Categories drive grouping and the dropdown in the Add module form.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input
            placeholder="New category name…"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />
          <Button
            onClick={() => {
              const res = addCategory(newName);
              if (!res.ok) toast.error(res.error);
              else {
                toast.success("Category added.");
                setNewName("");
              }
            }}
            disabled={!newName.trim()}
          >
            Add
          </Button>
        </div>

        <ScrollArea className="h-72 rounded-md border border-border">
          <div className="p-2 flex flex-col gap-1">
            {categories.map((c) => {
              const count = counts.get(c) ?? 0;
              const isRenaming = renaming?.old === c;
              return (
                <div
                  key={c}
                  className="flex items-center gap-2 p-2 rounded hover:bg-accent/50"
                >
                  {isRenaming ? (
                    <Input
                      value={renaming.next}
                      onChange={(e) => setRenaming({ ...renaming, next: e.target.value })}
                      className="h-8"
                      autoFocus
                    />
                  ) : (
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{c}</div>
                      <div className="text-[10px] text-muted-foreground">{count} module(s)</div>
                    </div>
                  )}
                  {isRenaming ? (
                    <>
                      <Button
                        size="sm"
                        onClick={() => {
                          const res = renameCategory(renaming.old, renaming.next);
                          if (!res.ok) toast.error(res.error);
                          else {
                            toast.success("Renamed.");
                            setRenaming(null);
                          }
                        }}
                      >
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRenaming(null)}>
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        onClick={() => setRenaming({ old: c, next: c })}
                      >
                        <Pencil className="size-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-destructive hover:text-destructive"
                        onClick={() => {
                          const res = deleteCategory(c);
                          if (!res.ok) toast.error(res.error);
                          else toast.success("Category deleted.");
                        }}
                        disabled={count > 0}
                        title={count > 0 ? "Reassign modules first" : "Delete"}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </>
                  )}
                </div>
              );
            })}
            {categories.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-6">No categories yet.</p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
