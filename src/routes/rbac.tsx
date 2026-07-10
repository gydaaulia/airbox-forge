import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  useAirbox,
  SPECIAL_ACTIONS,
  type CrudAction,
  type Role,
  type SpecialAction,
  type User,
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Shield,
  Plus,
  Copy,
  Trash2,
  Users,
  Settings2,
  Search,
  ArrowUpDown,
  RefreshCw,
  Package,
  ChevronDown,
  ChevronRight,
  Check,
  Filter,
} from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
type RoleFilter = "all" | "dirty" | "inactive" | "active" | "default";

function RbacPage() {
  const {
    bundles,
    modules,
    roles,
    users,
    assignments,
    companies,
    createRole,
    deleteRole,
    duplicateRole,
    setPermission,
    bulkSetCrud,
    applyRoleTemplate,
    syncRolesWithBundle,
  } = useAirbox();

  const realBundles = useMemo(
    () => [...bundles].sort((a, b) => a.name.localeCompare(b.name)),
    [bundles],
  );
  const [bundleId, setBundleId] = useState<string>(realBundles[0]?.id ?? "");
  const bundle = realBundles.find((b) => b.id === bundleId);
  const bundleRoles = roles.filter((r) => r.bundle_id === bundleId);

  const [activeRoleId, setActiveRoleId] = useState<string>(bundleRoles[0]?.id ?? "");
  const role = roles.find((r) => r.id === activeRoleId);

  const [confirmAction, setConfirmAction] = useState<
    { type: "copy" | "delete"; roleId: string; roleName: string } | null
  >(null);

  const [dirtyRoleIds, setDirtyRoleIds] = useState<Set<string>>(new Set());
  const [pendingSwitch, setPendingSwitch] = useState<
    | { type: "bundle"; targetId: string }
    | { type: "role"; targetId: string }
    | null
  >(null);

  const markDirty = (id: string) =>
    setDirtyRoleIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });

  const clearDirtyForBundle = (bid: string) =>
    setDirtyRoleIds((prev) => {
      const next = new Set(prev);
      for (const r of roles) if (r.bundle_id === bid && next.has(r.id)) next.delete(r.id);
      return next;
    });

  const hasDirtyInBundle = useMemo(
    () => bundleRoles.some((r) => dirtyRoleIds.has(r.id)),
    [bundleRoles, dirtyRoleIds],
  );

  const requestSwitchBundle = (targetId: string) => {
    if (targetId === bundleId) return;
    if (hasDirtyInBundle) {
      setPendingSwitch({ type: "bundle", targetId });
      return;
    }
    setBundleId(targetId);
    const first = roles.find((r) => r.bundle_id === targetId);
    setActiveRoleId(first?.id ?? "");
  };

  const requestSwitchRole = (targetId: string) => {
    if (targetId === activeRoleId) return;
    if (activeRoleId && dirtyRoleIds.has(activeRoleId)) {
      setPendingSwitch({ type: "role", targetId });
      return;
    }
    setActiveRoleId(targetId);
  };

  const doSync = () => {
    if (!bundle) return;
    syncRolesWithBundle(bundle.id);
    clearDirtyForBundle(bundle.id);
    toast.success("Roles synced with bundle modules");
  };

  useEffect(() => {
    if (!hasDirtyInBundle) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasDirtyInBundle]);

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

  const usersByRole = useMemo(() => {
    const map = new Map<string, RoleUser[]>();
    const userById = new Map(users.map((u) => [u.id, u]));
    const companyById = new Map(companies.map((c) => [c.id, c]));
    for (const a of assignments) {
      const u = userById.get(a.user_id);
      if (!u) continue;
      const c = companyById.get(a.company_id);
      const arr = map.get(a.role_id) ?? [];
      arr.push({
        id: u.id,
        name: u.name,
        email: u.email,
        status: u.status,
        companyName: c?.name ?? "—",
      });
      map.set(a.role_id, arr);
    }
    return map;
  }, [assignments, users, companies]);

  // dirty count per bundle (for combobox display)
  const dirtyByBundle = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of roles) {
      if (dirtyRoleIds.has(r.id)) map.set(r.bundle_id, (map.get(r.bundle_id) ?? 0) + 1);
    }
    return map;
  }, [roles, dirtyRoleIds]);

  const rolesByBundle = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of roles) map.set(r.bundle_id, (map.get(r.bundle_id) ?? 0) + 1);
    return map;
  }, [roles]);

  return (
    <div>
      <PageHeader
        title="Role-Based Access Control"
        description="Define default roles and per-module CRUD + special permissions for each product bundle."
      />

      {/* Top command bar — scales to hundreds of bundles */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <BundlePicker
            bundles={realBundles}
            value={bundleId}
            onChange={requestSwitchBundle}
            rolesByBundle={rolesByBundle}
            dirtyByBundle={dirtyByBundle}
          />
          {bundle && (
            <>
              <div className="hidden md:flex items-center gap-4 text-xs text-muted-foreground border-l border-border pl-3">
                <span className="flex items-center gap-1.5">
                  <Package className="size-3.5" />
                  {bundle.module_ids.length} modules
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="size-3.5" />
                  {bundleRoles.length} role{bundleRoles.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {hasDirtyInBundle && (
                  <span className="text-[11px] text-amber-600 font-medium">
                    Unsynced changes
                  </span>
                )}
                <Button
                  variant={hasDirtyInBundle ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "h-8 gap-1.5",
                    hasDirtyInBundle &&
                      "bg-amber-500 hover:bg-amber-500/90 text-white shadow-[0_0_0_3px_rgba(245,158,11,0.18)] animate-pulse",
                  )}
                  onClick={doSync}
                  disabled={!hasDirtyInBundle && bundleRoles.every((r) => r.is_active)}
                >
                  <RefreshCw className="size-3.5" />
                  Sync
                </Button>
              </div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4">
        {!bundle ? (
          <Card className="p-6 text-center text-muted-foreground text-sm h-fit lg:col-span-2">
            Select a bundle to start managing roles.
          </Card>
        ) : (
          <>
            <RolesSidebar
              bundle={bundle}
              roles={bundleRoles}
              activeRoleId={activeRoleId}
              dirtyRoleIds={dirtyRoleIds}
              usersByRole={usersByRole}
              onSelect={requestSwitchRole}
              onCreate={(name, desc) => {
                const id = createRole(bundle.id, name, desc);
                setActiveRoleId(id);
                markDirty(id);
                toast.success("Role created (inactive). Click Sync to activate.");
              }}
              onCopy={(r) => setConfirmAction({ type: "copy", roleId: r.id, roleName: r.name })}
              onDelete={(r) => setConfirmAction({ type: "delete", roleId: r.id, roleName: r.name })}
            />

            <div className="min-w-0">
              {role ? (
                <PermissionMatrix
                  role={role}
                  grouped={grouped}
                  totalModules={bundleModules.length}
                  onToggle={(modId, action, value) => {
                    setPermission(role.id, modId, { [action]: value });
                    markDirty(role.id);
                  }}
                  onToggleSpecial={(modId, action, value) => {
                    const p = role.permissions.find((x) => x.module_id === modId);
                    const cur = new Set(p?.special ?? []);
                    if (value) cur.add(action);
                    else cur.delete(action);
                    setPermission(role.id, modId, { special: Array.from(cur) as SpecialAction[] });
                    markDirty(role.id);
                  }}
                  onBulkCrud={(action, value) => {
                    bulkSetCrud(role.id, action, value);
                    markDirty(role.id);
                  }}
                  onApplyTemplate={(mode) => {
                    applyRoleTemplate(role.id, mode);
                    markDirty(role.id);
                    toast.success(`Applied "${mode}" template`);
                  }}
                />
              ) : (
                <Card className="p-12 text-center text-muted-foreground text-sm">
                  Select or create a role to edit permissions.
                </Card>
              )}
            </div>
          </>
        )}
      </div>

      {/* Copy confirmation */}
      <AlertDialog
        open={confirmAction?.type === "copy"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Copy role?</AlertDialogTitle>
            <AlertDialogDescription>
              Duplicate role "{confirmAction?.roleName ?? ""}" with all its permissions.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.type === "copy") {
                  const id = duplicateRole(confirmAction.roleId);
                  if (id) {
                    setActiveRoleId(id);
                    toast.success("Role duplicated");
                  }
                }
                setConfirmAction(null);
              }}
            >
              Copy
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete confirmation */}
      <AlertDialog
        open={confirmAction?.type === "delete"}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete role?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{confirmAction?.roleName ?? ""}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmAction(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.type === "delete") {
                  deleteRole(confirmAction.roleId);
                  if (activeRoleId === confirmAction.roleId) setActiveRoleId("");
                  toast.success("Role deleted");
                }
                setConfirmAction(null);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unsynced changes confirmation */}
      <AlertDialog
        open={pendingSwitch !== null}
        onOpenChange={(open) => !open && setPendingSwitch(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unsynced role access changes</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsynced changes on{" "}
              {dirtyRoleIds.size === 1 ? "1 role" : `${dirtyRoleIds.size} roles`}. Sync them
              now to apply to bundle modules, or discard to continue without saving.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingSwitch(null)}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => {
                if (!pendingSwitch) return;
                if (pendingSwitch.type === "bundle") {
                  clearDirtyForBundle(bundleId);
                  setBundleId(pendingSwitch.targetId);
                  const first = roles.find((r) => r.bundle_id === pendingSwitch.targetId);
                  setActiveRoleId(first?.id ?? "");
                } else {
                  if (activeRoleId) {
                    setDirtyRoleIds((prev) => {
                      const next = new Set(prev);
                      next.delete(activeRoleId);
                      return next;
                    });
                  }
                  setActiveRoleId(pendingSwitch.targetId);
                }
                setPendingSwitch(null);
              }}
            >
              Discard
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (!pendingSwitch || !bundle) return;
                syncRolesWithBundle(bundle.id);
                clearDirtyForBundle(bundle.id);
                toast.success("Roles synced");
                if (pendingSwitch.type === "bundle") {
                  setBundleId(pendingSwitch.targetId);
                  const first = roles.find((r) => r.bundle_id === pendingSwitch.targetId);
                  setActiveRoleId(first?.id ?? "");
                } else {
                  setActiveRoleId(pendingSwitch.targetId);
                }
                setPendingSwitch(null);
              }}
            >
              Sync &amp; continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* -------------------- Bundle picker (combobox) -------------------- */

