import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Building2,
  Check,
  ChevronRight,
  ChevronLeft,
  Network,
  UserRound,
  Users,
  FolderKanban,
  Plus,
  Trash2,
  Maximize2,
  Minimize2,
  X,
  Layers,
} from "lucide-react";

const uid = () => Math.random().toString(36).slice(2, 9);

export type DivisionDraft = {
  id: string;
  name: string;
  users?: number;
  parentId?: string | null;
};
export type DepartmentDraft = {
  id: string;
  name: string;
  code: string;
  divisions: DivisionDraft[];
  users?: number;
  parentId?: string | null;
};
export type ProjectDraft = { id: string; name: string; groups: number };

/* -------------------- ADD DEPARTMENT DIALOG -------------------- */

const DEPT_STEPS = ["Details", "Divisions", "Review"] as const;

export function AddDepartmentDialog({
  open,
  onOpenChange,
  onSubmit,
  existingDepartments = [],
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (d: DepartmentDraft) => void;
  existingDepartments?: { id: string; name: string; code: string }[];
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [parentId, setParentId] = useState<string>("");
  const [deptUsers, setDeptUsers] = useState<string>("");
  const [divisions, setDivisions] = useState<DivisionDraft[]>([]);
  const [divName, setDivName] = useState("");
  const [divUsers, setDivUsers] = useState<string>("");
  const [divParentId, setDivParentId] = useState<string>("");

  useEffect(() => {
    if (open) {
      setStep(0);
      setName("");
      setCode("");
      setParentId("");
      setDeptUsers("");
      setDivisions([]);
      setDivName("");
      setDivUsers("");
      setDivParentId("");
    }
  }, [open]);

  const canNext = step === 0 ? name.trim().length > 0 && code.trim().length > 0 : true;

  const addDiv = () => {
    if (!divName.trim()) return;
    setDivisions((d) => [
      ...d,
      {
        id: uid(),
        name: divName.trim(),
        users: divUsers ? Number(divUsers) : undefined,
        parentId: divParentId || null,
      },
    ]);
    setDivName("");
    setDivUsers("");
    setDivParentId("");
  };
  const removeDiv = (id: string) =>
    setDivisions((d) =>
      d.filter((x) => x.id !== id).map((x) => (x.parentId === id ? { ...x, parentId: null } : x)),
    );

  const submit = () => {
    onSubmit({
      id: uid(),
      name: name.trim(),
      code: code.trim().toUpperCase(),
      divisions,
      users: deptUsers ? Number(deptUsers) : undefined,
      parentId: parentId || null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Network className="size-4 text-primary" /> Add Department
          </DialogTitle>
        </DialogHeader>

        <Stepper steps={DEPT_STEPS as unknown as string[]} current={step} />

        <div className="mt-2">
          {step === 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">Department Name</Label>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Human Capital"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">Department Code</Label>
                <Input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HC"
                  maxLength={6}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium">
                  Department Headcount <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <Input
                  value={deptUsers}
                  onChange={(e) => setDeptUsers(e.target.value.replace(/\D/g, ""))}
                  placeholder="e.g. 4 (staff not in a division)"
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-col gap-1.5 sm:col-span-2">
                <Label className="text-xs font-medium">
                  Reports To <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
                >
                  <option value="">— Reports directly to Company Root —</option>
                  {existingDepartments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground">
                  Use this to nest departments (e.g. Finance & Operations reporting to a CEO Office).
                </p>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="rounded-xl border border-dashed border-border p-3">
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_auto] gap-2">
                  <Input
                    value={divName}
                    onChange={(e) => setDivName(e.target.value)}
                    placeholder="Division name (e.g. Recruitment)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addDiv();
                      }
                    }}
                  />
                  <Input
                    value={divUsers}
                    onChange={(e) => setDivUsers(e.target.value.replace(/\D/g, ""))}
                    placeholder="Users"
                    inputMode="numeric"
                  />
                  <Button onClick={addDiv} disabled={!divName.trim()} className="gap-1.5">
                    <Plus className="size-3.5" /> Add
                  </Button>
                </div>
                {divisions.length > 0 && (
                  <div className="mt-2">
                    <Label className="text-[11px] font-medium text-muted-foreground">
                      Sub-division of (optional)
                    </Label>
                    <select
                      value={divParentId}
                      onChange={(e) => setDivParentId(e.target.value)}
                      className="mt-1 w-full h-8 rounded-lg border border-input bg-card text-xs px-2.5"
                    >
                      <option value="">— Top-level division under this department —</option>
                      {divisions.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <p className="text-[11px] text-muted-foreground mt-2">
                  Divisions are optional — leave sub-division empty to keep them top-level.
                </p>
              </div>

              <div className="mt-3 max-h-64 overflow-auto flex flex-col gap-1.5">
                {divisions.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    No divisions added yet.
                  </div>
                )}
                {divisions.map((d) => {
                  const parent = d.parentId ? divisions.find((x) => x.id === d.parentId) : null;
                  return (
                    <div
                      key={d.id}
                      className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                      style={parent ? { marginLeft: 16 } : undefined}
                    >
                      <div className="size-6 rounded-md bg-pink-100 dark:bg-pink-950/30 grid place-items-center">
                        <UserRound className="size-3 text-pink-600" />
                      </div>
                      <div className="text-sm flex-1">
                        {d.name}
                        {parent && (
                          <span className="ml-2 text-[10px] text-muted-foreground">
                            ↳ under {parent.name}
                          </span>
                        )}
                      </div>
                      {d.users != null && (
                        <Badge variant="outline" className="text-[10px]">
                          <Users className="size-3 mr-1" /> {d.users}
                        </Badge>
                      )}
                      <button
                        onClick={() => removeDiv(d.id)}
                        className="size-6 rounded-md hover:bg-destructive/10 text-destructive grid place-items-center"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="rounded-xl border border-border p-4 bg-muted/20">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-md bg-primary/10 grid place-items-center">
                    <Network className="size-4 text-primary" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{name}</div>
                    <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      {code}
                    </div>
                  </div>
                  <Badge variant="secondary" className="ml-auto text-[10px]">
                    {divisions.length} division{divisions.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                {divisions.length > 0 && (
                  <div className="mt-3 pl-10 flex flex-col gap-1.5">
                    {divisions.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center gap-2 text-sm rounded-md bg-card border border-border px-2 py-1.5"
                      >
                        <UserRound className="size-3 text-pink-600" />
                        <span className="flex-1">{d.name}</span>
                        {d.users != null && (
                          <span className="text-[10px] text-muted-foreground">
                            {d.users} users
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Confirm to add this department to the organization structure.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="!justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < 2 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="gap-1.5"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Check className="size-4" /> Add Department
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- ADD PROJECT DIALOG -------------------- */

const PROJ_STEPS = ["Details", "Groups", "Review"] as const;

export function AddProjectDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (p: ProjectDraft) => void;
}) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [groups, setGroups] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (open) {
      setStep(0);
      setName("");
      setGroups([]);
      setGroupName("");
    }
  }, [open]);

  const canNext = step === 0 ? name.trim().length > 0 : true;
  const addGroup = () => {
    if (!groupName.trim()) return;
    setGroups((g) => [...g, groupName.trim()]);
    setGroupName("");
  };
  const removeGroup = (i: number) => setGroups((g) => g.filter((_, idx) => idx !== i));

  const submit = () => {
    onSubmit({ id: uid(), name: name.trim(), groups: groups.length });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderKanban className="size-4 text-primary" /> Add Project
          </DialogTitle>
        </DialogHeader>

        <Stepper steps={PROJ_STEPS as unknown as string[]} current={step} />

        <div className="mt-2">
          {step === 0 && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium">Project Name</Label>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ERP Rollout 2027"
              />
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="rounded-xl border border-dashed border-border p-3">
                <div className="flex gap-2">
                  <Input
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    placeholder="Group name (e.g. Implementation Team)"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addGroup();
                      }
                    }}
                  />
                  <Button onClick={addGroup} disabled={!groupName.trim()} className="gap-1.5">
                    <Plus className="size-3.5" /> Add
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Groups are optional — you can add or rename them later.
                </p>
              </div>

              <div className="mt-3 max-h-64 overflow-auto flex flex-col gap-1.5">
                {groups.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    No groups added yet.
                  </div>
                )}
                {groups.map((g, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                  >
                    <div className="size-6 rounded-md bg-primary/10 grid place-items-center">
                      <Layers className="size-3 text-primary" />
                    </div>
                    <div className="text-sm flex-1">{g}</div>
                    <button
                      onClick={() => removeGroup(i)}
                      className="size-6 rounded-md hover:bg-destructive/10 text-destructive grid place-items-center"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-xl border border-border p-4 bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="size-8 rounded-md bg-primary/10 grid place-items-center">
                  <FolderKanban className="size-4 text-primary" />
                </div>
                <div className="text-sm font-semibold flex-1">{name}</div>
                <Badge variant="outline" className="text-[10px]">
                  {groups.length} group{groups.length === 1 ? "" : "s"}
                </Badge>
              </div>
              {groups.length > 0 && (
                <div className="mt-3 pl-10 flex flex-wrap gap-1.5">
                  {groups.map((g, i) => (
                    <span
                      key={i}
                      className="text-[11px] rounded-md border border-border bg-card px-2 py-1"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="!justify-between gap-2">
          <Button
            variant="outline"
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="gap-1.5"
          >
            <ChevronLeft className="size-4" /> Back
          </Button>
          {step < 2 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext}
              className="gap-1.5"
            >
              Next <ChevronRight className="size-4" />
            </Button>
          ) : (
            <Button onClick={submit} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
              <Check className="size-4" /> Add Project
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------- HIERARCHY VISUALIZATION DIALOG -------------------- */

export function HierarchyDialog({
  open,
  onOpenChange,
  companyName,
  departments,
  projects,
  defaultTab = "org",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  companyName: string;
  departments: DepartmentDraft[];
  projects: ProjectDraft[];
  defaultTab?: "org" | "projects";
}) {
  const [tab, setTab] = useState<"org" | "projects">(defaultTab);
  const [fullscreen, setFullscreen] = useState(false);

  useEffect(() => {
    if (open) setTab(defaultTab);
  }, [open, defaultTab]);

  const totals = useMemo(() => {
    const divisions = departments.reduce((s, d) => s + d.divisions.length, 0);
    const users = departments.reduce(
      (s, d) => s + d.divisions.reduce((u, v) => u + (v.users ?? 0), 0),
      0,
    );
    const groups = projects.reduce((s, p) => s + p.groups, 0);
    return { divisions, users, groups };
  }, [departments, projects]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden",
          fullscreen
            ? "!max-w-none w-screen h-screen rounded-none top-0 left-0 translate-x-0 translate-y-0"
            : "max-w-5xl",
        )}
      >
        {/* Custom header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-border bg-card">
          <Network className="size-4 text-primary" />
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">Hierarchy Visualization</div>
            <div className="text-[11px] text-muted-foreground truncate">
              {companyName || "Company"} · {departments.length} depts ·{" "}
              {totals.divisions} divs · {projects.length} projects
            </div>
          </div>

          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setTab("org")}
              className={cn(
                "px-3 h-7 rounded-md text-xs font-medium flex items-center gap-1.5",
                tab === "org"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-3.5" /> Organization
            </button>
            <button
              onClick={() => setTab("projects")}
              className={cn(
                "px-3 h-7 rounded-md text-xs font-medium flex items-center gap-1.5",
                tab === "projects"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FolderKanban className="size-3.5" /> Projects
            </button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setFullscreen((v) => !v)}
            title={fullscreen ? "Exit fullscreen" : "Fullscreen"}
          >
            {fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
            <X className="size-4" />
          </Button>
        </div>

        {/* Hidden semantic title */}
        <DialogHeader className="sr-only">
          <DialogTitle>Hierarchy Visualization</DialogTitle>
        </DialogHeader>

        <div
          className={cn(
            "overflow-auto bg-muted/20",
            fullscreen ? "h-[calc(100vh-56px)]" : "max-h-[70vh]",
          )}
        >
          <div className="p-6">
            {tab === "org" ? (
              <OrgTree companyName={companyName} departments={departments} />
            ) : (
              <ProjectsTree companyName={companyName} projects={projects} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrgTree({
  companyName,
  departments,
}: {
  companyName: string;
  departments: DepartmentDraft[];
}) {
  if (departments.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-16">
        No departments yet. Add one to see the hierarchy.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <RootNode label={companyName || "Company"} />
      <Connector />
      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {departments.map((d) => (
          <div key={d.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/40">
              <div className="size-7 rounded-md bg-primary/10 grid place-items-center">
                <Network className="size-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{d.name}</div>
                <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {d.code}
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {d.divisions.length} div
              </Badge>
            </div>
            <div className="p-2 flex flex-col gap-1.5">
              {d.divisions.map((v) => (
                <div
                  key={v.id}
                  className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                >
                  <div className="size-6 rounded-md bg-pink-100 dark:bg-pink-950/30 grid place-items-center">
                    <UserRound className="size-3 text-pink-600" />
                  </div>
                  <div className="text-xs flex-1 truncate">{v.name}</div>
                  {v.users != null && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                      <Users className="size-3" /> {v.users}
                    </span>
                  )}
                </div>
              ))}
              {d.divisions.length === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-2">
                  No divisions
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProjectsTree({
  companyName,
  projects,
}: {
  companyName: string;
  projects: ProjectDraft[];
}) {
  if (projects.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-16">
        No projects yet. Add one to see the hierarchy.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <RootNode label={companyName || "Company"} />
      <Connector />
      <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {projects.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-muted/40">
              <div className="size-7 rounded-md bg-primary/10 grid place-items-center">
                <FolderKanban className="size-3.5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.name}</div>
              </div>
              <Badge variant="outline" className="text-[10px]">
                {p.groups} groups
              </Badge>
            </div>
            <div className="p-2 flex flex-col gap-1.5">
              {p.groups === 0 && (
                <div className="text-[11px] text-muted-foreground text-center py-2">
                  No groups
                </div>
              )}
              {Array.from({ length: p.groups }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5"
                >
                  <div className="size-6 rounded-md bg-primary/10 grid place-items-center">
                    <Layers className="size-3 text-primary" />
                  </div>
                  <div className="text-xs flex-1 truncate">Group {i + 1}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RootNode({ label }: { label: string }) {
  return (
    <div className="px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-br from-primary to-primary/70 shadow-[var(--shadow-elegant)] flex items-center gap-2">
      <Building2 className="size-4" />
      {label}
    </div>
  );
}

function Connector() {
  return <div className="w-px h-6 bg-border" />;
}

/* -------------------- Stepper -------------------- */

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center gap-2 pt-1">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} className="flex items-center gap-2 flex-1 last:flex-none">
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "size-7 rounded-full grid place-items-center text-[11px] font-semibold border-2",
                  done && "bg-emerald-500 border-emerald-500 text-white",
                  active && "bg-primary border-primary text-primary-foreground",
                  !done && !active && "bg-muted border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </div>
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="flex-1 h-0.5 bg-border relative">
                <div
                  className={cn(
                    "absolute inset-y-0 left-0 bg-emerald-500 transition-all",
                    done ? "w-full" : "w-0",
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
