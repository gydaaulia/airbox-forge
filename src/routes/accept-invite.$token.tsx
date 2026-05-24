import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useAirbox } from "@/store/airbox";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/accept-invite/$token")({
  head: () => ({
    meta: [
      { title: "Accept invitation — Airbox" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();
  const { invitations, companies, roles, bundles, acceptInvitation } = useAirbox();

  const invitation = useMemo(
    () => invitations.find((i) => i.token === token),
    [invitations, token],
  );

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [done, setDone] = useState(false);

  const company = invitation
    ? companies.find((c) => c.id === invitation.company_id)
    : undefined;
  const role = invitation ? roles.find((r) => r.id === invitation.role_id) : undefined;
  const bundle = role ? bundles.find((b) => b.id === role.bundle_id) : undefined;

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-background via-background to-primary/5 p-6">
      <Card className="w-full max-w-md p-6">
        <div className="flex items-center gap-2 mb-5">
          <div className="size-9 rounded-xl bg-gradient-to-br from-primary to-primary-glow grid place-items-center">
            <Sparkles className="size-5 text-white" />
          </div>
          <div>
            <div className="text-base font-semibold tracking-tight">Airbox</div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
              Activate your account
            </div>
          </div>
        </div>

        {!invitation && (
          <div className="text-sm">
            <p className="mb-2 font-medium">Invitation not found</p>
            <p className="text-muted-foreground">
              This invite link is invalid. Please ask your administrator to resend.
            </p>
          </div>
        )}

        {invitation && invitation.status === "revoked" && (
          <p className="text-sm text-destructive">
            This invitation was revoked by the administrator.
          </p>
        )}

        {invitation &&
          invitation.status === "pending" &&
          new Date(invitation.expires_at).getTime() < Date.now() && (
            <p className="text-sm text-destructive">This invitation has expired.</p>
          )}

        {invitation &&
          (invitation.status === "accepted" || done) && (
            <div className="text-sm text-center py-4">
              <CheckCircle2 className="size-10 mx-auto text-primary mb-3" />
              <p className="font-medium mb-1">Account ready</p>
              <p className="text-muted-foreground mb-4">
                You can now sign in to {company?.name ?? "your workspace"}.
              </p>
              <Button asChild className="w-full">
                <Link to="/">Go to dashboard</Link>
              </Button>
            </div>
          )}

        {invitation &&
          invitation.status === "pending" &&
          !done &&
          new Date(invitation.expires_at).getTime() > Date.now() && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (password !== confirm) {
                  toast.error("Passwords do not match");
                  return;
                }
                const res = acceptInvitation(token, password);
                if (!res.ok) {
                  toast.error(res.error);
                  return;
                }
                setDone(true);
                toast.success("Welcome to Airbox!");
                setTimeout(() => navigate({ to: "/" }), 1500);
              }}
              className="grid gap-3"
            >
              <div className="text-sm">
                <p className="font-medium">Hi {invitation.name},</p>
                <p className="text-muted-foreground mt-1">
                  You've been invited to{" "}
                  <span className="text-foreground font-medium">
                    {company?.name}
                  </span>{" "}
                  as{" "}
                  <span className="text-foreground font-medium">{role?.name}</span>
                  {bundle ? ` on the ${bundle.name} bundle.` : "."}
                </p>
              </div>
              <div>
                <Label>Email</Label>
                <Input value={invitation.email} disabled />
              </div>
              <div>
                <Label>Create password</Label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={8}
                  required
                  placeholder="At least 8 characters"
                />
              </div>
              <div>
                <Label>Confirm password</Label>
                <Input
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  minLength={8}
                  required
                />
              </div>
              <Button type="submit" className="mt-1">
                Activate account
              </Button>
            </form>
          )}
      </Card>
    </div>
  );
}
