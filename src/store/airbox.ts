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
  is_active: boolean;
  permissions: ModulePermission[];
}

// ============== Users / Invitations / Assignments ==============
export interface User {
  id: string;
  email: string;
  name: string;
  password_hash: string | null; // null until invitation accepted
  status: "invited" | "active" | "disabled";
  created_at: string;
}

export interface Invitation {
  id: string;
  token: string;
  email: string;
  name: string;
  company_id: string;
  role_id: string;
  invited_by: string;
  created_at: string;
  expires_at: string;
  status: "pending" | "accepted" | "revoked" | "expired";
}

// Per-user override on top of role permissions for a single module.
// undefined CRUD fields = inherit from role.
export interface PermissionOverride {
  module_id: string;
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
  special_add: SpecialAction[];
  special_remove: SpecialAction[];
}

export interface Assignment {
  id: string;
  company_id: string;
  user_id: string;
  role_id: string;
  overrides: PermissionOverride[];
  created_at: string;
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
      monthly_price: 450000,
      yearly_price: 4500000,
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
      monthly_price: 2250000,
      yearly_price: 22500000,
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
      monthly_price: 750000,
      yearly_price: 7500000,
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
      yearly_price: 29900000,
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
      monthly_price: 7500000,
      yearly_price: 75000000,
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
        is_active: true,
        permissions: perms,
      });
    }
  }
  return out;
}

interface AirboxState {
  modules: Module[];
  categories: string[];
  bundles: Bundle[];
  companies: Company[];
  subscriptions: Subscription[];
  roles: Role[];
  users: User[];
  invitations: Invitation[];
  assignments: Assignment[];

  // Modules
  importModules: (json: string) => { added: number; error?: string; newCategories?: string[] };
  toggleModuleStatus: (id: string) => void;
  addModule: (input: {
    name: string;
    category: string;
    group: string;
    dependencies?: string[];
  }) => { ok: true; id: string } | { ok: false; error: string };
  updateModule: (
    id: string,
    patch: Partial<Pick<Module, "name" | "category" | "group" | "dependencies">>,
  ) => void;
  deleteModule: (id: string) => { ok: true } | { ok: false; error: string };

  // Categories
  addCategory: (name: string) => { ok: true } | { ok: false; error: string };
  renameCategory: (oldName: string, newName: string) => { ok: true } | { ok: false; error: string };
  deleteCategory: (name: string) => { ok: true } | { ok: false; error: string };

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
  reactivateSubscription: (subId: string, activeUntil: string) => void;

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

  // User invitations & assignments
  inviteUser: (params: {
    email: string;
    name: string;
    company_id: string;
    role_id: string;
  }) => { invitation: Invitation; link: string };
  revokeInvitation: (invitationId: string) => void;
  resendInvitation: (invitationId: string) => { link: string } | undefined;
  acceptInvitation: (
    token: string,
    password: string,
  ) => { ok: true; user: User } | { ok: false; error: string };
  setAssignmentRole: (assignmentId: string, roleId: string) => void;
  removeAssignment: (assignmentId: string) => void;
  setUserStatus: (userId: string, status: User["status"]) => void;
  setOverrideCrud: (
    assignmentId: string,
    moduleId: string,
    field: CrudAction,
    value: boolean | "inherit",
  ) => void;
  toggleOverrideSpecial: (
    assignmentId: string,
    moduleId: string,
    action: SpecialAction,
    mode: "grant" | "revoke" | "inherit",
  ) => void;
  clearAssignmentOverrides: (assignmentId: string) => void;

  // Helpers
  resolveDependencies: (moduleIds: string[]) => { resolved: string[]; missing: string[] };
  effectivePermission: (
    assignmentId: string,
    moduleId: string,
  ) => ModulePermission | null;
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
        categories: Array.from(new Set(modules.map((m) => m.category))).sort(),
        bundles,
        companies,
        subscriptions: initialSubs,
        roles: seedRoles(bundles),
        users: [],
        invitations: [],
        assignments: [],


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
            const newCats = Array.from(
              new Set(additions.map((a) => a.category).filter((c) => !get().categories.includes(c))),
            );
            set({
              modules: [...get().modules, ...additions],
              categories: [...get().categories, ...newCats].sort(),
            });
            return { added: additions.length, newCategories: newCats };
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

