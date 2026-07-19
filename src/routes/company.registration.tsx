import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useCompanies } from "@/store/companies";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Building2,
  Network,
  CreditCard,
  CheckCircle2,
  Check,
  Upload,
  Landmark,
  Lightbulb,
  FastForward,
  ChevronRight,
  ChevronDown,
  Plus,
  GripVertical,
  UserRound,
  Users,
  FolderKanban,
  Maximize2,
  Trash2,
} from "lucide-react";
import {
  AddDepartmentDialog,
  AddProjectDialog,
  HierarchyDialog,
  type DepartmentDraft,
  type ProjectDraft,
} from "@/components/airbox/StructureDialogs";

export const Route = createFileRoute("/company/registration")({
  head: () => ({
    meta: [
      { title: "Company Registration — Airbox" },
      {
        name: "description",
        content:
          "Register a new company: identity, structure, subscription and review.",
      },
    ],
  }),
  component: CompanyRegistrationPage,
});

type StepKey = "info" | "structure" | "subscription" | "review";

const STEPS: { key: StepKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "info", label: "Company Information", icon: Building2 },
  { key: "structure", label: "Structure Setup", icon: Network },
  { key: "subscription", label: "Subscription Setup", icon: CreditCard },
  { key: "review", label: "Review", icon: CheckCircle2 },
];

type Division = { id: string; name: string; users?: number; parentId?: string | null };
type Department = {
  id: string;
  name: string;
  code: string;
  divisions: Division[];
  open?: boolean;
  users?: number;
  parentId?: string | null;
};

type Plan = {
  id: string;
  name: string;
  price: number;
  tone: "blue" | "purple" | "pink" | "dark";
  features: string[];
  seats: string;
};

const PLANS: Plan[] = [
  {
    id: "hris",
    name: "HRIS Starter",
    price: 199,
    tone: "blue",
    features: ["Employee Database", "Leave Management", "Announcements"],
    seats: "Up to 50 Users",
  },
  {
    id: "acc",
    name: "Accounting Pro",
    price: 399,
    tone: "purple",
    features: ["General Ledger", "Accounts Payable", "Tax Reports", "Invoicing"],
    seats: "Up to 100 Users",
  },
  {
    id: "log",
    name: "Logistics Suite",
    price: 799,
    tone: "pink",
    features: ["Fleet Management", "Warehouse Ops", "Real-time Tracking", "POD"],
    seats: "Unlimited Users",
  },
  {
    id: "erp",
    name: "Full ERP",
    price: 1499,
    tone: "dark",
    features: ["All Modules Included", "Custom Integration", "Dedicated Support"],
    seats: "Unlimited Everything",
  },
];

const uid = () => Math.random().toString(36).slice(2, 9);

