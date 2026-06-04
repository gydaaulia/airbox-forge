import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useAirbox,
  SPECIAL_ACTIONS,
  type CrudAction,
  type Role,
  type SpecialAction,
} from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Shield, Plus, Copy, Trash2, Users, Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";

export const Route = createFileRoute("/rbac")({
  head: () => ({
    meta: [
      { title: "RBAC — Airbox" },
      { name: "description", content: "Manage default roles and permissions per product bundle." },
    ],
  }),
  component: RbacPage,
});

const CRUD: CrudAction[] = ["create", "read", "update", "delete"];

function RbacPage() {
  const {
    bundles,
    modules,
    roles,
    createRole,
    deleteRole,
    duplicateRole,
    setPermission,
    bulkSetCrud,
    applyRoleTemplate,
    syncRolesWithBundle,
  } = useAirbox();

  const realBundles = useMemo(
    () => bundles.filter((b) => !b.is_template || true).sort((a, b) => a.name.localeCompare(b.name)),
    [bundles],
  );
  const [bundleId, setBundleId] = useState<string>(realBundles[0]?.id ?? "");
  const bundle = realBundles.find((b) => b.id === bundleId);
  const bundleRoles = roles.filter((r) => r.bundle_id === bundleId);

  const [activeRoleId, setActiveRoleId] = useState<string>(bundleRoles[0]?.id ?? "");
  const role = roles.find((r) => r.id === activeRoleId);

  const bundleModules = useMemo(
    () => (bundle ? modules.filter((m) => bundle.module_ids.includes(m.id)) : []),
    [bundle, modules],
  );

  const grouped = useMemo(() => {
    const out = new Map<string, typeof bundleModules>();
    for (const m of bundleModules) {
      if (!out.has(m.category)) out.set(m.category, []);
      out.get(m.category)!.push(m);
    }
    return Array.from(out.entries());
  }, [bundleModules]);

  return (
    <div>
      <PageHeader
        title="Role-Based Access Control"
        description="Define default roles and per-module CRUD + special permissions for each product bundle."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        {/* Bundles list */}
        <Card className="p-3 h-fit">
          <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Product Bundles
          </div>
          <div className="flex flex-col gap-1">
            {realBundles.map((b) => {
              const count = roles.filter((r) => r.bundle_id === b.id).length;
              const active = b.id === bundleId;
              return (
                <button
                  key={b.id}
                  onClick={() => {
                    setBundleId(b.id);
                    const first = roles.find((r) => r.bundle_id === b.id);
                    setActiveRoleId(first?.id ?? "");
                  }}
                  className={`text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${
                    active ? "bg-primary/10 text-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="truncate">
                    <span className="font-medium text-foreground">{b.name}</span>
                    <span className="block text-[10px] font-mono text-muted-foreground">{b.code}</span>
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Roles + Matrix */}
        <div className="space-y-4 min-w-0">
          {!bundle ? (
            <Card className="p-12 text-center text-muted-foreground">Select a bundle.</Card>
          ) : (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-primary" />
                      <h3 className="font-semibold tracking-tight">{bundle.name} — Roles</h3>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {bundleRoles.length} role{bundleRoles.length === 1 ? "" : "s"} ·{" "}
                      {bundle.module_ids.length} modules
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        syncRolesWithBundle(bundle.id);
                        toast.success("Roles synced with bundle modules");
                      }}
                    >
                      Sync modules
                    </Button>
                    <NewRoleDialog
                      onCreate={(name, desc) => {
                        const id = createRole(bundle.id, name, desc);
                        setActiveRoleId(id);
                        toast.success("Role created");
                      }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {bundleRoles.length === 0 && (
                    <div className="text-xs text-muted-foreground">No roles yet — create one.</div>
                  )}
                  {bundleRoles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setActiveRoleId(r.id)}
                      className={`group inline-flex items-center gap-2 pl-3 pr-1 py-1.5 rounded-lg border text-xs transition-colors ${
                        r.id === activeRoleId
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-input bg-card hover:bg-muted"
                      }`}
                    >
                      <Users className="size-3" />
                      <span className="font-medium">{r.name}</span>
                      {r.is_default && (
                        <Badge variant="secondary" className="text-[9px] px-1 h-4">default</Badge>
                      )}
                      <span className="flex items-center">
                        <span
                          className="size-6 rounded grid place-items-center hover:bg-black/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            const id = duplicateRole(r.id);
                            if (id) {
                              setActiveRoleId(id);
                              toast.success("Role duplicated");
                            }
                          }}
                          role="button"
                        >
                          <Copy className="size-3" />
                        </span>
                        <span
                          className="size-6 rounded grid place-items-center hover:bg-black/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete role "${r.name}"?`)) {
                              deleteRole(r.id);
                              if (activeRoleId === r.id) setActiveRoleId("");
                            }
                          }}
                          role="button"
                        >
                          <Trash2 className="size-3" />
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </Card>

              {role ? (
                <PermissionMatrix
                  role={role}
                  grouped={grouped}
                  onToggle={(modId, action, value) =>
                    setPermission(role.id, modId, { [action]: value })
                  }
                  onToggleSpecial={(modId, action, value) => {
                    const p = role.permissions.find((x) => x.module_id === modId);
                    const cur = new Set(p?.special ?? []);
                    if (value) cur.add(action);
                    else cur.delete(action);
                    setPermission(role.id, modId, { special: Array.from(cur) as SpecialAction[] });
                  }}
                  onBulkCrud={(action, value) => bulkSetCrud(role.id, action, value)}
                  onApplyTemplate={(mode) => {
                    applyRoleTemplate(role.id, mode);
                    toast.success(`Applied "${mode}" template`);
                  }}
                />
              ) : (
                <Card className="p-12 text-center text-muted-foreground text-sm">
                  Select or create a role to edit permissions.
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function NewRoleDialog({ onCreate }: { onCreate: (name: string, desc: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5">
          <Plus className="size-4" /> New role
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New role</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Finance Manager" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            onClick={() => {
              if (!name.trim()) return toast.error("Name is required");
              onCreate(name.trim(), desc.trim());
              setOpen(false);
              setName("");
              setDesc("");
            }}
          >
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PermissionMatrix({
  role,
  grouped,
  onToggle,
  onToggleSpecial,
  onBulkCrud,
  onApplyTemplate,
}: {
  role: Role;
  grouped: Array<[string, Array<{ id: string; name: string; code: string }>]>;
  onToggle: (moduleId: string, action: CrudAction, value: boolean) => void;
  onToggleSpecial: (moduleId: string, action: SpecialAction, value: boolean) => void;
  onBulkCrud: (action: CrudAction, value: boolean) => void;
  onApplyTemplate: (mode: "full" | "read" | "approver" | "none") => void;
}) {
  const permMap = new Map(role.permissions.map((p) => [p.module_id, p]));

  return (
    <Card className="p-0 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h3 className="font-semibold text-sm tracking-tight">{role.name}</h3>
          {role.description && (
            <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => onApplyTemplate(v as "full" | "read" | "approver" | "none")}>
            <SelectTrigger className="h-8 w-[160px] text-xs">
              <SelectValue placeholder="Apply template…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full access</SelectItem>
              <SelectItem value="read">Read only</SelectItem>
              <SelectItem value="approver">Approver</SelectItem>
              <SelectItem value="none">No access</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted/40 sticky top-0">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground w-[28%]">Module</th>
              {CRUD.map((a) => (
                <th key={a} className="px-2 py-2.5 font-medium text-muted-foreground capitalize text-center">
                  <div>{a}</div>
                  <button
                    className="text-[10px] text-primary hover:underline"
                    onClick={() => {
                      const allOn = role.permissions.every((p) => p[a]);
                      onBulkCrud(a, !allOn);
                    }}
                  >
                    toggle all
                  </button>
                </th>
              ))}
              <th className="px-3 py-2.5 font-medium text-muted-foreground">Special access</th>
            </tr>
          </thead>
          <tbody>
            {grouped.map(([cat, mods]) => (
              <Fragment key={cat}>
                <tr key={`h-${cat}`} className="bg-muted/20">
                  <td colSpan={6} className="px-4 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    {cat}
                  </td>
                </tr>
                {mods.map((m) => {
                  const p = permMap.get(m.id);
                  return (
                    <tr key={m.id} className="border-t border-border/60 hover:bg-muted/30">
                      <td className="px-4 py-2">
                        <div className="font-medium text-foreground">{m.name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground">{m.code}</div>
                      </td>
                      {CRUD.map((a) => (
                        <td key={a} className="px-2 py-2 text-center">
                          <Checkbox
                            checked={!!p?.[a]}
                            onCheckedChange={(v) => onToggle(m.id, a, !!v)}
                          />
                        </td>
                      ))}
                      <td className="px-3 py-2">
                        <SpecialAccessDetail
                          moduleName={m.name}
                          selected={p?.special ?? []}
                          onToggle={(sa, v) => onToggleSpecial(m.id, sa, v)}
                        />
                      </td>

                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SpecialAccessDetail({
  moduleName,
  selected,
  onToggle,
}: {
  moduleName: string;
  selected: SpecialAction[];
  onToggle: (action: SpecialAction, value: boolean) => void;
}) {
  const count = selected.length;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 gap-1.5 text-[11px]">
          <Settings2 className="size-3" />
          Detail
          {count > 0 && (
            <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">
              {count}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3">
        <div className="mb-2">
          <div className="text-xs font-semibold">{moduleName}</div>
          <div className="text-[10px] text-muted-foreground">
            Special access — {count} of {SPECIAL_ACTIONS.length} enabled
          </div>
        </div>
        <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
          {SPECIAL_ACTIONS.map((sa) => {
            const on = selected.includes(sa);
            return (
              <label
                key={sa}
                className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer"
              >
                <Checkbox checked={on} onCheckedChange={(v) => onToggle(sa, !!v)} />
                <span className="text-xs capitalize">{sa}</span>
              </label>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

