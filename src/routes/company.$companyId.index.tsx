import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCompanies, TONE_MAP, formatRegDate } from "@/store/companies";
import {
  ArrowLeft,
  Pencil,
  CheckCircle2,
  MinusCircle,
  Building2,
  Network,
  UserRound,
  FolderKanban,
  CreditCard,
  Landmark,
  Mail,
  Phone,
  Globe,
  MapPin,
  Users,
  Power,
} from "lucide-react";

export const Route = createFileRoute("/company/$companyId/")({
  head: () => ({
    meta: [{ title: "Company Detail — Airbox" }],
  }),
  component: CompanyDetailPage,
});

function CompanyDetailPage() {
  const { companyId } = useParams({ from: "/company/$companyId/" });
  const company = useCompanies((s) => s.items.find((x) => x.id === companyId));
  const toggleSubscriptionStatus = useCompanies((s) => s.toggleSubscriptionStatus);
  const toggleStatus = useCompanies((s) => s.toggleStatus);
  const navigate = useNavigate();

  const totals = useMemo(() => {
    if (!company) return { departments: 0, divisions: 0, users: 0, projects: 0, groups: 0 };
    const divisions = company.structure.departments.reduce((s, d) => s + d.divisions.length, 0);
    const users = company.structure.departments.reduce(
      (s, d) => s + d.divisions.reduce((u, v) => u + (v.users ?? 0), 0),
      0,
    );
    const groups = company.structure.projects.reduce((s, p) => s + p.groups, 0);
    return {
      departments: company.structure.departments.length,
      divisions,
      users,
      projects: company.structure.projects.length,
      groups,
    };
  }, [company]);

  if (!company) {
    return (
      <div className="max-w-lg mx-auto text-center py-24">
        <div className="text-lg font-semibold">Company not found</div>
        <p className="text-sm text-muted-foreground mt-1">
          It may have been deleted or the link is incorrect.
        </p>
        <Button asChild variant="outline" className="mt-6 gap-1.5">
          <Link to="/company/list">
            <ArrowLeft className="size-4" /> Back to Company List
          </Link>
        </Button>
      </div>
    );
  }

  const initials = company.name.replace(/^PT\s+/, "").charAt(0);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button asChild variant="ghost" size="sm" className="gap-1.5">
          <Link to="/company/list">
            <ArrowLeft className="size-4" /> Back to Company List
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              toggleStatus(company.id);
              toast.success(
                `Company is now ${company.status === "active" ? "inactive" : "active"}`,
              );
            }}
          >
            <Power className="size-3.5" /> Toggle Status
          </Button>
          <Button
            size="sm"
            className="gap-1.5"
            onClick={() =>
              navigate({ to: "/company/$companyId/edit", params: { companyId: company.id } })
            }
          >
            <Pencil className="size-3.5" /> Edit
          </Button>
        </div>
      </div>

      <Card className="p-6 mb-4">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "size-16 rounded-2xl bg-gradient-to-br grid place-items-center text-white text-2xl font-bold shrink-0",
              TONE_MAP[company.tone] ?? TONE_MAP.sky,
            )}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-semibold tracking-tight">{company.name}</h1>
              {company.status === "active" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[11px] font-medium">
                  <CheckCircle2 className="size-3.5" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium">
                  <MinusCircle className="size-3.5" /> Inactive
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="font-mono">{company.code}</span> · {company.industry} ·{" "}
              {company.employees} employees
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Registered {formatRegDate(company.regDate)}
            </div>
          </div>
        </div>
      </Card>

      <PageHeader title="Overview" className="mb-4" />

      <PageHeader title="" className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* LEFT — Structure Visualization */}
        <Card className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <Network className="size-4 text-primary" /> Organization Structure
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {totals.departments} departments · {totals.divisions} divisions · {totals.users} users
              </p>
            </div>
          </div>

          {/* Root */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                "px-4 py-2.5 rounded-xl text-white text-sm font-semibold bg-gradient-to-br shadow-[var(--shadow-elegant)]",
                TONE_MAP[company.tone] ?? TONE_MAP.sky,
              )}
            >
              <div className="flex items-center gap-2">
                <Building2 className="size-4" />
                {company.name}
              </div>
            </div>
            <div className="w-px h-6 bg-border" />
            <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {company.structure.departments.map((d) => (
                <div
                  key={d.id}
                  className="rounded-xl border border-border bg-muted/20 overflow-hidden"
                >
                  <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border bg-card">
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
                        className="flex items-center gap-2 rounded-md bg-card border border-border px-2 py-1.5"
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
              {company.structure.departments.length === 0 && (
                <div className="col-span-full text-center text-sm text-muted-foreground py-8">
                  No departments defined yet.
                </div>
              )}
            </div>
          </div>

          {company.structure.projects.length > 0 && (
            <div className="mt-6 pt-5 border-t border-border">
              <h4 className="font-semibold flex items-center gap-2 mb-3">
                <FolderKanban className="size-4 text-primary" /> Projects
                <span className="text-[11px] text-muted-foreground font-normal">
                  {totals.projects} projects · {totals.groups} groups
                </span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2">
                {company.structure.projects.map((p) => (
                  <div
                    key={p.id}
                    className="rounded-lg border border-border p-3 flex items-center gap-3"
                  >
                    <div className="size-8 rounded-md bg-primary/10 grid place-items-center">
                      <FolderKanban className="size-4 text-primary" />
                    </div>
                    <div className="text-sm font-semibold flex-1 truncate">{p.name}</div>
                    <Badge variant="outline" className="text-[10px]">
                      {p.groups} groups
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* RIGHT — sidebar */}
        <div className="space-y-4">
          {/* Subscription */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <CreditCard className="size-4 text-primary" /> Subscription
            </h3>
            <div className="mt-4 rounded-xl border border-border p-4 bg-muted/20">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold">{company.subscription.planName}</div>
                  <div className="text-[11px] text-muted-foreground capitalize mt-0.5">
                    {company.subscription.billingCycle} billing
                  </div>
                </div>
                {company.subscription.status === "active" ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 px-2 py-0.5 text-[11px] font-medium">
                    <CheckCircle2 className="size-3.5" /> Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[11px] font-medium">
                    <MinusCircle className="size-3.5" /> Inactive
                  </span>
                )}
              </div>
              <div className="mt-3 flex items-end gap-1">
                <div className="text-2xl font-bold text-primary">
                  ${company.subscription.price}
                </div>
                <div className="text-xs text-muted-foreground pb-1">
                  /{company.subscription.billingCycle === "monthly" ? "mo" : "yr"}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full gap-1.5"
              onClick={() => {
                toggleSubscriptionStatus(company.id);
                toast.success(
                  `Subscription ${
                    company.subscription.status === "active" ? "deactivated" : "activated"
                  }`,
                );
              }}
            >
              <Power className="size-3.5" />
              {company.subscription.status === "active"
                ? "Deactivate Subscription"
                : "Activate Subscription"}
            </Button>
          </Card>

          {/* Contact */}
          <Card className="p-5">
            <h3 className="font-semibold">Contact</h3>
            <div className="mt-3 space-y-2 text-sm">
              <InfoRow icon={Mail} label="Email" value={company.email} />
              {company.phone && <InfoRow icon={Phone} label="Phone" value={company.phone} />}
              {company.website && (
                <InfoRow icon={Globe} label="Website" value={company.website} />
              )}
              {company.address && (
                <InfoRow icon={MapPin} label="Address" value={company.address} />
              )}
            </div>
          </Card>

          {/* Bank */}
          <Card className="p-5">
            <h3 className="font-semibold flex items-center gap-2">
              <Landmark className="size-4 text-primary" /> Bank Account
            </h3>
            <div className="mt-3 space-y-1 text-sm">
              <div className="text-muted-foreground text-xs">Bank</div>
              <div className="font-medium">{company.bank.name}</div>
              <div className="text-muted-foreground text-xs mt-2">Account Number</div>
              <div className="font-mono">{company.bank.number}</div>
              <div className="text-muted-foreground text-xs mt-2">Holder</div>
              <div className="font-medium">{company.bank.holder}</div>
            </div>
          </Card>

          {/* Registrations */}
          {(company.npwp || company.nib) && (
            <Card className="p-5">
              <h3 className="font-semibold">Registrations</h3>
              <div className="mt-3 space-y-2 text-sm">
                {company.npwp && (
                  <div>
                    <div className="text-muted-foreground text-xs">NPWP</div>
                    <div className="font-mono">{company.npwp}</div>
                  </div>
                )}
                {company.nib && (
                  <div>
                    <div className="text-muted-foreground text-xs">NIB</div>
                    <div className="font-mono">{company.nib}</div>
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="size-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <div className="min-w-0">
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{value}</div>
      </div>
    </div>
  );
}