function CompanyRegistrationPage() {
  const [step, setStep] = useState<StepKey>("info");
  const idx = STEPS.findIndex((s) => s.key === step);
  const addCompany = useCompanies((s) => s.add);
  const navigate = useNavigate();

  // Company Information
  const [name, setName] = useState("PT Airbox Indonesia");
  const [code, setCode] = useState("AIR-ID");
  const [industry, setIndustry] = useState("Logistics & Supply Chain");
  const [employees, setEmployees] = useState("201 - 500");
  const [npwp, setNpwp] = useState("");
  const [nib, setNib] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [accountNumber, setAccountNumber] = useState("1234567890");
  const [accountHolder, setAccountHolder] = useState("PT Airbox Indonesia");

  // Structure
  const [structureTab, setStructureTab] = useState<"org" | "projects">("org");
  const [departments, setDepartments] = useState<Department[]>([
    {
      id: uid(),
      name: "Human Capital",
      code: "HC",
      open: true,
      divisions: [
        { id: uid(), name: "Recruitment", users: 1 },
        { id: uid(), name: "Payroll" },
        { id: uid(), name: "Employee Relations" },
      ],
    },
    {
      id: uid(),
      name: "Finance",
      code: "FIN",
      open: true,
      divisions: [
        { id: uid(), name: "Accounting" },
        { id: uid(), name: "Treasury" },
        { id: uid(), name: "Tax" },
      ],
    },
    {
      id: uid(),
      name: "Operations",
      code: "OPS",
      open: false,
      divisions: [
        { id: uid(), name: "Warehouse" },
        { id: uid(), name: "Fleet" },
        { id: uid(), name: "Dispatch" },
      ],
    },
  ]);
  const [projects, setProjects] = useState<{ id: string; name: string; groups: number }[]>([
    { id: uid(), name: "ERP Rollout 2027", groups: 2 },
    { id: uid(), name: "Warehouse Expansion", groups: 2 },
    { id: uid(), name: "Digital Onboarding", groups: 1 },
  ]);

  const totalDivisions = departments.reduce((s, d) => s + d.divisions.length, 0);
  const totalGroups = projects.reduce((s, p) => s + p.groups, 0);

  // Subscription
  const [planId, setPlanId] = useState<string>("acc");
  const plan = PLANS.find((p) => p.id === planId)!;

  const goNext = () => {
    if (idx < STEPS.length - 1) setStep(STEPS[idx + 1].key);
  };
  const goPrev = () => {
    if (idx > 0) setStep(STEPS[idx - 1].key);
  };

  const canComplete = name.trim().length > 0 && planId;

  const complete = () => {
    if (!canComplete) return;
    const newId = addCompany({
      name,
      code,
      email: email || `contact@${(code || "company").toLowerCase()}.id`,
      industry,
      employees,
      npwp,
      nib,
      website,
      phone,
      address,
      bank: { name: bankName, number: accountNumber, holder: accountHolder },
      status: "active",
      subscription: {
        planId: plan.id,
        planName: plan.name,
        price: plan.price,
        status: "active",
        billingCycle: "monthly",
      },
      structure: {
        departments: departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
          divisions: d.divisions.map((v) => ({ id: v.id, name: v.name, users: v.users })),
        })),
        projects: projects.map((p) => ({ id: p.id, name: p.name, groups: p.groups })),
      },
    });
    toast.success(`Company "${name}" registered with ${plan.name} plan`);
    navigate({ to: "/company/$companyId", params: { companyId: newId } });
  };

  // Dialogs
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [projDialogOpen, setProjDialogOpen] = useState(false);
  const [hierarchyOpen, setHierarchyOpen] = useState(false);

  const handleAddDepartment = (d: DepartmentDraft) => {
    setDepartments((prev) => [
      ...prev,
      { id: d.id, name: d.name, code: d.code, open: true, divisions: d.divisions },
    ]);
    toast.success(`Department "${d.name}" added`);
  };
  const handleAddProject = (p: ProjectDraft) => {
    setProjects((prev) => [...prev, p]);
    toast.success(`Project "${p.name}" added`);
  };
  const removeDepartment = (id: string) =>
    setDepartments((d) => d.filter((x) => x.id !== id));
  const removeProject = (id: string) =>
    setProjects((p) => p.filter((x) => x.id !== id));
  const addDivision = (deptId: string) => {
    setDepartments((d) =>
      d.map((x) =>
        x.id === deptId
          ? { ...x, divisions: [...x.divisions, { id: uid(), name: "New Division" }] }
          : x,
      ),
    );
  };
  const toggleDept = (deptId: string) => {
    setDepartments((d) => d.map((x) => (x.id === deptId ? { ...x, open: !x.open } : x)));
  };

  return (
    <div>
      <PageHeader
        title="Company Registration"
        description="Set up a new company profile, organization structure, and subscription."
      />

      {/* Stepper */}
      <Card className="p-6 mb-4">
        <div className="flex items-center justify-between gap-2">
          {STEPS.map((s, i) => {
            const done = i < idx;
            const active = i === idx;
            const Icon = s.icon;
            return (
              <div key={s.key} className="flex-1 flex items-center gap-3">
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <button
                    type="button"
                    onClick={() => (i <= idx ? setStep(s.key) : undefined)}
                    className={cn(
                      "size-11 rounded-full grid place-items-center transition-colors border-2",
                      done && "bg-emerald-500 border-emerald-500 text-white",
                      active && "bg-primary border-primary text-primary-foreground shadow-[var(--shadow-elegant)]",
                      !done && !active && "bg-muted border-border text-muted-foreground",
                    )}
                  >
                    {done ? <Check className="size-5" /> : <Icon className="size-5" />}
                  </button>
                  <div
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-wider text-center",
                      active ? "text-primary" : done ? "text-emerald-600" : "text-muted-foreground",
                    )}
                  >
                    {s.label}
                  </div>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-0.5 bg-border relative -mt-6">
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
      </Card>

      {/* Step Content */}
      {step === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="p-5">
            <h3 className="font-semibold">Company Identity</h3>
            <p className="text-xs text-muted-foreground mt-1">Upload your brand assets</p>
            <label className="mt-5 flex flex-col items-center justify-center gap-2 border-2 border-dashed border-border rounded-xl py-10 cursor-pointer hover:bg-muted/40 transition-colors">
              <div className="size-12 rounded-full bg-muted grid place-items-center">
                <Upload className="size-5 text-muted-foreground" />
              </div>
              <div className="text-sm font-medium">Upload Logo</div>
              <div className="text-[11px] text-muted-foreground text-center px-4">
                PNG, JPG up to 5MB. Suggested 512x512px.
              </div>
              <input type="file" accept="image/*" className="hidden" />
            </label>
          </Card>

          <Card className="p-5 lg:col-span-2">
            <h3 className="font-semibold">General Information</h3>
            <p className="text-xs text-muted-foreground mt-1">Basic details about your organization</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <Field label="Company Name">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. PT Airbox Indonesia" />
              </Field>
              <Field label="Company Code">
                <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="AIR-ID" />
              </Field>
              <Field label="Industry">
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
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
                  value={employees}
                  onChange={(e) => setEmployees(e.target.value)}
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
                <Input value={npwp} onChange={(e) => setNpwp(e.target.value)} placeholder="00.000.000.0-000.000" />
              </Field>
              <Field label="NIB">
                <Input value={nib} onChange={(e) => setNib(e.target.value)} placeholder="Registration Number" />
              </Field>
            </div>
          </Card>

          <Card className="p-5 lg:col-span-3">
            <h3 className="font-semibold">Contact & Banking</h3>
            <p className="text-xs text-muted-foreground mt-1">Reach details and your official bank account</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
              <Field label="Website">
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://airbox.com" />
              </Field>
              <Field label="Email">
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="corporate@airbox.com" />
              </Field>
              <Field label="Phone Number">
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+62 21 0000 0000" />
              </Field>
              <Field label="Address" className="sm:col-span-3">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Main Office Address" />
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
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
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
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="e.g. 1234567890"
                  />
                </Field>
                <Field label="Account Holder Name">
                  <Input
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    placeholder="e.g. PT Airbox Indonesia"
                  />
                </Field>
              </div>
            </div>
          </Card>
        </div>
      )}

      {step === "structure" && (
        <div className="space-y-4">
          <Card className="p-4 flex items-center gap-3 border-amber-300/60 bg-amber-50 dark:bg-amber-950/20">
            <div className="size-9 rounded-lg bg-amber-100 dark:bg-amber-900/40 grid place-items-center">
              <Lightbulb className="size-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">This step is optional</div>
              <div className="text-xs text-muted-foreground">
                Set up your organization and project structure now, or complete it later from the admin panel after registration.
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={goNext} className="gap-1.5">
              <FastForward className="size-3.5" /> Skip for Now
            </Button>
          </Card>

          <div className="inline-flex items-center gap-1 rounded-lg border border-border bg-card p-1">
            <button
              onClick={() => setStructureTab("org")}
              className={cn(
                "px-4 h-8 rounded-md text-sm font-medium flex items-center gap-2",
                structureTab === "org" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Network className="size-4" /> Organization
            </button>
            <button
              onClick={() => setStructureTab("projects")}
              className={cn(
                "px-4 h-8 rounded-md text-sm font-medium flex items-center gap-2",
                structureTab === "projects" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <FolderKanban className="size-4" /> Projects
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="p-5 lg:col-span-2">
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
                    <div className="text-sm font-semibold flex-1">{name || "Your Company"}</div>
                    <Badge variant="secondary" className="text-[10px]">Company Root</Badge>
                  </div>

                  <div className="flex flex-col gap-2">
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
                              <span className="ml-2 text-[10px] uppercase tracking-wider text-muted-foreground">{d.code}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground">{d.divisions.length} div</div>
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
                              <div key={div.id} className="flex items-center gap-2 pl-10 pr-3 py-2 hover:bg-muted/40 group">
                                <GripVertical className="size-3.5 text-muted-foreground/60" />
                                <div className="size-6 rounded-md bg-pink-100 dark:bg-pink-950/30 grid place-items-center">
                                  <UserRound className="size-3 text-pink-600" />
                                </div>
                                <div className="text-sm flex-1">{div.name}</div>
                                {div.users != null && (
                                  <Badge variant="outline" className="text-[10px]">
                                    <Users className="size-3 mr-1" /> {div.users} user{div.users === 1 ? "" : "s"}
                                  </Badge>
                                )}
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
                      <p className="text-xs text-muted-foreground mt-0.5">Optional projects and their groups</p>
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
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => setProjDialogOpen(true)}
                      >
                        <Plus className="size-3.5" /> Add Project
                      </Button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {projects.map((p) => (
                      <div key={p.id} className="rounded-xl border border-border p-3 flex items-center gap-3">
                        <div className="size-8 rounded-md bg-primary/10 grid place-items-center">
                          <FolderKanban className="size-4 text-primary" />
                        </div>
                        <div className="text-sm font-semibold flex-1">{p.name}</div>
                        <Badge variant="outline" className="text-[10px]">{p.groups} groups</Badge>
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

            <div className="space-y-4">
              <Card className="p-5">
                <h3 className="font-semibold">Structure Guide</h3>
                <p className="text-xs text-muted-foreground mt-1">Click any item to edit its properties</p>
                <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-3 text-[11px]">
                  <div className="uppercase tracking-wider text-muted-foreground mb-2">Hierarchy</div>
                  <div className="flex items-center gap-2">
                    <Building2 className="size-3.5 text-primary" />
                    <span className="font-medium">Company Root</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 pl-5">
                    <Network className="size-3.5 text-primary" />
                    <span className="font-medium">Department</span>
                    <span className="text-muted-foreground">(parent)</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5 pl-10">
                    <UserRound className="size-3.5 text-pink-600" />
                    <span className="font-medium">Division</span>
                  </div>
                </div>

                <ol className="mt-4 space-y-2.5 text-xs">
                  {[
                    "Create Departments (top-level under company)",
                    "Add Divisions under each Department",
                    "Optionally assign users — can be done after registration",
                  ].map((t, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="size-5 shrink-0 rounded-full bg-primary/10 text-primary text-[10px] font-semibold grid place-items-center">
                        {i + 1}
                      </span>
                      <span className="text-muted-foreground pt-0.5">{t}</span>
                    </li>
                  ))}
                </ol>
              </Card>

              <Card className="p-5 bg-slate-900 text-white border-slate-800">
                <div className="text-[10px] uppercase tracking-widest text-slate-400">Structure Summary</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-2xl font-bold">{departments.length}</div>
                    <div className="text-[11px] text-slate-400">Departments</div>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-2xl font-bold">{totalDivisions}</div>
                    <div className="text-[11px] text-slate-400">Divisions</div>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-2xl font-bold">{projects.length}</div>
                    <div className="text-[11px] text-slate-400">Projects</div>
                  </div>
                  <div className="rounded-lg bg-slate-800/60 p-3">
                    <div className="text-2xl font-bold">{totalGroups}</div>
                    <div className="text-[11px] text-slate-400">Groups</div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {step === "subscription" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((p) => (
            <PlanCard key={p.id} plan={p} selected={planId === p.id} onSelect={() => setPlanId(p.id)} />
          ))}
        </div>
      )}

      {step === "review" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Building2 className="size-4 text-primary" />
              <h3 className="font-semibold">Company Identity</h3>
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="size-14 rounded-lg bg-muted grid place-items-center text-[10px] font-semibold text-muted-foreground">
                LOGO
              </div>
              <div>
                <div className="font-semibold">{name}</div>
                <div className="text-xs text-muted-foreground">Industry: {industry}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <ReviewField label="Company Code" value={code} />
              <ReviewField label="Employees" value={employees} />
              <ReviewField
                label="Bank Account"
                value={`${bankName} — ${accountNumber} (${accountHolder})`}
                span
              />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <Network className="size-4 text-primary" />
              <h3 className="font-semibold">Structure Summary</h3>
            </div>
            <div className="mt-4 divide-y divide-border">
              <SummaryRow label="Departments" value={`${departments.length} Units`} />
              <SummaryRow label="Divisions" value={`${totalDivisions} Units`} />
              <SummaryRow label="Projects" value={`${projects.length} Projects`} />
              <SummaryRow label="Project Groups" value={`${totalGroups} Groups`} />
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-primary" />
              <h3 className="font-semibold">Selected Subscription</h3>
            </div>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <div className="font-semibold">{plan.name}</div>
                <div className="text-xs text-muted-foreground">Monthly billing cycle</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">${plan.price}</div>
                <div className="text-[11px] text-muted-foreground">per month</div>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-300/60">
            <div className="font-semibold">Ready to Go!</div>
            <p className="text-xs text-muted-foreground mt-1">
              Everything looks great. Once you create your company, you can start onboarding employees and setting up workflows.
            </p>
            <Button
              onClick={complete}
              className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11"
            >
              Create Company
            </Button>
          </Card>
        </div>
      )}

      {/* Footer nav */}
      <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
        <Button variant="outline" onClick={goPrev} disabled={idx === 0}>
          Previous
        </Button>
        {idx < STEPS.length - 1 ? (
          <Button onClick={goNext} className="gap-1.5">
            Next Step <ChevronRight className="size-4" />
          </Button>
        ) : (
          <Button onClick={complete} disabled={!canComplete} className="gap-1.5">
            Complete Registration <ChevronRight className="size-4" />
          </Button>
        )}
      </div>

      {/* Structure Dialogs */}
      <AddDepartmentDialog
        open={deptDialogOpen}
        onOpenChange={setDeptDialogOpen}
        onSubmit={handleAddDepartment}
      />
      <AddProjectDialog
        open={projDialogOpen}
        onOpenChange={setProjDialogOpen}
        onSubmit={handleAddProject}
      />
      <HierarchyDialog
        open={hierarchyOpen}
        onOpenChange={setHierarchyOpen}
        companyName={name}
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
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

function ReviewField({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={cn("rounded-lg border border-border p-3", span && "col-span-2")}>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-sm font-medium mt-1">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-sm font-semibold">{value}</div>
    </div>
  );
}

function PlanCard({
  plan,
  selected,
  onSelect,
}: {
  plan: Plan;
  selected: boolean;
  onSelect: () => void;
}) {
  const tones = useMemo(() => {
    switch (plan.tone) {
      case "blue":
        return "from-blue-500 to-blue-600 text-white";
      case "purple":
        return "from-violet-500 to-indigo-600 text-white";
      case "pink":
        return "from-fuchsia-500 to-pink-600 text-white";
      case "dark":
        return "from-slate-800 to-slate-900 text-white";
    }
  }, [plan.tone]);

  return (
    <button
      onClick={onSelect}
      className={cn(
        "text-left rounded-2xl border-2 bg-card overflow-hidden transition-all hover:shadow-[var(--shadow-elegant)]",
        selected ? "border-primary shadow-[var(--shadow-elegant)] scale-[1.02]" : "border-border",
      )}
    >
      <div className={cn("p-5 bg-gradient-to-br relative", tones)}>
        {selected && (
          <div className="absolute top-4 right-4 size-6 rounded-full bg-white/90 text-primary grid place-items-center">
            <Check className="size-3.5" />
          </div>
        )}
        <div className="text-sm font-semibold">{plan.name}</div>
        <div className="mt-3 flex items-end gap-1">
          <div className="text-3xl font-bold">${plan.price}</div>
          <div className="text-xs opacity-80 pb-1">/month</div>
        </div>
      </div>
      <div className="p-5">
        <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
          Features Included
        </div>
        <ul className="mt-3 space-y-2">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-emerald-500 shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
          <div className="text-xs font-medium text-muted-foreground">{plan.seats}</div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </div>
    </button>
  );
}
