import { create } from "zustand";
import { persist } from "zustand/middleware";
import { MODULE_SEED, slugify } from "@/data/modules";

export type Status = "active" | "inactive";
export type PricingType = "free" | "monthly" | "yearly" | "both";

export interface Module {
  id: string;
  name: string;
  code: string;
  category: string;
  group: string;
  dependencies: string[]; // module ids
  status: Status;
}

export interface Bundle {
  id: string;
  name: string;
  code: string;
  description: string;
  category: string;
  pricing_type: PricingType;
  monthly_price: number;
  yearly_price: number;
  module_ids: string[];
  status: Status;
  is_template: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  industry: string;
  employees: number;
}

export interface Subscription {
  id: string;
  company_id: string;
  bundle_id: string;
  active_until: string;
  status: "active" | "expired" | "cancelled";
  created_at: string;
}

// ============== RBAC ==============
export type CrudAction = "create" | "read" | "update" | "delete";
export const SPECIAL_ACTIONS = [
  "approve",
  "export",
  "import",
  "publish",
  "assign",
  "configure",
] as const;
export type SpecialAction = (typeof SPECIAL_ACTIONS)[number];

export interface ModulePermission {
  module_id: string;
  create: boolean;
  read: boolean;
  update: boolean;
  delete: boolean;
  special: SpecialAction[];
}

export interface Role {
  id: string;
  bundle_id: string;
  name: string;
  description: string;
  is_default: boolean;
  permissions: ModulePermission[];
}

const nameToId = (name: string) => slugify(name);

