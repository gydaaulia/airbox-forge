import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useAirbox,
  type Assignment,
  type CrudAction,
  type SpecialAction,
  SPECIAL_ACTIONS,
} from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Copy,
  Mail,
  Settings2,
  Trash2,
  UserPlus,
  RefreshCw,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/companies/$companyId")({
  head: () => ({
    meta: [{ title: "Company Users — Airbox" }],
  }),
  component: CompanyUsersPage,
});

function CompanyUsersPage() {
  const { companyId } = Route.useParams();
  const {
    companies,
    subscriptions,
    bundles,
    roles,
    users,
    invitations,
    assignments,
    inviteUser,
    revokeInvitation,
    resendInvitation,
    setAssignmentRole,
    removeAssignment,
    setUserStatus,
  } = useAirbox();

  const company = companies.find((c) => c.id === companyId);
  const companySubs = subscriptions.filter(
    (s) => s.company_id === companyId && s.status === "active",
  );
  const companyBundleIds = new Set(companySubs.map((s) => s.bundle_id));
  const availableRoles = roles.filter((r) => companyBundleIds.has(r.bundle_id));

  const companyAssignments = assignments.filter((a) => a.company_id === companyId);
  const companyInvites = invitations.filter(
    (i) => i.company_id === companyId && i.status === "pending",
  );

  const [open, setOpen] = useState(false);
  const [editAssignment, setEditAssignment] = useState<Assignment | null>(null);

  if (!company) {
    return (
      <div>
        <PageHeader title="Company not found" />
        <Link to="/companies" className="text-sm text-primary underline">
          Back to companies
        </Link>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={company.name}
        description={`${company.industry} · ${company.employees} employees · ${availableRoles.length} roles available from ${companySubs.length} active bundles`}
        actions={
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="gap-1.5">
              <Link to="/companies">
                <ArrowLeft className="size-4" /> All companies
              </Link>
            </Button>
            <InviteDialog
              open={open}
              onOpenChange={setOpen}
              companyId={companyId}
              availableRoles={availableRoles.map((r) => ({
                id: r.id,
                name: r.name,
                bundle:
                  bundles.find((b) => b.id === r.bundle_id)?.name ?? "—",
              }))}
              onInvite={(payload) => {
                if (availableRoles.length === 0) {
                  toast.error(
                    "This company has no active subscriptions — assign a bundle first.",
                  );
                  return;
                }
                const { link } = inviteUser(payload);
                navigator.clipboard?.writeText(link).catch(() => {});
                toast.success("Invitation sent", {
                  description: "Invite link copied to clipboard.",
                  action: {
                    label: "Open",
                    onClick: () => window.open(link, "_blank"),
                  },
                });
                setOpen(false);
              }}
            />
          </div>
        }
      />

      {availableRoles.length === 0 && (
        <Card className="p-4 mb-4 border-dashed">
          <div className="text-sm">
            No active bundle on this company. Assign a bundle from{" "}
            <Link to="/companies" className="text-primary underline">
              Companies
            </Link>{" "}
            before inviting users — roles are scoped to subscribed bundles.
          </div>
        </Card>
      )}

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold tracking-tight">Members</h3>
            <Badge variant="secondary">{companyAssignments.length}</Badge>
          </div>
          {companyAssignments.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 border border-dashed border-border rounded-lg text-center">
              No members yet. Invite the first one.
            </div>
          )}
          <div className="flex flex-col gap-2">
            {companyAssignments.map((a) => {
              const u = users.find((x) => x.id === a.user_id);
              const role = roles.find((r) => r.id === a.role_id);
              const bundle = bundles.find((b) => b.id === role?.bundle_id);
              if (!u) return null;
              return (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <div className="size-9 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/10 grid place-items-center text-xs font-semibold text-primary">
                      {u.name
                        .split(" ")
                        .map((p) => p[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{u.name}</div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {u.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right hidden sm:block">
                      <div className="text-[11px] text-muted-foreground">
                        {bundle?.name}
                      </div>
                      <select
                        value={a.role_id}
                        onChange={(e) => {
                          setAssignmentRole(a.id, e.target.value);
                          toast.success("Role updated");
                        }}
                        className="h-7 text-xs rounded-md border border-input bg-card px-1.5"
                      >
                        {availableRoles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Badge
                      variant={u.status === "active" ? "default" : "secondary"}
                      className="capitalize text-[10px]"
                    >
                      {u.status}
                    </Badge>
                    <button
                      onClick={() => setEditAssignment(a)}
                      title="Modify access"
                      className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center"
                    >
                      <Settings2 className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        setUserStatus(
                          u.id,
                          u.status === "active" ? "disabled" : "active",
                        );
                        toast(
                          u.status === "active"
                            ? "User disabled"
                            : "User enabled",
                        );
                      }}
                      title="Toggle user"
                      className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center"
                    >
                      <RefreshCw className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        removeAssignment(a.id);
                        toast("Member removed from company");
                      }}
                      title="Remove from company"
                      className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold tracking-tight">Pending invitations</h3>
            <Badge variant="secondary">{companyInvites.length}</Badge>
          </div>
          {companyInvites.length === 0 && (
            <div className="text-xs text-muted-foreground py-6 border border-dashed border-border rounded-lg text-center">
              No pending invitations.
            </div>
          )}
          <div className="flex flex-col gap-2">
            {companyInvites.map((i) => {
              const role = roles.find((r) => r.id === i.role_id);
              const link = `${window.location.origin}/accept-invite/${i.token}`;
              return (
                <div
                  key={i.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate flex items-center gap-2">
                      <Mail className="size-3.5 text-muted-foreground" />
                      {i.email}
                    </div>
                    <div className="text-[11px] text-muted-foreground truncate">
                      {i.name} · {role?.name ?? "—"} · expires{" "}
                      {new Date(i.expires_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(link);
                        toast.success("Invite link copied");
                      }}
                      title="Copy invite link"
                      className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center"
                    >
                      <Copy className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const res = resendInvitation(i.id);
                        if (res) {
                          navigator.clipboard?.writeText(res.link);
                          toast.success("Invitation resent + copied");
                        }
                      }}
                      title="Resend"
                      className="size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center"
                    >
                      <RefreshCw className="size-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        revokeInvitation(i.id);
                        toast("Invitation revoked");
                      }}
                      title="Revoke"
                      className="size-7 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {editAssignment && (
        <AccessControlDialog
          assignmentId={editAssignment.id}
          onClose={() => setEditAssignment(null)}
        />
      )}
    </div>
  );
}

function InviteDialog({
  open,
  onOpenChange,
  companyId,
  availableRoles,
  onInvite,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  companyId: string;
  availableRoles: { id: string; name: string; bundle: string }[];
  onInvite: (p: {
    email: string;
    name: string;
    company_id: string;
    role_id: string;
  }) => void;
}) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [roleId, setRoleId] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-1.5" size="sm">
          <UserPlus className="size-4" /> Invite user
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite a user to this company</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Full name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sarah Johnson"
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@company.com"
            />
          </div>
          <div>
            <Label>Default role</Label>
            <select
              value={roleId}
              onChange={(e) => setRoleId(e.target.value)}
              className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
            >
              <option value="">Pick a role…</option>
              {availableRoles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.bundle}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground mt-1">
              Permissions come from the RBAC role. You can override per-feature
              access after they accept.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!email || !name || !roleId}
            onClick={() => {
              onInvite({ email, name, company_id: companyId, role_id: roleId });
              setEmail("");
              setName("");
              setRoleId("");
            }}
          >
            Send invitation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccessControlDialog({
  assignmentId,
  onClose,
}: {
  assignmentId: string;
  onClose: () => void;
}) {
  const {
    assignments,
    users,
    roles,
    bundles,
    modules,
    setOverrideCrud,
    toggleOverrideSpecial,
    clearAssignmentOverrides,
    effectivePermission,
  } = useAirbox();

  const a = assignments.find((x) => x.id === assignmentId);
  const u = a ? users.find((x) => x.id === a.user_id) : undefined;
  const role = a ? roles.find((r) => r.id === a.role_id) : undefined;
  const bundle = role ? bundles.find((b) => b.id === role.bundle_id) : undefined;

  const moduleList = useMemo(() => {
    if (!bundle) return [];
    return bundle.module_ids
      .map((id) => modules.find((m) => m.id === id))
      .filter(Boolean) as typeof modules;
  }, [bundle, modules]);

  if (!a || !u || !role) return null;

  const CRUDS: CrudAction[] = ["create", "read", "update", "delete"];

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            Access control · {u.name}
            <span className="ml-2 text-xs font-normal text-muted-foreground">
              Role: {role.name} · {bundle?.name}
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground">
            Override CRUD or special actions per feature. Blank cells inherit
            from the RBAC role.
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              clearAssignmentOverrides(assignmentId);
              toast("Overrides cleared");
            }}
          >
            Reset to role defaults
          </Button>
        </div>

        <div className="border border-border rounded-lg max-h-[60vh] overflow-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 sticky top-0">
              <tr>
                <th className="text-left p-2 font-medium">Feature</th>
                {CRUDS.map((c) => (
                  <th key={c} className="p-2 font-medium capitalize w-20">
                    {c}
                  </th>
                ))}
                <th className="text-left p-2 font-medium">Special actions</th>
              </tr>
            </thead>
            <tbody>
              {moduleList.map((m) => {
                const override = a.overrides.find((o) => o.module_id === m.id);
                const eff = effectivePermission(assignmentId, m.id);
                return (
                  <tr key={m.id} className="border-t border-border">
                    <td className="p-2">
                      <div className="font-medium">{m.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {m.category}
                      </div>
                    </td>
                    {CRUDS.map((c) => {
                      const ovVal = override?.[c];
                      const effVal = eff?.[c] ?? false;
                      const isOverridden = ovVal !== undefined;
                      return (
                        <td key={c} className="p-1.5 text-center">
                          <select
                            value={
                              isOverridden ? (ovVal ? "grant" : "revoke") : "inherit"
                            }
                            onChange={(e) => {
                              const v = e.target.value;
                              setOverrideCrud(
                                assignmentId,
                                m.id,
                                c,
                                v === "inherit"
                                  ? "inherit"
                                  : v === "grant"
                                    ? true
                                    : false,
                              );
                            }}
                            className={`h-7 text-[11px] rounded border px-1 w-full ${
                              isOverridden
                                ? "border-primary bg-primary/10"
                                : "border-input bg-card"
                            }`}
                          >
                            <option value="inherit">
                              ↳ {effVal ? "yes" : "no"}
                            </option>
                            <option value="grant">grant</option>
                            <option value="revoke">revoke</option>
                          </select>
                        </td>
                      );
                    })}
                    <td className="p-1.5">
                      <div className="flex flex-wrap gap-1">
                        {SPECIAL_ACTIONS.map((s) => {
                          const baseHas = role.permissions
                            .find((p) => p.module_id === m.id)
                            ?.special.includes(s);
                          const granted = override?.special_add.includes(s);
                          const revoked = override?.special_remove.includes(s);
                          const mode: "grant" | "revoke" | "inherit" = granted
                            ? "grant"
                            : revoked
                              ? "revoke"
                              : "inherit";
                          const effOn = (eff?.special ?? []).includes(s);
                          return (
                            <button
                              key={s}
                              onClick={() => {
                                const next: SpecialAction = s;
                                const newMode =
                                  mode === "inherit"
                                    ? baseHas
                                      ? "revoke"
                                      : "grant"
                                    : mode === "grant"
                                      ? "revoke"
                                      : "inherit";
                                toggleOverrideSpecial(
                                  assignmentId,
                                  m.id,
                                  next,
                                  newMode,
                                );
                              }}
                              title={`role: ${baseHas ? "on" : "off"} · effective: ${effOn ? "on" : "off"}`}
                              className={`px-1.5 py-0.5 rounded text-[10px] border ${
                                effOn
                                  ? "bg-primary/15 text-primary border-primary/30"
                                  : "bg-muted/40 text-muted-foreground border-border"
                              } ${mode !== "inherit" ? "ring-1 ring-primary/40" : ""}`}
                            >
                              {s}
                            </button>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
