import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useCompanies } from "@/store/companies";
import { ArrowLeft, Save, Landmark } from "lucide-react";

export const Route = createFileRoute("/company/$companyId/edit")({
  head: () => ({
    meta: [{ title: "Edit Company — Airbox" }],
  }),
  component: EditCompanyPage,
});

function EditCompanyPage() {
  const { companyId } = useParams({ from: "/company/$companyId/edit" });
  const company = useCompanies((s) => s.items.find((x) => x.id === companyId));
  const update = useCompanies((s) => s.update);
  const navigate = useNavigate();

  const [form, setForm] = useState(company);

  useEffect(() => {
    if (company) setForm(company);
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

  const save = () => {
    update(company.id, form);
    toast.success(`Saved changes to ${form.name}`);
    navigate({ to: "/company/$companyId", params: { companyId: company.id } });
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
        description="Update company profile, contact, subscription and status."
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
