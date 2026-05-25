import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAirbox } from "@/store/airbox";
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
import { Building2, Plus, X, RotateCcw, Users } from "lucide-react";
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
import { toast } from "sonner";


export const Route = createFileRoute("/companies")({
  head: () => ({
    meta: [
      { title: "Companies & Subscriptions — Airbox" },
      { name: "description", content: "Assign bundles to companies and manage subscriptions." },
    ],
  }),
  component: CompaniesPage,
});

function CompaniesPage() {
  const { companies, subscriptions, bundles, assignments, invitations, bulkAssign, cancelSubscription, reactivateSubscription } = useAirbox();
  const [cancelId, setCancelId] = useState<string | null>(null);

  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulkBundle, setBulkBundle] = useState("");
  const [bulkDays, setBulkDays] = useState(365);
  const [bulkSel, setBulkSel] = useState<Set<string>>(new Set());

  const subsByCompany = useMemo(() => {
    const m = new Map<string, typeof subscriptions>();
    for (const s of subscriptions) {
      if (!m.has(s.company_id)) m.set(s.company_id, []);
      m.get(s.company_id)!.push(s);
    }
    return m;
  }, [subscriptions]);

  const bundleOptions = bundles.filter((b) => !b.is_template && b.status === "active");

  return (
    <div>
      <PageHeader
        title="Companies & Subscriptions"
        description="Activate bundles per company. Bulk assign to roll out new packages instantly."
        actions={
          <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
            <DialogTrigger asChild>
              <Button className="gap-1.5"><Plus className="size-4" /> Bulk assign</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Bulk assign bundle to companies</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3">
                <div>
                  <Label>Bundle</Label>
                  <select
                    value={bulkBundle}
                    onChange={(e) => setBulkBundle(e.target.value)}
                    className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
                  >
                    <option value="">Choose a bundle…</option>
                    {bundleOptions.map((b) => (
                      <option key={b.id} value={b.id}>{b.name} · {b.module_ids.length} modules</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Active for (days)</Label>
                  <Input type="number" value={bulkDays} onChange={(e) => setBulkDays(+e.target.value)} />
                </div>
                <div className="border border-border rounded-lg max-h-72 overflow-y-auto">
                  {companies.map((c) => (
                    <label key={c.id} className="flex items-center gap-3 p-3 border-b last:border-b-0 border-border hover:bg-muted/40 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={bulkSel.has(c.id)}
                        onChange={() =>
                          setBulkSel((s) => {
                            const n = new Set(s);
                            n.has(c.id) ? n.delete(c.id) : n.add(c.id);
                            return n;
                          })
                        }
                        className="size-4 accent-[color:var(--color-primary)]"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">{c.name}</div>
                        <div className="text-[11px] text-muted-foreground">{c.industry} · {c.employees} employees</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
                <Button
                  disabled={!bulkBundle || bulkSel.size === 0}
                  onClick={() => {
                    const until = new Date(Date.now() + bulkDays * 86400000).toISOString();
                    bulkAssign(Array.from(bulkSel), bulkBundle, until);
                    toast.success(`Assigned bundle to ${bulkSel.size} companies`);
                    setBulkOpen(false);
                    setBulkSel(new Set());
                    setBulkBundle("");
                  }}
                >
                  Assign
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {companies.map((c) => {
          const subs = subsByCompany.get(c.id) ?? [];
          const activeSubs = subs.filter((s) => s.status === "active");
          const memberCount = assignments.filter((a) => a.company_id === c.id).length;
          const pendingCount = invitations.filter(
            (i) => i.company_id === c.id && i.status === "pending",
          ).length;
          return (
            <Card key={c.id} className="p-5">
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="size-11 rounded-lg bg-gradient-to-br from-primary/15 to-primary-glow/10 grid place-items-center">
                    <Building2 className="size-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold tracking-tight">{c.name}</h3>
                    <div className="text-xs text-muted-foreground">{c.industry} · {c.employees} employees</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <Badge variant="secondary">{activeSubs.length} active</Badge>
                  <Button asChild size="sm" variant="outline" className="h-7 gap-1.5 text-xs">
                    <Link to="/companies/$companyId" params={{ companyId: c.id }}>
                      <Users className="size-3.5" />
                      {memberCount} member{memberCount === 1 ? "" : "s"}
                      {pendingCount > 0 && (
                        <span className="text-primary">· {pendingCount} pending</span>
                      )}
                    </Link>
                  </Button>
                </div>
              </div>


              <div className="mt-4 flex flex-col gap-2">
                {subs.length === 0 && (
                  <div className="text-xs text-muted-foreground py-3 border border-dashed border-border rounded-lg text-center">
                    No subscriptions yet.
                  </div>
                )}
                {subs.map((s) => {
                  const b = bundles.find((bb) => bb.id === s.bundle_id);
                  return (
                    <div
                      key={s.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-card"
                    >
                      <div className="min-w-0">
                        <div className="text-sm font-medium truncate">{b?.name ?? "—"}</div>
                        <div className="text-[11px] text-muted-foreground">
                          {b?.module_ids.length} modules · expires {new Date(s.active_until).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={s.status === "active" ? "default" : "secondary"}
                          className="capitalize text-[10px]"
                        >
                          {s.status}
                        </Badge>
                        {s.status === "active" ? (
                          <button
                            onClick={() => setCancelId(s.id)}
                            title="Deactivate subscription"
                            className="size-6 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive grid place-items-center"
                          >
                            <X className="size-3.5" />
                          </button>

                        ) : (
                          <button
                            onClick={() => {
                              const until = new Date(Date.now() + 365 * 86400000).toISOString();
                              reactivateSubscription(s.id, until);
                              toast.success("Subscription reactivated");
                            }}
                            title="Reactivate subscription"
                            className="size-6 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary grid place-items-center"
                          >
                            <RotateCcw className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>

      <AlertDialog open={cancelId !== null} onOpenChange={(o) => !o && setCancelId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this subscription?</AlertDialogTitle>
            <AlertDialogDescription>
              The company will immediately lose access to all modules in this bundle. You can reactivate it later.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (cancelId) {
                  cancelSubscription(cancelId);
                  toast("Subscription deactivated");
                }
                setCancelId(null);
              }}
            >
              Deactivate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