        addModule: ({ name, category, group, dependencies = [] }) => {
          const trimmed = name.trim();
          if (!trimmed) return { ok: false, error: "Name is required." };
          if (!category.trim()) return { ok: false, error: "Category is required." };
          if (!group.trim()) return { ok: false, error: "Group is required." };
          const id = nameToId(trimmed);
          if (get().modules.some((m) => m.id === id))
            return { ok: false, error: "A module with this name already exists." };
          const mod: Module = {
            id,
            name: trimmed,
            code: id.toUpperCase().replace(/-/g, "_"),
            category: category.trim(),
            group: group.trim(),
            dependencies: dependencies.filter((d) => d !== id),
            status: "active",
          };
          const cats = get().categories.includes(mod.category)
            ? get().categories
            : [...get().categories, mod.category].sort();
          set({ modules: [...get().modules, mod], categories: cats });
          return { ok: true, id };
        },

        updateModule: (id, patch) =>
          set({
            modules: get().modules.map((m) =>
              m.id === id
                ? { ...m, ...patch, dependencies: (patch.dependencies ?? m.dependencies).filter((d) => d !== id) }
                : m,
            ),
          }),

        deleteModule: (id) => {
          const dependents = get().modules.filter((m) => m.dependencies.includes(id));
          if (dependents.length > 0)
            return {
              ok: false,
              error: `Cannot delete: ${dependents.length} module(s) depend on this. Remove dependencies first.`,
            };
          const bundlesUsing = get().bundles.filter((b) => b.module_ids.includes(id));
          if (bundlesUsing.length > 0)
            return {
              ok: false,
              error: `Cannot delete: used by ${bundlesUsing.length} bundle(s). Remove from bundles first.`,
            };
          set({ modules: get().modules.filter((m) => m.id !== id) });
          return { ok: true };
        },

        addCategory: (name) => {
          const n = name.trim();
          if (!n) return { ok: false, error: "Name is required." };
          if (get().categories.some((c) => c.toLowerCase() === n.toLowerCase()))
            return { ok: false, error: "Category already exists." };
          set({ categories: [...get().categories, n].sort() });
          return { ok: true };
        },

        renameCategory: (oldName, newName) => {
          const n = newName.trim();
          if (!n) return { ok: false, error: "Name is required." };
          if (!get().categories.includes(oldName))
            return { ok: false, error: "Category not found." };
          if (
            oldName !== n &&
            get().categories.some((c) => c.toLowerCase() === n.toLowerCase())
          )
            return { ok: false, error: "A category with that name already exists." };
          set({
            categories: get()
              .categories.map((c) => (c === oldName ? n : c))
              .sort(),
            modules: get().modules.map((m) => (m.category === oldName ? { ...m, category: n } : m)),
          });
          return { ok: true };
        },

        deleteCategory: (name) => {
          const used = get().modules.filter((m) => m.category === name).length;
          if (used > 0)
            return { ok: false, error: `Cannot delete: ${used} module(s) still use this category.` };
          set({ categories: get().categories.filter((c) => c !== name) });
          return { ok: true };
        },

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

        reactivateSubscription: (subId, activeUntil) =>
          set({
            subscriptions: get().subscriptions.map((s) =>
              s.id === subId ? { ...s, status: "active", active_until: activeUntil } : s,
            ),
          }),


        createRole: (bundleId, name, description = "") => {
          const id = uid();
          const bundle = get().bundles.find((b) => b.id === bundleId);
          const perms: ModulePermission[] = bundle
            ? bundle.module_ids.map((mid) => ({
                module_id: mid,
                create: false,
                read: true,
                update: false,
                delete: false,
                special: [],
              }))
            : [];
          set({
            roles: [
              ...get().roles,
              { id, bundle_id: bundleId, name, description, is_default: false, is_active: false, permissions: perms },
            ],
          });
          return id;
        },

        updateRole: (id, patch) =>
          set({
            roles: get().roles.map((r) => (r.id === id ? { ...r, ...patch } : r)),
          }),

        deleteRole: (id) =>
          set({ roles: get().roles.filter((r) => r.id !== id) }),

        duplicateRole: (id) => {
          const src = get().roles.find((r) => r.id === id);
          if (!src) return undefined;
          const newId = uid();
          set({
            roles: [
              ...get().roles,
              {
                ...src,
                id: newId,
                name: `${src.name} (Copy)`,
                is_default: false,
                is_active: false,
                permissions: src.permissions.map((p) => ({ ...p, special: [...p.special] })),
              },
            ],
          });
          return newId;
        },

        setPermission: (roleId, moduleId, patch) =>
          set({
            roles: get().roles.map((r) => {
              if (r.id !== roleId) return r;
              const exists = r.permissions.some((p) => p.module_id === moduleId);
              const permissions = exists
                ? r.permissions.map((p) => (p.module_id === moduleId ? { ...p, ...patch } : p))
                : [
                    ...r.permissions,
                    {
                      module_id: moduleId,
                      create: false,
                      read: false,
                      update: false,
                      delete: false,
                      special: [] as SpecialAction[],
                      ...patch,
                    },
                  ];
              return { ...r, permissions };
            }),
          }),