function buildSeedModules(): Module[] {
  return MODULE_SEED.map((m) => ({
    id: nameToId(m.module_name),
    name: m.module_name,
    code: nameToId(m.module_name).toUpperCase().replace(/-/g, "_"),
    category: m.category,
    group: m.group,
    dependencies: m.dependencies.map(nameToId),
    status: "active" as const,
  }));
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function seedBundles(modules: Module[]): Bundle[] {
  const byCat = (cat: string) => modules.filter((m) => m.category === cat).map((m) => m.id);
  const now = new Date().toISOString();
  return [
    {
      id: uid(),
      name: "Basic HRIS",
      code: "BASIC_HRIS",
      description: "Essentials for managing a small workforce.",
      category: "HRIS",
      pricing_type: "monthly",
      monthly_price: 29,
      yearly_price: 290,
      module_ids: [
        nameToId("Employee Profile"),
        nameToId("Employee Attendance"),
        nameToId("Leave Management"),
        nameToId("Shift Schedule"),
      ],
      status: "active",
      is_template: true,
      created_at: now,
    },
    {
      id: uid(),
      name: "Enterprise HRIS",
      code: "ENT_HRIS",
      description: "Full HR + Payroll suite for large organisations.",
      category: "HRIS",
      pricing_type: "both",
      monthly_price: 149,
      yearly_price: 1490,
      module_ids: byCat("HRIS & Payroll"),
      status: "active",
      is_template: true,
      created_at: now,
    },
    {
      id: uid(),
      name: "Accounting Starter",
      code: "ACC_START",
      description: "Core ledger and statements to get books in order.",
      category: "Finance",
      pricing_type: "monthly",
      monthly_price: 49,
      yearly_price: 490,
      module_ids: [
        nameToId("Chart of Account"),
        nameToId("General Ledger"),
        nameToId("Journal Entries"),
        nameToId("Profit & Loss"),
        nameToId("Balance Sheet"),
        nameToId("Cash Flow Statement"),
      ],
      status: "active",
      is_template: true,
      created_at: now,
    },
    {
      id: uid(),
      name: "Logistics Pro",
      code: "LOG_PRO",
      description: "Cargo, shipment & fleet operations in one bundle.",
      category: "Operations",
      pricing_type: "yearly",
      monthly_price: 0,
      yearly_price: 1990,
      module_ids: [...byCat("Logistics & Cargo"), ...byCat("Fleet Management")],
      status: "active",
      is_template: true,
      created_at: now,
    },
    {
      id: uid(),
      name: "Full ERP Suite",
      code: "FULL_ERP",
      description: "Every module Airbox offers, in a single subscription.",
      category: "Enterprise",
      pricing_type: "both",
      monthly_price: 499,
      yearly_price: 4990,
      module_ids: modules.map((m) => m.id),
      status: "active",
      is_template: true,
      created_at: now,
    },
  ];
}

function seedCompanies(): Company[] {
  return [
    { id: uid(), name: "Garuda Cargo Indonesia", industry: "Logistics", employees: 1200 },
    { id: uid(), name: "Bumi Pertiwi Manufacturing", industry: "Manufacturing", employees: 540 },
    { id: uid(), name: "Nusantara Airlines", industry: "Aviation", employees: 3100 },
    { id: uid(), name: "Sentosa Retail Group", industry: "Retail", employees: 220 },
    { id: uid(), name: "Mitra Konstruksi", industry: "Construction", employees: 880 },
  ];
}

function fullPerm(moduleIds: string[]): ModulePermission[] {
  return moduleIds.map((id) => ({
    module_id: id,
    create: true,
    read: true,
    update: true,
    delete: true,
    special: [...SPECIAL_ACTIONS],
  }));
}

function readOnlyPerm(moduleIds: string[]): ModulePermission[] {
  return moduleIds.map((id) => ({
    module_id: id,
    create: false,
    read: true,
    update: false,
    delete: false,
    special: [],
  }));
}

function approverPerm(moduleIds: string[]): ModulePermission[] {
  return moduleIds.map((id) => ({
    module_id: id,
    create: false,
    read: true,
    update: true,
    delete: false,
    special: ["approve"] as SpecialAction[],
  }));
}

const ROLE_BLUEPRINTS: Record<string, Array<{ name: string; description: string; mode: "full" | "read" | "approver" }>> = {
  BASIC_HRIS: [
    { name: "HR Admin", description: "Full access to HR data.", mode: "full" },
    { name: "Manager", description: "Approves leave & reviews team.", mode: "approver" },
    { name: "Employee", description: "Self-service access only.", mode: "read" },
  ],
  ENT_HRIS: [
    { name: "HR Admin", description: "Full HR & Payroll access.", mode: "full" },
    { name: "Payroll Officer", description: "Manage payroll & taxes.", mode: "full" },
    { name: "Manager", description: "Team approvals & reviews.", mode: "approver" },
    { name: "Employee", description: "Personal data only.", mode: "read" },
  ],
  ACC_START: [
    { name: "Finance Admin", description: "Full ledger & reporting access.", mode: "full" },
    { name: "Accountant", description: "Day-to-day bookkeeping.", mode: "approver" },
    { name: "Auditor", description: "Read-only access.", mode: "read" },
  ],
  LOG_PRO: [
    { name: "Operations Admin", description: "Full ops oversight.", mode: "full" },
    { name: "Dispatcher", description: "Bookings & shipments.", mode: "approver" },
    { name: "Driver", description: "Trip log only.", mode: "read" },
  ],
  FULL_ERP: [
    { name: "Super Admin", description: "Owner of the tenant.", mode: "full" },
    { name: "Department Manager", description: "Approves cross-module workflows.", mode: "approver" },
    { name: "Staff", description: "Daily transactional usage.", mode: "read" },
  ],
};

function seedRoles(bundles: Bundle[]): Role[] {
  const out: Role[] = [];
  for (const b of bundles) {
    const blueprint = ROLE_BLUEPRINTS[b.code] ?? [
      { name: "Admin", description: "Full access.", mode: "full" as const },
      { name: "Member", description: "Read-only access.", mode: "read" as const },
    ];
    for (const r of blueprint) {
      const perms =
        r.mode === "full"
          ? fullPerm(b.module_ids)
          : r.mode === "read"
            ? readOnlyPerm(b.module_ids)
            : approverPerm(b.module_ids);
      out.push({
        id: uid(),
        bundle_id: b.id,
        name: r.name,
        description: r.description,
        is_default: true,
        permissions: perms,
      });
    }
  }
  return out;
}

interface AirboxState {
  modules: Module[];
  bundles: Bundle[];
  companies: Company[];
  subscriptions: Subscription[];
  roles: Role[];

  // Modules
  importModules: (json: string) => { added: number; error?: string };
  toggleModuleStatus: (id: string) => void;

  // Bundles
  createBundle: (b: Omit<Bundle, "id" | "created_at">) => string;
  updateBundle: (id: string, patch: Partial<Bundle>) => void;
  duplicateBundle: (id: string) => string | undefined;
  archiveBundle: (id: string) => void;
  toggleBundleStatus: (id: string) => void;
  addModulesToBundle: (id: string, moduleIds: string[]) => void;
  removeModuleFromBundle: (id: string, moduleId: string) => void;
  setBundleModules: (id: string, moduleIds: string[]) => void;
  applyTemplate: (templateId: string, newName: string) => string | undefined;

  // Companies / Subscriptions
  assignBundle: (companyId: string, bundleId: string, activeUntil: string) => void;
  bulkAssign: (companyIds: string[], bundleId: string, activeUntil: string) => void;
  cancelSubscription: (subId: string) => void;

  // RBAC
  createRole: (bundleId: string, name: string, description?: string) => string;
  updateRole: (id: string, patch: Partial<Pick<Role, "name" | "description">>) => void;
  deleteRole: (id: string) => void;
  duplicateRole: (id: string) => string | undefined;
  setPermission: (
    roleId: string,
    moduleId: string,
    patch: Partial<Omit<ModulePermission, "module_id">>,
  ) => void;
  bulkSetCrud: (roleId: string, action: CrudAction, value: boolean) => void;
  applyRoleTemplate: (roleId: string, mode: "full" | "read" | "approver" | "none") => void;
  syncRolesWithBundle: (bundleId: string) => void;

  // Helpers
  resolveDependencies: (moduleIds: string[]) => { resolved: string[]; missing: string[] };
}

export const useAirbox = create<AirboxState>()(
  persist(
    (set, get) => {
      const modules = buildSeedModules();
      const bundles = seedBundles(modules);
      const companies = seedCompanies();
      // seed one subscription
      const initialSubs: Subscription[] = [
        {
          id: uid(),
          company_id: companies[0].id,
          bundle_id: bundles[3].id,
          active_until: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
          status: "active",
          created_at: new Date().toISOString(),
        },
        {
          id: uid(),
          company_id: companies[2].id,
          bundle_id: bundles[4].id,
          active_until: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
          status: "active",
          created_at: new Date().toISOString(),
        },
      ];

      return {
        modules,
        bundles,
        companies,
        subscriptions: initialSubs,

        importModules: (json) => {
          try {
            const parsed = JSON.parse(json) as Array<{
              module_name: string;
              category: string;
              group: string;
              dependencies?: string[];
            }>;
            if (!Array.isArray(parsed)) throw new Error("Expected an array");
            const existing = new Set(get().modules.map((m) => m.id));
            const additions: Module[] = [];
            for (const m of parsed) {
              const id = nameToId(m.module_name);
              if (existing.has(id)) continue;
              additions.push({
                id,
                name: m.module_name,
                code: id.toUpperCase().replace(/-/g, "_"),
                category: m.category,
                group: m.group,
                dependencies: (m.dependencies ?? []).map(nameToId),
                status: "active",
              });
              existing.add(id);
            }
            set({ modules: [...get().modules, ...additions] });
            return { added: additions.length };
          } catch (e) {
            return { added: 0, error: (e as Error).message };
          }
        },

        toggleModuleStatus: (id) =>
          set({
            modules: get().modules.map((m) =>
              m.id === id ? { ...m, status: m.status === "active" ? "inactive" : "active" } : m,
            ),
          }),

        createBundle: (b) => {
          const id = uid();
          set({
            bundles: [
              ...get().bundles,
              { ...b, id, created_at: new Date().toISOString() },
            ],
          });
          return id;
        },

        updateBundle: (id, patch) =>
          set({
            bundles: get().bundles.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          }),

        duplicateBundle: (id) => {
          const src = get().bundles.find((b) => b.id === id);
          if (!src) return undefined;
          const newId = uid();
          set({
            bundles: [
              ...get().bundles,
              {
                ...src,
                id: newId,
                name: `${src.name} (Copy)`,
                code: `${src.code}_COPY`,
                is_template: false,
                created_at: new Date().toISOString(),
              },
            ],
          });
          return newId;
        },

        archiveBundle: (id) =>
          set({
            bundles: get().bundles.map((b) =>
              b.id === id ? { ...b, status: "inactive" } : b,
            ),
          }),

        toggleBundleStatus: (id) =>
          set({
            bundles: get().bundles.map((b) =>
              b.id === id ? { ...b, status: b.status === "active" ? "inactive" : "active" } : b,
            ),
          }),

        addModulesToBundle: (id, moduleIds) =>
          set({
            bundles: get().bundles.map((b) =>
              b.id === id
                ? { ...b, module_ids: Array.from(new Set([...b.module_ids, ...moduleIds])) }
                : b,
            ),
          }),

        removeModuleFromBundle: (id, moduleId) =>
          set({
            bundles: get().bundles.map((b) =>
              b.id === id ? { ...b, module_ids: b.module_ids.filter((m) => m !== moduleId) } : b,
            ),
          }),

        setBundleModules: (id, moduleIds) =>
          set({
            bundles: get().bundles.map((b) =>
              b.id === id ? { ...b, module_ids: moduleIds } : b,
            ),
          }),

        applyTemplate: (templateId, newName) => {
          const tpl = get().bundles.find((b) => b.id === templateId);
          if (!tpl) return undefined;
          const id = uid();
          set({
            bundles: [
              ...get().bundles,
              {
                ...tpl,
                id,
                name: newName,
                code: nameToId(newName).toUpperCase().replace(/-/g, "_"),
                is_template: false,
                created_at: new Date().toISOString(),
              },
            ],
          });
          return id;
        },

        assignBundle: (companyId, bundleId, activeUntil) =>
          set({
            subscriptions: [
              ...get().subscriptions,
              {
                id: uid(),
                company_id: companyId,
                bundle_id: bundleId,
                active_until: activeUntil,
                status: "active",
                created_at: new Date().toISOString(),
              },
            ],
          }),

        bulkAssign: (companyIds, bundleId, activeUntil) => {
          const now = new Date().toISOString();
          const additions: Subscription[] = companyIds.map((cid) => ({
            id: uid(),
            company_id: cid,
            bundle_id: bundleId,
            active_until: activeUntil,
            status: "active",
            created_at: now,
          }));
          set({ subscriptions: [...get().subscriptions, ...additions] });
        },

        cancelSubscription: (subId) =>
          set({
            subscriptions: get().subscriptions.map((s) =>
              s.id === subId ? { ...s, status: "cancelled" } : s,
            ),
          }),

        resolveDependencies: (moduleIds) => {
          const all = get().modules;
          const byId = new Map(all.map((m) => [m.id, m]));
          const set0 = new Set(moduleIds);
          const missing = new Set<string>();
          const queue = [...moduleIds];
          while (queue.length) {
            const id = queue.shift()!;
            const mod = byId.get(id);
            if (!mod) continue;
            for (const dep of mod.dependencies) {
              if (!set0.has(dep)) {
                if (!missing.has(dep)) {
                  missing.add(dep);
                  queue.push(dep);
                }
              }
            }
          }
          return {
            resolved: Array.from(new Set([...moduleIds, ...missing])),
            missing: Array.from(missing),
          };
        },
      };
    },
    {
      name: "airbox-store-v1",
    },
  ),
);
