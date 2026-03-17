import { useState, useEffect } from "react";
import { supabase } from "../../integrations/supabase/client";
import { AppLayout } from "../../components/AppLayout";
import { Button } from "../../components/ui/button";
import { toast } from "sonner";
import { Loader2, Shield, CheckCircle2, XCircle, User, Phone, CreditCard, BadgeCheck } from "lucide-react";
import type { Tables } from "../../integrations/supabase/types";
import { formatDistanceToNow } from "date-fns";

type Profile = Tables<"profiles">;

const ROLE_STYLE: Record<string, string> = {
  client:  "bg-sky-500/10    text-sky-500    border border-sky-500/20",
  hustler: "bg-violet-500/10 text-violet-500 border border-violet-500/20",
  admin:   "bg-primary/10    text-primary    border border-primary/20",
};

export default function AdminKYCPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading]   = useState(true);
  const [actioning, setActioning] = useState<string | null>(null);

  const fetchPending = async () => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("kyc_status", "pending")
      .order("created_at", { ascending: true });
    setProfiles(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchPending(); }, []);

  const handleAction = async (profileId: string, action: "approved" | "rejected") => {
    setActioning(profileId + action);
    await supabase.from("profiles").update({ kyc_status: action }).eq("id", profileId);
    await supabase.from("notifications").insert({
      user_id: profileId,
      message: `Your KYC verification was ${action}. ${action === "approved" ? "You can now access all features." : "Please contact support if you believe this is an error."}`,
    });
    toast.success(`User ${action}`);
    setActioning(null);
    fetchPending();
  };

  if (loading) return (
    <AppLayout>
      <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </AppLayout>
  );

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto pb-10 animate-fade-in">

        {/* Header */}
        <div className="pt-2 mb-6">
          <h1 className="text-3xl font-extrabold text-foreground">KYC Queue</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {profiles.length} pending submission{profiles.length !== 1 ? "s" : ""} awaiting review
          </p>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-24">
            <div className="bg-muted w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <BadgeCheck className="h-9 w-9 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">All clear!</h3>
            <p className="text-sm text-muted-foreground">No pending KYC submissions.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {profiles.map(p => (
              <div
                key={p.id}
                className="bg-card border border-border rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5"
              >
                {/* Identity info */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-bold text-foreground">{p.full_name ?? "Unnamed"}</h3>
                    {p.role && (
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold border capitalize ${ROLE_STYLE[p.role] ?? ""}`}>
                        {p.role}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.phone ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <CreditCard className="h-3.5 w-3.5 shrink-0" />
                      <span className="font-mono">{p.id_number ?? "—"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {p.created_at
                          ? `Submitted ${formatDistanceToNow(new Date(p.created_at), { addSuffix: true })}`
                          : "—"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2 shrink-0">
                  <Button
                    size="sm"
                    onClick={() => handleAction(p.id, "approved")}
                    disabled={!!actioning}
                    className="bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl px-4"
                  >
                    {actioning === p.id + "approved"
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleAction(p.id, "rejected")}
                    disabled={!!actioning}
                    className="font-semibold rounded-xl px-4"
                  >
                    {actioning === p.id + "rejected"
                      ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      : <XCircle className="h-3.5 w-3.5 mr-1.5" />}
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}