        bulkSetCrud: (roleId, action, value) =>
          set({
            roles: get().roles.map((r) =>
              r.id === roleId
                ? { ...r, permissions: r.permissions.map((p) => ({ ...p, [action]: value })) }
                : r,
            ),
          }),

        applyRoleTemplate: (roleId, mode) =>
          set({
            roles: get().roles.map((r) => {
              if (r.id !== roleId) return r;
              const ids = r.permissions.map((p) => p.module_id);
              const next =
                mode === "full"
                  ? fullPerm(ids)
                  : mode === "read"
                    ? readOnlyPerm(ids)
                    : mode === "approver"
                      ? approverPerm(ids)
                      : ids.map((id) => ({
                          module_id: id,
                          create: false,
                          read: false,
                          update: false,
                          delete: false,
                          special: [] as SpecialAction[],
                        }));
              return { ...r, permissions: next };
            }),
          }),

        syncRolesWithBundle: (bundleId) => {
          const bundle = get().bundles.find((b) => b.id === bundleId);
          if (!bundle) return;
          set({
            roles: get().roles.map((r) => {
              if (r.bundle_id !== bundleId) return r;
              const existing = new Map(r.permissions.map((p) => [p.module_id, p]));
              const next: ModulePermission[] = bundle.module_ids.map(
                (mid) =>
                  existing.get(mid) ?? {
                    module_id: mid,
                    create: false,
                    read: true,
                    update: false,
                    delete: false,
                    special: [],
                  },
              );
              return { ...r, is_active: true, permissions: next };
            }),
          });
        },

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

        inviteUser: ({ email, name, company_id, role_id }) => {
          const token = uid() + uid();
          const now = new Date().toISOString();
          const expires = new Date(Date.now() + 7 * 86400000).toISOString();
          const inv: Invitation = {
            id: uid(),
            token,
            email: email.toLowerCase().trim(),
            name: name.trim(),
            company_id,
            role_id,
            invited_by: "ops@airbox.io",
            created_at: now,
            expires_at: expires,
            status: "pending",
          };
          set({ invitations: [...get().invitations, inv] });
          const link = `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invite/${token}`;
          return { invitation: inv, link };
        },

        revokeInvitation: (id) =>
          set({
            invitations: get().invitations.map((i) =>
              i.id === id ? { ...i, status: "revoked" } : i,
            ),
          }),

        resendInvitation: (id) => {
          const inv = get().invitations.find((i) => i.id === id);
          if (!inv) return undefined;
          const newExpires = new Date(Date.now() + 7 * 86400000).toISOString();
          set({
            invitations: get().invitations.map((i) =>
              i.id === id ? { ...i, status: "pending", expires_at: newExpires } : i,
            ),
          });
          const link = `${typeof window !== "undefined" ? window.location.origin : ""}/accept-invite/${inv.token}`;
          return { link };
        },

        acceptInvitation: (token, password) => {
          const inv = get().invitations.find((i) => i.token === token);
          if (!inv) return { ok: false, error: "Invitation not found." };
          if (inv.status === "accepted") return { ok: false, error: "Invitation already used." };
          if (inv.status === "revoked") return { ok: false, error: "Invitation was revoked." };
          if (new Date(inv.expires_at).getTime() < Date.now())
            return { ok: false, error: "Invitation has expired." };
          if (password.length < 8)
            return { ok: false, error: "Password must be at least 8 characters." };

          // create or reuse user
          const existing = get().users.find((u) => u.email === inv.email);
          const user: User =
            existing ?? {
              id: uid(),
              email: inv.email,
              name: inv.name,
              password_hash: null,
              status: "invited",
              created_at: new Date().toISOString(),
            };
          // pseudo-hash (demo only)
          const hash = btoa(`${user.email}:${password}`);
          const updatedUser: User = { ...user, password_hash: hash, status: "active" };

          const users = existing
            ? get().users.map((u) => (u.id === existing.id ? updatedUser : u))
            : [...get().users, updatedUser];

          // create assignment (avoid duplicate for same company+user)
          const dup = get().assignments.find(
            (a) => a.company_id === inv.company_id && a.user_id === updatedUser.id,
          );
          const assignments = dup
            ? get().assignments.map((a) =>
                a.id === dup.id ? { ...a, role_id: inv.role_id } : a,
              )
            : [
                ...get().assignments,
                {
                  id: uid(),
                  company_id: inv.company_id,
                  user_id: updatedUser.id,
                  role_id: inv.role_id,
                  overrides: [],
                  created_at: new Date().toISOString(),
                },
              ];

          set({
            users,
            assignments,
            invitations: get().invitations.map((i) =>
              i.id === inv.id ? { ...i, status: "accepted" } : i,
            ),
          });
          return { ok: true, user: updatedUser };
        },

