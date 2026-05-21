import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useAirbox } from "@/store/airbox";
import { PageHeader } from "@/components/airbox/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Layers, Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Bundle Templates — Airbox" },
      { name: "description", content: "Reusable bundle templates for fast setup." },
    ],
  }),
  component: TemplatesPage,
});

function TemplatesPage() {
  const { bundles, applyTemplate, duplicateBundle } = useAirbox();
  const navigate = useNavigate();
  const templates = bundles.filter((b) => b.is_template);
  const [applyOn, setApplyOn] = useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = useState("");

  return (
    <div>
      <PageHeader
        title="Bundle Templates"
        description="Pre-built bundle blueprints. Apply a template to spin up a new bundle in one click."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templates.map((t) => (
          <Card key={t.id} className="p-5 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 size-32 rounded-full bg-gradient-to-br from-primary/15 to-primary-glow/10 blur-2xl" />
            <div className="relative">
              <div className="flex items-center gap-2 mb-1">
                <Layers className="size-4 text-primary" />
                <Badge variant="secondary" className="text-[10px]">Template</Badge>
              </div>
              <h3 className="font-semibold tracking-tight text-lg">{t.name}</h3>
              <p className="text-xs text-muted-foreground mt-1 min-h-[2rem]">{t.description}</p>

              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{t.module_ids.length} modules</span>
                <span className="font-semibold">
                  ${t.monthly_price}/mo · ${t.yearly_price}/yr
                </span>
              </div>

              <div className="mt-4 flex gap-2">
                <Button
                  className="flex-1 gap-1.5"
                  onClick={() => {
                    setApplyOn({ id: t.id, name: t.name });
                    setNewName(`${t.name} — New`);
                  }}
                >
                  <Sparkles className="size-4" /> Apply template
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    duplicateBundle(t.id);
                    toast.success("Template duplicated");
                  }}
                  className="gap-1.5"
                >
                  <Copy className="size-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={!!applyOn} onOpenChange={(o) => !o && setApplyOn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Apply "{applyOn?.name}"</DialogTitle>
          </DialogHeader>
          <div>
            <Label>New bundle name</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApplyOn(null)}>Cancel</Button>
            <Button
              onClick={() => {
                if (!applyOn) return;
                const id = applyTemplate(applyOn.id, newName.trim() || applyOn.name);
                setApplyOn(null);
                if (id) {
                  toast.success("Bundle created from template");
                  navigate({ to: "/bundles/$bundleId", params: { bundleId: id } });
                }
              }}
            >
              Create & open
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
