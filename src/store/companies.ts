import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CompanyStatus = "active" | "inactive";
export type BillingCycle = "monthly" | "yearly";

export type Division = { id: string; name: string; users?: number };
export type Department = {
  id: string;
  name: string;
  code: string;
  divisions: Division[];
};
export type ProjectItem = { id: string; name: string; groups: number };

export type CompanySubscription = {
  planId: string;
  planName: string;
  price: number;
  status: CompanyStatus;
  billingCycle: BillingCycle;
};

export type CompanyRecord = {
  id: string;
  name: string;
  code: string;
  email: string;
  industry: string;
  employees: string;
  npwp?: string;
  nib?: string;
  website?: string;
  phone?: string;
  address?: string;
  bank: { name: string; number: string; holder: string };
  regDate: string; // ISO date (YYYY-MM-DD)
  status: CompanyStatus;
  tone: string;
  subscription: CompanySubscription;
  structure: {
    departments: Department[];
    projects: ProjectItem[];
  };
};

const uid = () => Math.random().toString(36).slice(2, 10);

function defaultStructure() {
  return {
    departments: [
      {
        id: uid(),
        name: "Human Capital",
        code: "HC",
        divisions: [
          { id: uid(), name: "Recruitment", users: 4 },
          { id: uid(), name: "Payroll", users: 2 },
          { id: uid(), name: "Employee Relations", users: 3 },
        ],
      },
      {
        id: uid(),
        name: "Finance",
        code: "FIN",
        divisions: [
          { id: uid(), name: "Accounting", users: 5 },
          { id: uid(), name: "Treasury", users: 2 },
          { id: uid(), name: "Tax", users: 2 },
        ],
      },
      {
        id: uid(),
        name: "Operations",
        code: "OPS",
        divisions: [
          { id: uid(), name: "Warehouse", users: 12 },
          { id: uid(), name: "Fleet", users: 8 },
          { id: uid(), name: "Dispatch", users: 6 },
        ],
      },
    ],
    projects: [
      { id: uid(), name: "ERP Rollout 2027", groups: 2 },
      { id: uid(), name: "Warehouse Expansion", groups: 2 },
    ],
  };
}

function seed(): CompanyRecord[] {
  const base: Omit<CompanyRecord, "structure" | "bank">[] = [
    { id: "c-1", name: "PT Wahana Digital", email: "hello@wahanadigital.id", code: "WHD-ID", industry: "Technology", employees: "51 - 200", regDate: "2025-03-14", status: "inactive", tone: "sky", subscription: { planId: "hris", planName: "HRIS Starter", price: 199, status: "inactive", billingCycle: "monthly" } },
    { id: "c-2", name: "PT Indo Cargo Express", email: "ops@indocargo.id", code: "ICE-ID", industry: "Logistics & Supply Chain", employees: "201 - 500", regDate: "2025-01-30", status: "active", tone: "violet", subscription: { planId: "log", planName: "Logistics Suite", price: 799, status: "active", billingCycle: "monthly" } },
    { id: "c-3", name: "PT Nusantara Tech", email: "hello@nusantaratech.id", code: "NST-ID", industry: "Technology", employees: "51 - 200", regDate: "2024-06-10", status: "inactive", tone: "emerald", subscription: { planId: "acc", planName: "Accounting Pro", price: 399, status: "inactive", billingCycle: "monthly" } },
    { id: "c-4", name: "PT Garuda Logistics", email: "info@garudalogistics.id", code: "GRL-ID", industry: "Aviation & Aerospace", employees: "501 - 1000", regDate: "2024-03-22", status: "active", tone: "amber", subscription: { planId: "erp", planName: "Full ERP", price: 1499, status: "active", billingCycle: "yearly" } },
    { id: "c-5", name: "PT Airbox Indonesia", email: "corporate@airbox.id", code: "AIR-ID", industry: "Logistics & Supply Chain", employees: "201 - 500", regDate: "2024-01-15", status: "active", tone: "rose", subscription: { planId: "erp", planName: "Full ERP", price: 1499, status: "active", billingCycle: "yearly" } },
    { id: "c-6", name: "PT Sentosa Retail", email: "cs@sentosaretail.id", code: "SNR-ID", industry: "Retail", employees: "51 - 200", regDate: "2023-11-04", status: "inactive", tone: "cyan", subscription: { planId: "hris", planName: "HRIS Starter", price: 199, status: "inactive", billingCycle: "monthly" } },
    { id: "c-7", name: "PT Mitra Konstruksi", email: "office@mitrakonstruksi.id", code: "MTK-ID", industry: "Construction", employees: "201 - 500", regDate: "2023-08-19", status: "active", tone: "indigo", subscription: { planId: "acc", planName: "Accounting Pro", price: 399, status: "active", billingCycle: "monthly" } },
  ];
  return base.map((b) => ({
    ...b,
    bank: { name: "BCA", number: "1234567890", holder: b.name },
    structure: defaultStructure(),
  }));
}

interface CompaniesState {
  items: CompanyRecord[];
  add: (c: Omit<CompanyRecord, "id" | "regDate" | "tone"> & Partial<Pick<CompanyRecord, "id" | "regDate" | "tone">>) => string;
  update: (id: string, patch: Partial<CompanyRecord>) => void;
  remove: (id: string) => void;
  toggleStatus: (id: string) => void;
  toggleSubscriptionStatus: (id: string) => void;
  getById: (id: string) => CompanyRecord | undefined;
}

const TONES = ["sky", "violet", "emerald", "amber", "rose", "cyan", "indigo"];

export const useCompanies = create<CompaniesState>()(
  persist(
    (set, get) => ({
      items: seed(),
      add: (c) => {
        const id = c.id ?? `c-${uid()}`;
        const regDate = c.regDate ?? new Date().toISOString().slice(0, 10);
        const tone = c.tone ?? TONES[Math.floor(Math.random() * TONES.length)];
        set({ items: [{ ...(c as CompanyRecord), id, regDate, tone }, ...get().items] });
        return id;
      },
      update: (id, patch) =>
        set({ items: get().items.map((x) => (x.id === id ? { ...x, ...patch } : x)) }),
      remove: (id) => set({ items: get().items.filter((x) => x.id !== id) }),
      toggleStatus: (id) =>
        set({
          items: get().items.map((x) =>
            x.id === id ? { ...x, status: x.status === "active" ? "inactive" : "active" } : x,
          ),
        }),
      toggleSubscriptionStatus: (id) =>
        set({
          items: get().items.map((x) =>
            x.id === id
              ? {
                  ...x,
                  subscription: {
                    ...x.subscription,
                    status: x.subscription.status === "active" ? "inactive" : "active",
                  },
                }
              : x,
          ),
        }),
      getById: (id) => get().items.find((x) => x.id === id),
    }),
    { name: "airbox.companies.v1" },
  ),
);

export const TONE_MAP: Record<string, string> = {
  sky: "from-sky-500 to-sky-400",
  violet: "from-violet-500 to-violet-400",
  emerald: "from-emerald-500 to-emerald-400",
  amber: "from-amber-500 to-amber-400",
  rose: "from-rose-500 to-rose-400",
  cyan: "from-cyan-500 to-cyan-400",
  indigo: "from-indigo-500 to-indigo-400",
};

export function formatRegDate(iso: string) {
  const d = new Date(iso + "T00:00:00Z");
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
