import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { backendRequest } from "@/lib/backend";

const categories = ["errand", "pickup", "delivery", "shopping", "other"] as const;

type PricingConfig = {
  id: string;
  category: string;
  base_hourly_rate: string;
  per_km_rate: string;
  platform_fee_percentage: string;
  min_budget: string;
  max_budget: string;
  suggested_band_pct: string;
  complexity_multipliers: Record<string, number>;
};

type PricingHistory = {
  id: string;
  category: string;
  change_type: string;
  changed_by: string | null;
  change_reason: string;
  created_at: string;
};

export default function AdminPricingPage() {
  const [configs, setConfigs] = useState<PricingConfig[]>([]);
  const [history, setHistory] = useState<PricingHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const [formState, setFormState] = useState<Record<string, any>>({});

  const seedDefaults = async (missing: string[]) => {
    if (missing.length === 0) return;
    setSeeding(true);
    try {
      const defaults = {
        base_hourly_rate: "80",
        per_km_rate: "5",
        platform_fee_percentage: "10",
        min_budget: "50",
        max_budget: "500",
        suggested_band_pct: "20",
        complexity_multipliers: { weekend: 1.5, urgent: 1.2 },
      };

      await Promise.all(
        missing.map((category) =>
          backendRequest("/api/pricing/config/", {
            body: {
              change_reason: "Initial seed",
              config: { category, ...defaults },
            },
          }),
        ),
      );
      toast.success("Default pricing configs created.");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to seed default pricing configs");
    } finally {
      setSeeding(false);
      setSeeded(true);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const configRes = await backendRequest<{ data: PricingConfig[] }>("/api/pricing/config/", { method: "GET" });
      const historyRes = await backendRequest<{ data: PricingHistory[] }>("/api/pricing/history/", { method: "GET" });
      setConfigs(configRes.data ?? []);
      setHistory(historyRes.data ?? []);

      const initial: Record<string, any> = {};
      (configRes.data ?? []).forEach((cfg) => {
        initial[cfg.category] = {
          ...cfg,
          change_reason: "",
          complexity_json: JSON.stringify(cfg.complexity_multipliers ?? {}, null, 2),
        };
      });
      categories.forEach((cat) => {
        if (!initial[cat]) {
          initial[cat] = {
            category: cat,
            base_hourly_rate: "0",
            per_km_rate: "0",
            platform_fee_percentage: "10",
            min_budget: "0",
            max_budget: "0",
            suggested_band_pct: "20",
            complexity_json: "{}",
            change_reason: "",
          };
        }
      });
      setFormState(initial);

      if (!seeded) {
        const missing = categories.filter((cat) => !(configRes.data ?? []).some((cfg) => cfg.category === cat));
        if (missing.length > 0) {
          await seedDefaults(missing);
          await fetchData();
          return;
        }
      }
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to load pricing config");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async (category: string) => {
    const current = formState[category];
    if (!current?.change_reason?.trim()) {
      toast.error("Change reason required");
      return;
    }

    let complexity: Record<string, number>;
    try {
      complexity = JSON.parse(current.complexity_json || "{}");
    } catch {
      toast.error("Complexity multipliers must be valid JSON");
      return;
    }

    setSaving(category);
    try {
      await backendRequest("/api/pricing/config/", {
        body: {
          change_reason: current.change_reason,
          config: {
            category,
            base_hourly_rate: current.base_hourly_rate,
            per_km_rate: current.per_km_rate,
            platform_fee_percentage: current.platform_fee_percentage,
            min_budget: current.min_budget,
            max_budget: current.max_budget,
            suggested_band_pct: current.suggested_band_pct,
            complexity_multipliers: complexity,
          },
        },
      });
      toast.success("Pricing updated");
      await fetchData();
    } catch (error: any) {
      toast.error(error?.message ?? "Update failed");
    } finally {
      setSaving(null);
    }
  };

  const rows = useMemo(() => categories.map((cat) => formState[cat]).filter(Boolean), [formState]);

  if (loading) return <AppLayout><div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AppLayout>;

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto space-y-6 animate-fade-in">
        <h2 className="text-2xl font-bold">Pricing Configuration</h2>
        <Card>
          <CardHeader>
            <CardTitle>Per-Category Pricing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {rows.map((row: any) => (
              <div key={row.category} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold capitalize">{row.category}</h3>
                  <Button onClick={() => handleSave(row.category)} disabled={saving === row.category}>
                    {saving === row.category && <Loader2 className="h-4 w-4 animate-spin" />}
                    Save
                  </Button>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Base Hourly Rate (R)</Label>
                    <Input value={row.base_hourly_rate} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, base_hourly_rate: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Per KM Rate (R)</Label>
                    <Input value={row.per_km_rate} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, per_km_rate: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Platform Fee (%)</Label>
                    <Input value={row.platform_fee_percentage} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, platform_fee_percentage: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Suggested Band (%)</Label>
                    <Input value={row.suggested_band_pct} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, suggested_band_pct: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Budget (R)</Label>
                    <Input value={row.min_budget} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, min_budget: e.target.value } }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Budget (R)</Label>
                    <Input value={row.max_budget} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, max_budget: e.target.value } }))} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Complexity Multipliers (JSON)</Label>
                  <Textarea value={row.complexity_json} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, complexity_json: e.target.value } }))} rows={4} />
                </div>
                <div className="space-y-2">
                  <Label>Change Reason</Label>
                  <Input value={row.change_reason} onChange={(e) => setFormState((prev: any) => ({ ...prev, [row.category]: { ...row, change_reason: e.target.value } }))} />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing History</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, 20).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="capitalize">{item.category}</TableCell>
                    <TableCell>{item.change_type}</TableCell>
                    <TableCell>{item.change_reason}</TableCell>
                    <TableCell>{item.created_at ? new Date(item.created_at).toLocaleString() : ""}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