function BundlePicker({
  bundles,
  value,
  onChange,
  rolesByBundle,
  dirtyByBundle,
}: {
  bundles: Array<{ id: string; name: string; code: string; category: string }>;
  value: string;
  onChange: (id: string) => void;
  rolesByBundle: Map<string, number>;
  dirtyByBundle: Map<string, number>;
}) {
  const [open, setOpen] = useState(false);
  const current = bundles.find((b) => b.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="h-9 justify-between min-w-[260px] max-w-[420px] gap-2"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Package className="size-4 text-primary shrink-0" />
            {current ? (
              <span className="flex items-center gap-2 min-w-0">
                <span className="truncate font-medium">{current.name}</span>
                <span className="text-[10px] font-mono text-muted-foreground shrink-0">
                  {current.code}
                </span>
              </span>
            ) : (
              <span className="text-muted-foreground">Select bundle…</span>
            )}
          </span>
          <ChevronDown className="size-3.5 opacity-60 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[380px] p-0">
        <Command>
          <CommandInput placeholder="Search bundle by name or code…" />
          <CommandList className="max-h-[380px]">
            <CommandEmpty>No bundles found.</CommandEmpty>
            <CommandGroup heading={`${bundles.length} bundle${bundles.length === 1 ? "" : "s"}`}>
              {bundles.map((b) => {
                const roleCount = rolesByBundle.get(b.id) ?? 0;
                const dirtyCount = dirtyByBundle.get(b.id) ?? 0;
                const active = b.id === value;
                return (
                  <CommandItem
                    key={b.id}
                    value={`${b.name} ${b.code} ${b.category}`}
                    onSelect={() => {
                      onChange(b.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2"
                  >
                    <Check
                      className={cn(
                        "size-3.5 shrink-0",
                        active ? "opacity-100 text-primary" : "opacity-0",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{b.name}</span>
                        {dirtyCount > 0 && (
                          <span
                            className="size-1.5 rounded-full bg-amber-500 shrink-0"
                            title={`${dirtyCount} unsynced role${dirtyCount === 1 ? "" : "s"}`}
                          />
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">
                        {b.code} · {b.category}
                      </div>
                    </div>
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {roleCount}
                    </Badge>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------- New role dialog -------------------- */

function NewRoleDialog({ onCreate }: { onCreate: (name: string, desc: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1.5">
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

type RoleUser = { id: string; name: string; email: string; status: User["status"]; companyName: string };

/* -------------------- Roles sidebar -------------------- */

function RolesSidebar({
  bundle,
  roles,
  activeRoleId,
  dirtyRoleIds,
  usersByRole,
  onSelect,
  onCreate,
  onCopy,
  onDelete,
}: {
  bundle: { id: string; name: string; module_ids: string[] };
  roles: Role[];
  activeRoleId: string;
  dirtyRoleIds: Set<string>;
  usersByRole: Map<string, RoleUser[]>;
  onSelect: (id: string) => void;
  onCreate: (name: string, desc: string) => void;
  onCopy: (r: Role) => void;
  onDelete: (r: Role) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "permissions" | "users">("name");
  const [filter, setFilter] = useState<RoleFilter>("all");

  const counts = useMemo(() => {
    return {
      all: roles.length,
      dirty: roles.filter((r) => dirtyRoleIds.has(r.id)).length,
      inactive: roles.filter((r) => !r.is_active).length,
      active: roles.filter((r) => r.is_active).length,
      default: roles.filter((r) => r.is_default).length,
    };
  }, [roles, dirtyRoleIds]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = roles.filter((r) => {
      if (q && !r.name.toLowerCase().includes(q) && !r.description.toLowerCase().includes(q))
        return false;
      if (filter === "dirty" && !dirtyRoleIds.has(r.id)) return false;
      if (filter === "inactive" && r.is_active) return false;
      if (filter === "active" && !r.is_active) return false;
      if (filter === "default" && !r.is_default) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === "permissions") {
        const ca = a.permissions.reduce(
          (n, p) => n + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0) + p.special.length,
          0,
        );
        const cb = b.permissions.reduce(
          (n, p) => n + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0) + p.special.length,
          0,
        );
        return cb - ca;
      }
      if (sortBy === "users") {
        return (usersByRole.get(b.id)?.length ?? 0) - (usersByRole.get(a.id)?.length ?? 0);
      }
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [roles, query, sortBy, filter, dirtyRoleIds, usersByRole]);

  const FILTERS: Array<{ id: RoleFilter; label: string; count: number; tone?: string }> = [
    { id: "all", label: "All", count: counts.all },
    { id: "dirty", label: "Unsynced", count: counts.dirty, tone: "amber" },
    { id: "inactive", label: "Inactive", count: counts.inactive },
    { id: "default", label: "Default", count: counts.default },
  ];

  return (
    <Card className="p-0 overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[520px]">
      {/* Header */}
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Shield className="size-4 text-primary shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
            Roles
          </div>
          <div className="text-sm font-semibold truncate">{bundle.name}</div>
        </div>
        <NewRoleDialog onCreate={onCreate} />
      </div>

      {/* Search + sort */}
      <div className="p-2 border-b border-border flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="size-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search roles…"
            className="h-8 pl-7 text-xs"
          />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
          <SelectTrigger className="h-8 w-8 px-0 justify-center" title="Sort">
            <ArrowUpDown className="size-3.5" />
          </SelectTrigger>
          <SelectContent align="end">
            <SelectItem value="name">Name (A–Z)</SelectItem>
            <SelectItem value="permissions">Most permissions</SelectItem>
            <SelectItem value="users">Most users</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filter chips */}
      <div className="px-2 py-1.5 border-b border-border flex items-center gap-1 overflow-x-auto">
        <Filter className="size-3 text-muted-foreground shrink-0 mx-1" />
        {FILTERS.map((f) => {
          const on = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 text-[11px] px-2 h-6 rounded-full border transition-colors flex items-center gap-1",
                on
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-transparent text-muted-foreground border-border hover:bg-muted",
                f.tone === "amber" && !on && f.count > 0 && "text-amber-600 border-amber-500/40",
              )}
            >
              {f.label}
              <span
                className={cn(
                  "text-[10px] px-1 rounded",
                  on ? "bg-primary-foreground/20" : "bg-muted",
                )}
              >
                {f.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8 px-4">
            {roles.length === 0
              ? "No roles yet — create one to get started."
              : "No roles match the current filter."}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((r) => (
              <RoleRow
                key={r.id}
                role={r}
                active={r.id === activeRoleId}
                dirty={dirtyRoleIds.has(r.id)}
                users={usersByRole.get(r.id) ?? []}
                onSelect={() => onSelect(r.id)}
                onCopy={() => onCopy(r)}
                onDelete={() => onDelete(r)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer count */}
      <div className="border-t border-border px-3 py-2 text-[10px] text-muted-foreground">
        Showing {filtered.length} of {roles.length}
      </div>
    </Card>
  );
}

function RoleRow({
  role: r,
  active,
  dirty,
  users,
  onSelect,
  onCopy,
  onDelete,
}: {
  role: Role;
  active: boolean;
  dirty: boolean;
  users: RoleUser[];
  onSelect: () => void;
  onCopy: () => void;
  onDelete: () => void;
}) {
  const grantCount = r.permissions.reduce(
    (n, p) => n + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0),
    0,
  );
  return (
    <div
      className={cn(
        "group relative rounded-md border transition-colors cursor-pointer",
        active
          ? "bg-primary/10 border-primary/40"
          : "border-transparent hover:bg-muted hover:border-border",
      )}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 px-2.5 py-2">
        <Users className={cn("size-3.5 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium truncate">{r.name}</span>
            {!r.is_active && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 h-3.5 shrink-0 border-amber-500/60 text-amber-600 bg-amber-500/10"
                title="Inactive — click Sync to activate"
              >
                inactive
              </Badge>
            )}
            {r.is_default && (
              <Badge variant="secondary" className="text-[9px] px-1 h-3.5 shrink-0">
                default
              </Badge>
            )}
            {dirty && (
              <span
                className="size-1.5 rounded-full bg-amber-500 shrink-0"
                title="Unsynced changes"
              />
            )}
          </div>
          <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <span>{grantCount} grant{grantCount === 1 ? "" : "s"}</span>
            <span>·</span>
            <RoleUsersPopover roleName={r.name} users={users} />
          </div>
        </div>
        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0 transition-opacity">
          <button
            className="size-6 rounded grid place-items-center hover:bg-background"
            onClick={(e) => {
              e.stopPropagation();
              onCopy();
            }}
            title="Duplicate"
          >
            <Copy className="size-3" />
          </button>
          <button
            className="size-6 rounded grid place-items-center hover:bg-background hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

function RoleUsersPopover({ roleName, users }: { roleName: string; users: RoleUser[] }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="inline-flex items-center gap-1 hover:text-foreground hover:underline cursor-pointer"
          onClick={(e) => e.stopPropagation()}
          title="View users"
        >
          <Users className="size-2.5" />
          {users.length} user{users.length === 1 ? "" : "s"}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-3 py-2 border-b border-border">
          <div className="text-xs font-semibold truncate">{roleName}</div>
          <div className="text-[10px] text-muted-foreground">
            {users.length} user{users.length === 1 ? "" : "s"} assigned
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {users.length === 0 ? (
            <div className="text-[11px] text-muted-foreground text-center py-6 px-3">
              No users assigned to this role yet.
            </div>
          ) : (
            users.map((u) => (
              <div key={u.id} className="px-3 py-1.5 hover:bg-muted text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium truncate">{u.name}</span>
                  <Badge
                    variant={u.status === "active" ? "secondary" : "outline"}
                    className="text-[9px] h-3.5 px-1 capitalize shrink-0"
                  >
                    {u.status}
                  </Badge>
                </div>
                <div className="text-[10px] text-muted-foreground truncate">{u.email}</div>
                <div className="text-[10px] text-muted-foreground truncate">{u.companyName}</div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/* -------------------- Permission matrix -------------------- */

function PermissionMatrix({
  role,
  grouped,
  totalModules,
  onToggle,
  onToggleSpecial,
  onBulkCrud,
  onApplyTemplate,
}: {
  role: Role;
  grouped: Array<[string, Array<{ id: string; name: string; code: string }>]>;
  totalModules: number;
  onToggle: (moduleId: string, action: CrudAction, value: boolean) => void;
  onToggleSpecial: (moduleId: string, action: SpecialAction, value: boolean) => void;
  onBulkCrud: (action: CrudAction, value: boolean) => void;
  onApplyTemplate: (mode: "full" | "read" | "approver" | "none") => void;
}) {
  const permMap = new Map(role.permissions.map((p) => [p.module_id, p]));
  const [moduleQuery, setModuleQuery] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const q = moduleQuery.trim().toLowerCase();
  const filteredGroups = useMemo(() => {
    if (!q) return grouped;
    return grouped
      .map(
        ([cat, mods]) =>
          [
            cat,
            mods.filter(
              (m) =>
                m.name.toLowerCase().includes(q) ||
                m.code.toLowerCase().includes(q) ||
                cat.toLowerCase().includes(q),
            ),
          ] as const,
      )
      .filter(([, mods]) => mods.length > 0);
  }, [grouped, q]);

  const visibleCount = filteredGroups.reduce((n, [, mods]) => n + mods.length, 0);
  const grantTotal = role.permissions.reduce(
    (n, p) => n + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0),
    0,
  );
  const specialTotal = role.permissions.reduce((n, p) => n + p.special.length, 0);

  const toggleCollapse = (cat: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });

  return (
    <Card className="p-0 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-sm tracking-tight">{role.name}</h3>
              {!role.is_active && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-500/60 text-amber-600 bg-amber-500/10"
                >
                  inactive
                </Badge>
              )}
              {role.is_default && (
                <Badge variant="secondary" className="text-[10px]">default</Badge>
              )}
            </div>
            {role.description && (
              <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
            )}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1.5">
              <span>{totalModules} modules</span>
              <span>·</span>
              <span>{grantTotal} CRUD grants</span>
              <span>·</span>
              <span>{specialTotal} special</span>
            </div>
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

        {/* Toolbar: search + bulk toggles */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="size-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={moduleQuery}
              onChange={(e) => setModuleQuery(e.target.value)}
              placeholder="Search modules by name, code, or category…"
              className="h-8 pl-8 text-xs"
            />
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <span className="hidden sm:inline">Bulk:</span>
            {CRUD.map((a) => {
              const allOn = role.permissions.length > 0 && role.permissions.every((p) => p[a]);
              return (
                <Button
                  key={a}
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-[11px] capitalize gap-1"
                  onClick={() => onBulkCrud(a, !allOn)}
                >
                  <Checkbox checked={allOn} className="pointer-events-none size-3" />
                  {a}
                </Button>
              );
            })}
          </div>
        </div>

        {q && (
          <div className="text-[10px] text-muted-foreground mt-2">
            {visibleCount} of {totalModules} module{totalModules === 1 ? "" : "s"} match
          </div>
        )}
      </div>

      {/* Table */}
      <div className="overflow-auto max-h-[calc(100vh-360px)]">
        <table className="w-full text-xs">
          <thead className="bg-muted/60 sticky top-0 z-10">
            <tr className="text-left">
              <th className="px-4 py-2.5 font-medium text-muted-foreground w-[42%]">Module</th>
              {CRUD.map((a) => (
                <th key={a} className="px-2 py-2.5 font-medium text-muted-foreground capitalize text-center w-[8%]">
                  {a}
                </th>
              ))}
              <th className="px-3 py-2.5 font-medium text-muted-foreground text-right">Special access</th>
            </tr>
          </thead>
          <tbody>
            {filteredGroups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground text-xs">
                  No modules match “{moduleQuery}”.
                </td>
              </tr>
            ) : (
              filteredGroups.map(([cat, mods]) => {
                const isCollapsed = collapsed.has(cat);
                const catCounts = mods.reduce(
                  (acc, m) => {
                    const p = permMap.get(m.id);
                    if (p?.create) acc.c++;
                    if (p?.read) acc.r++;
                    if (p?.update) acc.u++;
                    if (p?.delete) acc.d++;
                    return acc;
                  },
                  { c: 0, r: 0, u: 0, d: 0 },
                );
                return (
                  <Fragment key={cat}>
                    <tr
                      className="bg-muted/30 sticky top-[41px] z-[5] cursor-pointer hover:bg-muted/50"
                      onClick={() => toggleCollapse(cat)}
                    >
                      <td className="px-3 py-1.5">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                          {isCollapsed ? (
                            <ChevronRight className="size-3" />
                          ) : (
                            <ChevronDown className="size-3" />
                          )}
                          {cat}
                          <Badge variant="secondary" className="text-[9px] h-3.5 px-1 normal-case">
                            {mods.length}
                          </Badge>
                        </div>
                      </td>
                      <td className="text-center text-[10px] text-muted-foreground">{catCounts.c}</td>
                      <td className="text-center text-[10px] text-muted-foreground">{catCounts.r}</td>
                      <td className="text-center text-[10px] text-muted-foreground">{catCounts.u}</td>
                      <td className="text-center text-[10px] text-muted-foreground">{catCounts.d}</td>
                      <td />
                    </tr>
                    {!isCollapsed &&
                      mods.map((m) => {
                        const p = permMap.get(m.id);
                        return (
                          <tr key={m.id} className="border-t border-border/60 hover:bg-muted/30">
                            <td className="px-4 py-2">
                              <div className="font-medium text-foreground truncate">{m.name}</div>
                              <div className="text-[10px] font-mono text-muted-foreground truncate">
                                {m.code}
                              </div>
                            </td>
                            {CRUD.map((a) => (
                              <td key={a} className="px-2 py-2 text-center">
                                <Checkbox
                                  checked={!!p?.[a]}
                                  onCheckedChange={(v) => onToggle(m.id, a, !!v)}
                                />
                              </td>
                            ))}
                            <td className="px-3 py-2 text-right">
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
                );
              })
            )}
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
        <div className="flex gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] flex-1"
            onClick={() => {
              for (const sa of SPECIAL_ACTIONS) {
                if (!selected.includes(sa)) onToggle(sa, true);
              }
            }}
          >
            Select all
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-6 text-[10px] flex-1"
            onClick={() => {
              for (const sa of SPECIAL_ACTIONS) {
                if (selected.includes(sa)) onToggle(sa, false);
              }
            }}
          >
            Unselect all
          </Button>
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
