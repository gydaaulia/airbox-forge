import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCompanies, type Department, type ProjectItem } from "@/store/companies";
import {
  AddDepartmentDialog,
  AddProjectDialog,
  HierarchyDialog,
  type DepartmentDraft,
  type ProjectDraft,
} from "@/components/airbox/StructureDialogs";
import {
  ArrowLeft,
  Save,
  Landmark,
  Network,
  FolderKanban,
  Building2,
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  UserRound,
  Users,
  GripVertical,
  Maximize2,
} from "lucide-react";

export const Route = createFileRoute("/company/$companyId/edit")({
  head: () => ({
    meta: [{ title: "Edit Company — Airbox" }],
  }),
  component: EditCompanyPage,
});

const uid = () => Math.random().toString(36).slice(2, 9);

type DeptEdit = Department & { open?: boolean };

function EditCompanyPage() {
  const { companyId } = useParams({ from: "/company/$companyId/edit" });
  const company = useCompanies((s) => s.items.find((x) => x.id === companyId));
  const update = useCompanies((s) => s.update);
  const navigate = useNavigate();

  const [form, setForm] = useState(company);
  const [departments, setDepartments] = useState<DeptEdit[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [structureTab, setStructureTab] = useState<"org" | "projects">("org");
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [projDialogOpen, setProjDialogOpen] = useState(false);
  const [hierarchyOpen, setHierarchyOpen] = useState(false);

  useEffect(() => {
    if (company) {
      setForm(company);
      setDepartments(company.structure.departments.map((d) => ({ ...d, open: true })));
      setProjects(company.structure.projects);
    }
  }, [company]);

  if (!company || !form) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="text-lg font-semibold">Company not found</div>
        <Button asChild variant="outline" className="mt-6 gap-1.5">
          <Link to="/company/list">
            <ArrowLeft className="size-4" /> Back to Company List
          </Link>
        </Button>
      </div>
    );
  }

  const totalDivisions = departments.reduce((s, d) => s + d.divisions.length, 0);

  const save = () => {
    update(company.id, {
      ...form,
      structure: {
        departments: departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          users: d.users,
          parentId: d.parentId ?? null,
          divisions: d.divisions.map((v) => ({
            id: v.id,
            name: v.name,
            users: v.users,
            parentId: v.parentId ?? null,
          })),
        })),
        projects,
      },
    });
    toast.success(`Saved changes to ${form.name}`);
    navigate({ to: "/company/$companyId", params: { companyId: company.id } });
  };

  const handleAddDepartment = (d: DepartmentDraft) => {
    setDepartments((prev) => [
      ...prev,
      {
        id: d.id,
        name: d.name,
        code: d.code,
        open: true,
        divisions: d.divisions,
        users: d.users,
        parentId: d.parentId ?? null,
      },
    ]);
    toast.success(`Department "${d.name}" added`);
  };
  const handleAddProject = (p: ProjectDraft) => {
    setProjects((prev) => [...prev, p]);
    toast.success(`Project "${p.name}" added`);
  };
  const removeDepartment = (id: string) =>
    setDepartments((d) => d.filter((x) => x.id !== id));
  const removeProject = (id: string) => setProjects((p) => p.filter((x) => x.id !== id));
  const addDivision = (deptId: string) => {
    setDepartments((d) =>
      d.map((x) =>
        x.id === deptId
          ? { ...x, divisions: [...x.divisions, { id: uid(), name: "New Division" }] }
          : x,
      ),
    );
  };
  const removeDivision = (deptId: string, divId: string) => {
    setDepartments((d) =>
      d.map((x) =>
        x.id === deptId ? { ...x, divisions: x.divisions.filter((v) => v.id !== divId) } : x,
      ),
    );
  };
  const toggleDept = (deptId: string) => {
    setDepartments((d) => d.map((x) => (x.id === deptId ? { ...x, open: !x.open } : x)));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/company/$companyId" params={{ companyId: company.id }}>
            <ArrowLeft className="size-4" /> Back to Detail
          </Link>
        </Button>
        <Button size="sm" onClick={save} className="gap-1.5">
          <Save className="size-3.5" /> Save Changes
        </Button>
      </div>

      <PageHeader
        title={`Edit ${company.name}`}
        description="Update company profile, contact, subscription, structure and status."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="p-5 lg:col-span-2">
          <h3 className="font-semibold">General Information</h3>
          <p className="text-xs text-muted-foreground mt-1">Basic details about your organization</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
            <Field label="Company Name">
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. PT Airbox Indonesia"
              />
            </Field>
            <Field label="Company Code">
              <Input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="AIR-ID"
              />
            </Field>
            <Field label="Industry">
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
              >
                <option>Select Industry</option>
                <option>Logistics & Supply Chain</option>
                <option>Manufacturing</option>
                <option>Retail & E-commerce</option>
                <option>Financial Services</option>
                <option>Technology</option>
              </select>
            </Field>
            <Field label="Number of Employees">
              <select
                value={form.employees}
                onChange={(e) => setForm({ ...form, employees: e.target.value })}
                className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
              >
                <option>Range</option>
                <option>1 - 50</option>
                <option>51 - 200</option>
                <option>201 - 500</option>
                <option>501 - 1000</option>
                <option>1000+</option>
              </select>
            </Field>
            <Field label="NPWP">
              <Input
                value={form.npwp ?? ""}
                onChange={(e) => setForm({ ...form, npwp: e.target.value })}
                placeholder="00.000.000.0-000.000"
              />
            </Field>
            <Field label="NIB">
              <Input
                value={form.nib ?? ""}
                onChange={(e) => setForm({ ...form, nib: e.target.value })}
                placeholder="Registration Number"
              />
            </Field>
          </div>

          <h3 className="font-semibold mt-6">Contact & Banking</h3>
          <p className="text-xs text-muted-foreground mt-1">Reach details and your official bank account</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
            <Field label="Website">
              <Input
                value={form.website ?? ""}
                onChange={(e) => setForm({ ...form, website: e.target.value })}
                placeholder="https://airbox.com"
              />
            </Field>
            <Field label="Email">
              <Input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="corporate@airbox.com"
              />
            </Field>
            <Field label="Phone Number">
              <Input
                value={form.phone ?? ""}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="+62 21 0000 0000"
              />
            </Field>
            <Field label="Address" className="sm:col-span-3">
              <Input
                value={form.address ?? ""}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Main Office Address"
              />
            </Field>
          </div>

          <div className="mt-6 border border-border rounded-xl p-4 bg-muted/30">
            <div className="flex items-center gap-2 mb-3">
              <Landmark className="size-4 text-primary" />
              <div className="text-sm font-semibold">Bank Account</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Bank Name">
                <select
                  value={form.bank.name}
                  onChange={(e) =>
                    setForm({ ...form, bank: { ...form.bank, name: e.target.value } })
                  }
                  className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
                >
                  <option>Select Bank</option>
                  <option>BCA</option>
                  <option>Mandiri</option>
                  <option>BRI</option>
                  <option>BNI</option>
                  <option>CIMB Niaga</option>
                </select>
              </Field>
              <Field label="Account Number">
                <Input
                  value={form.bank.number}
                  onChange={(e) =>
                    setForm({ ...form, bank: { ...form.bank, number: e.target.value } })
                  }
                  placeholder="e.g. 1234567890"
                />
              </Field>
              <Field label="Account Holder Name">
                <Input
                  value={form.bank.holder}
                  onChange={(e) =>
                    setForm({ ...form, bank: { ...form.bank, holder: e.target.value } })
                  }
                  placeholder="e.g. PT Airbox Indonesia"
                />
              </Field>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="font-semibold">Company Status</h3>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {(["active", "inactive"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setForm({ ...form, status: s })}
                  className={cn(
                    "px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-colors",
                    form.status === s
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card hover:bg-muted text-muted-foreground",
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="font-semibold">Subscription</h3>
            <div className="grid grid-cols-1 gap-3 mt-4">
              <Field label="Plan Name">
                <Input
                  value={form.subscription.planName}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subscription: { ...form.subscription, planName: e.target.value },
                    })
                  }
                />
              </Field>
              <Field label="Price">
                <Input
                  type="number"
                  value={form.subscription.price}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subscription: {
                        ...form.subscription,
                        price: Number(e.target.value) || 0,
                      },
                    })
                  }
                />
              </Field>
              <Field label="Billing Cycle">
                <select
                  value={form.subscription.billingCycle}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subscription: {
                        ...form.subscription,
                        billingCycle: e.target.value as "monthly" | "yearly",
                      },
                    })
                  }
                  className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </Field>
              <div>
                <Label className="text-xs font-medium">Subscription Status</Label>
                <div className="mt-1.5 grid grid-cols-2 gap-2">
                  {(["active", "inactive"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setForm({
                          ...form,
                          subscription: { ...form.subscription, status: s },
                        })
                      }
                      className={cn(
                        "px-3 py-2 rounded-lg border text-sm font-medium capitalize transition-colors",
                        form.subscription.status === s
                          ? s === "active"
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-600"
                            : "border-border bg-muted text-foreground"
                          : "border-border bg-card hover:bg-muted text-muted-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Structure Editor */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold">Organization & Projects</h2>
            <p className="text-xs text-muted-foreground">
              Manage departments, divisions and projects for this company.
            </p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setStructureTab("org")}
              className={cn(
                "px-4 h-8 rounded-md text-sm font-medium flex items-center gap-2",
                structureTab === "org"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-4" /> Organization
            </button>
            <button
              onClick={() => setStructureTab("projects")}
              className={cn(
                "px-4 h-8 rounded-md text-sm font-medium flex items-center gap-2",
                structureTab === "projects"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FolderKanban className="size-4" /> Projects
            </button>
          </div>
        </div>

        <Card className="p-5">
          {structureTab === "org" ? (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Organization Structure</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Departments are top-level — each contains multiple divisions
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-[11px] text-muted-foreground mr-1">
                    {departments.length} depts · {totalDivisions} divs
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHierarchyOpen(true)}
                    className="gap-1.5"
                  >
                    <Maximize2 className="size-3.5" /> View Hierarchy
                  </Button>
                  <Button size="sm" onClick={() => setDeptDialogOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" /> Add Department
                  </Button>
                </div>
              </div>

              <div className="rounded-xl border border-border p-3 bg-muted/20 flex items-center gap-3 mb-3">
                <div className="size-8 rounded-lg bg-primary/10 grid place-items-center">
                  <Building2 className="size-4 text-primary" />
                </div>
                <div className="text-sm font-semibold flex-1">{form.name || "Your Company"}</div>
                <Badge variant="secondary" className="text-[10px]">
                  Company Root
                </Badge>
              </div>

              <div className="flex flex-col gap-2">
                {departments.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-8">
                    No departments yet. Click "Add Department" to create one.
                  </div>
                )}
                {departments.map((d) => (
                  <div key={d.id} className="rounded-xl border border-border overflow-hidden">
                    <div className="flex items-center gap-2 p-3 hover:bg-muted/40">
                      <button
                        onClick={() => toggleDept(d.id)}
                        className="flex items-center gap-2 flex-1 text-left min-w-0"
                      >
                        {d.open ? (
                          <ChevronDown className="size-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="size-4 text-muted-foreground" />
                        )}
                        <div className="size-7 rounded-md bg-primary/10 grid place-items-center">
                          <Network className="size-3.5 text-primary" />
                        </div>
                        <div className="text-sm font-semibold flex-1 truncate">
                          {d.name}
                          <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                            {d.code}
                          </span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {d.divisions.length} div
                        </div>
                      </button>
                      <button
                        onClick={() => removeDepartment(d.id)}
                        className="size-7 rounded-md hover:bg-destructive/10 text-destructive grid place-items-center"
                        title="Remove department"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {d.open && (
                      <div className="border-t border-border bg-muted/20 py-1">
                        {d.divisions.map((div) => (
                          <div
                            key={div.id}
                            className="flex items-center gap-2 pl-10 pr-3 py-2 hover:bg-muted/40 group"
                          >
                            <GripVertical className="size-3.5 text-muted-foreground/60" />
                            <div className="size-6 rounded-md bg-pink-100 dark:bg-pink-950/30 grid place-items-center">
                              <UserRound className="size-3 text-pink-600" />
                            </div>
                            <Input
                              value={div.name}
                              onChange={(e) =>
                                setDepartments((prev) =>
                                  prev.map((x) =>
                                    x.id === d.id
                                      ? {
                                          ...x,
                                          divisions: x.divisions.map((v) =>
                                            v.id === div.id ? { ...v, name: e.target.value } : v,
                                          ),
                                        }
                                      : x,
                                  ),
                                )
                              }
                              className="h-7 text-sm flex-1 border-transparent bg-transparent hover:border-border focus:border-input"
                            />
                            {div.users != null && (
                              <Badge variant="outline" className="text-[10px]">
                                <Users className="size-3 mr-1" /> {div.users}
                              </Badge>
                            )}
                            <button
                              onClick={() => removeDivision(d.id, div.id)}
                              className="size-6 rounded-md hover:bg-destructive/10 text-destructive grid place-items-center opacity-0 group-hover:opacity-100"
                            >
                              <Trash2 className="size-3" />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addDivision(d.id)}
                          className="w-full text-left text-xs font-medium text-primary hover:bg-primary/5 py-2 pl-10 flex items-center gap-1.5"
                        >
                          <Plus className="size-3" /> Add Division
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold">Projects</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Optional projects and their groups
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setHierarchyOpen(true)}
                    className="gap-1.5"
                  >
                    <Maximize2 className="size-3.5" /> View Hierarchy
                  </Button>
                  <Button size="sm" onClick={() => setProjDialogOpen(true)} className="gap-1.5">
                    <Plus className="size-3.5" /> Add Project
                  </Button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {projects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-xl border border-border p-3 flex items-center gap-3"
                  >
                    <div className="size-8 rounded-md bg-primary/10 grid place-items-center">
                      <FolderKanban className="size-4 text-primary" />
                    </div>
                    <Input
                      value={p.name}
                      onChange={(e) =>
                        setProjects((prev) =>
                          prev.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)),
                        )
                      }
                      className="h-8 text-sm flex-1 border-transparent bg-transparent hover:border-border focus:border-input font-semibold"
                    />
                    <Badge variant="outline" className="text-[10px]">
                      {p.groups} groups
                    </Badge>
                    <button
                      onClick={() => removeProject(p.id)}
                      className="size-7 rounded-md hover:bg-destructive/10 text-destructive grid place-items-center"
                      title="Remove project"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
                {projects.length === 0 && (
                  <div className="text-center text-xs text-muted-foreground py-6">
                    No projects yet. Click "Add Project" to create one.
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      <div className="mt-6 pt-4 border-t border-border flex items-center justify-end gap-2">
        <Button asChild variant="outline">
          <Link to="/company/$companyId" params={{ companyId: company.id }}>
            Cancel
          </Link>
        </Button>
        <Button onClick={save} className="gap-1.5">
          <Save className="size-4" /> Save Changes
        </Button>
      </div>

      <AddDepartmentDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        onSubmit={handleAddDepartment}
        existingDepartments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
      />
      <AddProjectDialog
        open={projDialogOpen}
        onOpenChange={setProjDialogOpen}
        onSubmit={handleAddProject}
      />
      <HierarchyDialog
        open={hierarchyOpen}
        onOpenChange={setHierarchyOpen}
        companyName={form.name}
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          users: d.users,
          parentId: d.parentId ?? null,
          divisions: d.divisions,
        }))}
        projects={projects}
        defaultTab={structureTab}
      />
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <Label className="text-xs font-medium">{label}</Label>
      {children}
    </div>
  );
}