        setAssignmentRole: (assignmentId, roleId) =>
          set({
            assignments: get().assignments.map((a) =>
              a.id === assignmentId ? { ...a, role_id: roleId, overrides: [] } : a,
            ),
          }),

        removeAssignment: (id) =>
          set({ assignments: get().assignments.filter((a) => a.id !== id) }),

        setUserStatus: (userId, status) =>
          set({
            users: get().users.map((u) => (u.id === userId ? { ...u, status } : u)),
          }),

        setOverrideCrud: (assignmentId, moduleId, field, value) =>
          set({
            assignments: get().assignments.map((a) => {
              if (a.id !== assignmentId) return a;
              const existing = a.overrides.find((o) => o.module_id === moduleId);
              let nextOverride: PermissionOverride = existing
                ? { ...existing }
                : { module_id: moduleId, special_add: [], special_remove: [] };
              if (value === "inherit") {
                delete (nextOverride as unknown as Record<string, unknown>)[field];
              } else {
                (nextOverride as unknown as Record<string, unknown>)[field] = value;
              }
              const empty =
                nextOverride.create === undefined &&
                nextOverride.read === undefined &&
                nextOverride.update === undefined &&
                nextOverride.delete === undefined &&
                nextOverride.special_add.length === 0 &&
                nextOverride.special_remove.length === 0;
              const overrides = existing
                ? empty
                  ? a.overrides.filter((o) => o.module_id !== moduleId)
                  : a.overrides.map((o) => (o.module_id === moduleId ? nextOverride : o))
                : empty
                  ? a.overrides
                  : [...a.overrides, nextOverride];
              return { ...a, overrides };
            }),
          }),

        toggleOverrideSpecial: (assignmentId, moduleId, action, mode) =>
          set({
            assignments: get().assignments.map((a) => {
              if (a.id !== assignmentId) return a;
              const existing = a.overrides.find((o) => o.module_id === moduleId);
              const base: PermissionOverride = existing
                ? {
                    ...existing,
                    special_add: [...existing.special_add],
                    special_remove: [...existing.special_remove],
                  }
                : { module_id: moduleId, special_add: [], special_remove: [] };
              base.special_add = base.special_add.filter((s) => s !== action);
              base.special_remove = base.special_remove.filter((s) => s !== action);
              if (mode === "grant") base.special_add.push(action);
              if (mode === "revoke") base.special_remove.push(action);
              const empty =
                base.create === undefined &&
                base.read === undefined &&
                base.update === undefined &&
                base.delete === undefined &&
                base.special_add.length === 0 &&
                base.special_remove.length === 0;
              const overrides = existing
                ? empty
                  ? a.overrides.filter((o) => o.module_id !== moduleId)
                  : a.overrides.map((o) => (o.module_id === moduleId ? base : o))
                : empty
                  ? a.overrides
                  : [...a.overrides, base];
              return { ...a, overrides };
            }),
          }),

        clearAssignmentOverrides: (assignmentId) =>
          set({
            assignments: get().assignments.map((a) =>
              a.id === assignmentId ? { ...a, overrides: [] } : a,
            ),
          }),

        effectivePermission: (assignmentId, moduleId) => {
          const a = get().assignments.find((x) => x.id === assignmentId);
          if (!a) return null;
          const role = get().roles.find((r) => r.id === a.role_id);
          if (!role) return null;
          const base =
            role.permissions.find((p) => p.module_id === moduleId) ?? {
              module_id: moduleId,
              create: false,
              read: false,
              update: false,
              delete: false,
              special: [] as SpecialAction[],
            };
          const ov = a.overrides.find((o) => o.module_id === moduleId);
          if (!ov) return base;
          const special = new Set<SpecialAction>(base.special);
          for (const s of ov.special_add) special.add(s);
          for (const s of ov.special_remove) special.delete(s);
          return {
            module_id: moduleId,
            create: ov.create ?? base.create,
            read: ov.read ?? base.read,
            update: ov.update ?? base.update,
            delete: ov.delete ?? base.delete,
            special: Array.from(special),
          };
        },
      };
    },
    {
      name: "airbox-store-v4",
    },

  ),
);
