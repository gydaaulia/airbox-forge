import { Fragment } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
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
import { Shield, Plus, Copy, Trash2, Users, Settings2, Search, ArrowUpDown, RefreshCw } from "lucide-react";
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
    () => bundles.filter((b) => !b.is_template || true).sort((a, b) => a.name.localeCompare(b.name)),
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

  // Dirty-state tracking for unsaved role permission changes
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

  // Users assigned per role within current bundle
  const usersByRole = useMemo(() => {
    const map = new Map<string, Array<{ id: string; name: string; email: string; status: User["status"]; companyName: string }>>();
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


  return (
    <div>
      <PageHeader
        title="Role-Based Access Control"
        description="Define default roles and per-module CRUD + special permissions for each product bundle."
      />

      <div className="grid grid-cols-1 lg:grid-cols-[220px_280px_1fr] gap-4">
        {/* Bundles list */}
        <Card className="p-3 h-fit">
          <div className="px-2 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
            Product Bundles
          </div>
          <div className="flex flex-col gap-1 max-h-[calc(100vh-220px)] overflow-y-auto">
            {realBundles.map((b) => {
              const count = roles.filter((r) => r.bundle_id === b.id).length;
              const active = b.id === bundleId;
              const hasDirty = roles.some((r) => r.bundle_id === b.id && dirtyRoleIds.has(r.id));
              return (
                <button
                  key={b.id}
                  onClick={() => requestSwitchBundle(b.id)}
                  className={`text-left px-3 py-2 rounded-lg text-sm flex items-center justify-between gap-2 transition-colors ${
                    active ? "bg-primary/10 text-foreground" : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="truncate flex items-center gap-1.5">
                    {hasDirty && (
                      <span className="size-1.5 rounded-full bg-amber-500 shrink-0" title="Unsynced changes" />
                    )}
                    <span className="min-w-0">
                      <span className="font-medium text-foreground block truncate">{b.name}</span>
                      <span className="block text-[10px] font-mono text-muted-foreground">{b.code}</span>
                    </span>
                  </span>
                  <Badge variant="secondary" className="text-[10px]">{count}</Badge>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Roles sidebar */}
        {!bundle ? (
          <Card className="p-6 text-center text-muted-foreground text-sm h-fit">
            Select a bundle.
          </Card>
        ) : (
          <RolesSidebar
            bundle={bundle}
            roles={bundleRoles}
            activeRoleId={activeRoleId}
            dirtyRoleIds={dirtyRoleIds}
            hasDirty={hasDirtyInBundle}
            usersByRole={usersByRole}
            onSelect={requestSwitchRole}
            onSync={doSync}
            onCreate={(name, desc) => {
              const id = createRole(bundle.id, name, desc);
              setActiveRoleId(id);
              toast.success("Role created");
            }}
            onCopy={(r) => setConfirmAction({ type: "copy", roleId: r.id, roleName: r.name })}
            onDelete={(r) => setConfirmAction({ type: "delete", roleId: r.id, roleName: r.name })}
          />
        )}

        {/* Matrix detail */}
        <div className="space-y-4 min-w-0">
          {bundle && (
            <>
              {role ? (
                <PermissionMatrix
                  role={role}
                  grouped={grouped}
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
            </>
          )}

          {/* Copy confirmation */}
          <AlertDialog
            open={confirmAction?.type === "copy"}
            onOpenChange={(open) => {
              if (!open) setConfirmAction(null);
            }}
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
            onOpenChange={(open) => {
              if (!open) setConfirmAction(null);
            }}
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

type RoleUser = { id: string; name: string; email: string; status: User["status"]; companyName: string };

function RolesSidebar({
  bundle,
  roles,
  activeRoleId,
  dirtyRoleIds,
  hasDirty,
  usersByRole,
  onSelect,
  onSync,
  onCreate,
  onCopy,
  onDelete,
}: {
  bundle: { id: string; name: string; module_ids: string[] };
  roles: Role[];
  activeRoleId: string;
  dirtyRoleIds: Set<string>;
  hasDirty: boolean;
  usersByRole: Map<string, RoleUser[]>;
  onSelect: (id: string) => void;
  onSync: () => void;
  onCreate: (name: string, desc: string) => void;
  onCopy: (r: Role) => void;
  onDelete: (r: Role) => void;
}) {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "permissions">("name");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = roles.filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q),
    );
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
      return a.name.localeCompare(b.name);
    });
    return list;
  }, [roles, query, sortBy]);

  const dirtyCount = useMemo(
    () => roles.filter((r) => dirtyRoleIds.has(r.id)).length,
    [roles, dirtyRoleIds],
  );

  return (
    <Card className="p-0 h-fit overflow-hidden flex flex-col max-h-[calc(100vh-160px)]">
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="size-4 text-primary shrink-0" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold truncate">{bundle.name}</div>
            <div className="text-[10px] text-muted-foreground">
              {roles.length} role{roles.length === 1 ? "" : "s"} · {bundle.module_ids.length} modules
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <NewRoleDialog onCreate={onCreate} />
          <Button
            variant={hasDirty ? "default" : "outline"}
            size="sm"
            className={`h-8 gap-1.5 ${
              hasDirty
                ? "bg-amber-500 hover:bg-amber-500/90 text-white shadow-[0_0_0_3px_rgba(245,158,11,0.18)] animate-pulse"
                : ""
            }`}
            onClick={onSync}
            title={hasDirty ? "You have unsynced changes" : "Sync modules"}
          >
            <RefreshCw className="size-3.5" />
            Sync
            {hasDirty && (
              <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-white text-amber-600">
                {dirtyCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

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
        <Button
          variant="outline"
          size="sm"
          className="h-8 px-2"
          onClick={() => setSortBy(sortBy === "name" ? "permissions" : "name")}
          title={`Sort by ${sortBy === "name" ? "permissions" : "name"}`}
        >
          <ArrowUpDown className="size-3.5" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-1.5">
        {filtered.length === 0 ? (
          <div className="text-xs text-muted-foreground text-center py-8">
            {roles.length === 0 ? "No roles yet — create one." : "No roles match."}
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {filtered.map((r) => {
              const active = r.id === activeRoleId;
              const dirty = dirtyRoleIds.has(r.id);
              const grantCount = r.permissions.reduce(
                (n, p) => n + (p.create ? 1 : 0) + (p.read ? 1 : 0) + (p.update ? 1 : 0) + (p.delete ? 1 : 0),
                0,
              );
              const roleUsers = usersByRole.get(r.id) ?? [];
              return (
                <div
                  key={r.id}
                  className={`group relative rounded-md border transition-colors cursor-pointer ${
                    active
                      ? "bg-primary/10 border-primary/40"
                      : "border-transparent hover:bg-muted hover:border-border"
                  }`}
                  onClick={() => onSelect(r.id)}
                >
                  <div className="flex items-center gap-2 px-2.5 py-2">
                    <Users className={`size-3.5 shrink-0 ${active ? "text-primary" : "text-muted-foreground"}`} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-medium truncate">{r.name}</span>
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
                        <RoleUsersPopover roleName={r.name} users={roleUsers} />
                      </div>
                    </div>
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                      <button
                        className="size-6 rounded grid place-items-center hover:bg-background"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCopy(r);
                        }}
                        title="Duplicate"
                      >
                        <Copy className="size-3" />
                      </button>
                      <button
                        className="size-6 rounded grid place-items-center hover:bg-background hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(r);
                        }}
                        title="Delete"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </Card>
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

