import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Users, Briefcase, AlertTriangle, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ users: 0, pendingKyc: 0, openGigs: 0, disputes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).eq("kyc_status", "pending"),
      supabase.from("gigs").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabase.from("disputes").select("id", { count: "exact", head: true }).eq("status", "open"),
    ]).then(([u, k, g, d]) => {
      setStats({ users: u.count || 0, pendingKyc: k.count || 0, openGigs: g.count || 0, disputes: d.count || 0 });
      setLoading(false);
    });
  }, []);

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  const cards = [
    { label: "Total Users", value: stats.users, icon: Users, route: "/admin/users" },
    { label: "Pending KYC", value: stats.pendingKyc, icon: Shield, route: "/admin/kyc" },
    { label: "Open Gigs", value: stats.openGigs, icon: Briefcase, route: "/admin/gigs" },
    { label: "Open Disputes", value: stats.disputes, icon: AlertTriangle, route: "/admin/disputes" },
  ];


  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold">Admin Dashboard</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => (
            <Card key={c.label} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(c.route)}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="rounded-full bg-primary/10 p-3"><c.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <p className="text-2xl font-bold">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
