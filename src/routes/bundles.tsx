import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAirbox, type Bundle, type PricingType } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Copy, Archive, Package, Pencil, ArrowRight, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bundles")({
  head: () => ({
    meta: [
      { title: "Product Bundles — Airbox" },
      { name: "description", content: "Manage product bundles and packages." },
    ],
  }),
  component: BundlesPage,
});

function BundlesPage() {
  const { bundles, createBundle, duplicateBundle, archiveBundle, toggleBundleStatus } = useAirbox();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  const visible = useMemo(
    () =>
      bundles
        .filter((b) => !b.is_template)
        .filter((b) =>
          q
            ? b.name.toLowerCase().includes(q.toLowerCase()) ||
              b.code.toLowerCase().includes(q.toLowerCase())
            : true,
        )
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [bundles, q],
  );

  return (
    <div>
      <PageHeader
        title="Product Bundles"
        description="Create, edit and assign product bundles. Use templates for one-click starters."
        actions={
          <>
            <Link
              to="/templates"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted"
            >
              From template
            </Link>
            <NewBundleDialog
              open={open}
              setOpen={setOpen}
              onCreate={(b) => {
                const id = createBundle(b);
                toast.success("Bundle created");
                navigate({ to: "/bundles/$bundleId", params: { bundleId: id } });
              }}
            />
          </>
        }
      />

      <Card className="p-4 mb-5">
        <div className="relative max-w-md">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search bundles…" className="pl-9" />
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card className="p-16 text-center">
          <Package className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-medium">No bundles yet</h3>
          <p className="text-xs text-muted-foreground mt-1">Create a new bundle or apply a template to get started.</p>
          <div className="mt-5 flex justify-center gap-2">
            <Button onClick={() => setOpen(true)}><Plus className="size-4" /> New bundle</Button>
            <Link to="/templates" className="inline-flex h-9 items-center px-3.5 rounded-lg border border-input bg-card text-sm font-medium hover:bg-muted">
              Browse templates
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((b) => (
            <BundleCard
              key={b.id}
              bundle={b}
              onDuplicate={() => {
                duplicateBundle(b.id);
                toast.success("Bundle duplicated");
              }}
              onArchive={() => {
                archiveBundle(b.id);
                toast("Bundle archived");
              }}
              onToggle={() => toggleBundleStatus(b.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BundleCard({
  bundle,
  onDuplicate,
  onArchive,
  onToggle,
}: {
  bundle: Bundle;
  onDuplicate: () => void;
  onArchive: () => void;
  onToggle: () => void;
}) {
  return (
    <Card className="p-5 hover:shadow-[var(--shadow-elegant)] transition-shadow group">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight">{bundle.name}</h3>
            <Badge variant={bundle.status === "active" ? "default" : "secondary"} className="capitalize text-[10px]">
              {bundle.status}
            </Badge>
          </div>
          <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{bundle.code}</div>
        </div>
        <div className="size-9 rounded-lg bg-gradient-to-br from-primary/15 to-primary-glow/10 grid place-items-center">
          <Package className="size-4 text-primary" />
        </div>
      </div>
      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 min-h-[2rem]">{bundle.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
        <div className="p-2 rounded-md bg-muted/60">
          <div className="text-xs font-semibold">{bundle.module_ids.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Modules</div>
        </div>
        <div className="p-2 rounded-md bg-muted/60">
          <div className="text-xs font-semibold">${bundle.monthly_price}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">/mo</div>
        </div>
        <div className="p-2 rounded-md bg-muted/60">
          <div className="text-xs font-semibold">${bundle.yearly_price}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wide">/yr</div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={onDuplicate} className="h-8 px-2">
            <Copy className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onArchive} className="h-8 px-2">
            <Archive className="size-3.5" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onToggle} className="h-8 px-2 text-xs">
            {bundle.status === "active" ? "Deactivate" : "Activate"}
          </Button>
        </div>
        <Link
          to="/bundles/$bundleId"
          params={{ bundleId: bundle.id }}
          className="text-xs font-medium text-primary flex items-center gap-1 hover:gap-1.5 transition-all"
        >
          <Pencil className="size-3.5" /> Edit <ArrowRight className="size-3.5" />
        </Link>
      </div>
    </Card>
  );
}

export function NewBundleDialog({
  open,
  setOpen,
  onCreate,
}: {
  open: boolean;
  setOpen: (b: boolean) => void;
  onCreate: (b: Omit<Bundle, "id" | "created_at">) => void;
}) {
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    category: "Custom",
    pricing_type: "monthly" as PricingType,
    monthly_price: 0,
    yearly_price: 0,
  });

  const submit = () => {
    if (!form.name.trim()) return toast.error("Bundle name is required");
    onCreate({
      ...form,
      code: form.code || form.name.toUpperCase().replace(/[^A-Z0-9]+/g, "_"),
      module_ids: [],
      status: "active",
      is_template: false,
    });
    setOpen(false);
    setForm({ ...form, name: "", code: "", description: "" });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-1.5"><Plus className="size-4" /> New bundle</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new bundle</DialogTitle>
          <DialogDescription>You'll be taken to the bundle builder next.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Logistics Starter" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="AUTO" />
            </div>
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Pricing</Label>
              <select
                value={form.pricing_type}
                onChange={(e) => setForm({ ...form, pricing_type: e.target.value as PricingType })}
                className="w-full h-9 rounded-lg border border-input bg-card text-sm px-2.5"
              >
                <option value="free">Free</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <Label>Monthly $</Label>
              <Input type="number" value={form.monthly_price} onChange={(e) => setForm({ ...form, monthly_price: +e.target.value })} />
            </div>
            <div>
              <Label>Yearly $</Label>
              <Input type="number" value={form.yearly_price} onChange={(e) => setForm({ ...form, yearly_price: +e.target.value })} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Create & open builder</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
