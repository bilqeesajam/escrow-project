import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { backendRequest } from "@/lib/backend";

const categories = ["errand", "pickup", "delivery", "shopping", "other"] as const;

export default function PostGigPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("other");
  const [hours, setHours] = useState("1");
  const [distanceKm, setDistanceKm] = useState("0");
  const [cartValue, setCartValue] = useState("");
  const [complexityOptions, setComplexityOptions] = useState<{ key: string; multiplier: number }[]>([]);
  const [complexityKeys, setComplexityKeys] = useState<string[]>([]);
  const [quote, setQuote] = useState<{ subtotal: number; fee: number; total: number; bandMin: number; bandMax: number } | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchQuote = async () => {
    const hoursNum = parseFloat(hours);
    const distanceNum = parseFloat(distanceKm);
    if (!hoursNum || hoursNum <= 0 || distanceNum < 0) return;

    setQuoteLoading(true);
    try {
      const data = await backendRequest<{
        subtotal: string;
        fee: string;
        total: string;
        band_min: string;
        band_max: string;
        complexity_options: { key: string; multiplier: number }[];
      }>(
        "/api/pricing/quote/",
        {
          body: {
            category,
            hours: hoursNum,
            distance_km: distanceNum,
            complexity_keys: complexityKeys,
          },
        },
      );
      setComplexityOptions(data.complexity_options || []);
      setQuote({
        subtotal: parseFloat(data.subtotal),
        fee: parseFloat(data.fee),
        total: parseFloat(data.total),
        bandMin: parseFloat(data.band_min),
        bandMax: parseFloat(data.band_max),
      });
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to fetch quote");
    } finally {
      setQuoteLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchQuote();
  }, [category, hours, distanceKm, complexityKeys.join("|")]);

  useEffect(() => {
    setComplexityKeys([]);
    setOverrideReason("");
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const budgetNum = parseFloat(budget);
    const hoursNum = parseFloat(hours);
    const distanceNum = parseFloat(distanceKm);
    const cartNum = cartValue ? parseFloat(cartValue) : null;
    if (!budgetNum || budgetNum <= 0) { toast.error("Enter a valid budget"); return; }
    if (!hoursNum || hoursNum <= 0) { toast.error("Enter valid hours"); return; }
    if (distanceNum < 0) { toast.error("Enter valid distance"); return; }
    if (!title.trim() || !description.trim() || !location.trim()) { toast.error("Fill all fields"); return; }
    if ((profile.balance || 0) < budgetNum) { toast.error("Insufficient balance. Top up your wallet first."); return; }

    setLoading(true);

    const needsOverride = quote && (budgetNum < quote.bandMin || budgetNum > quote.bandMax);
    if (needsOverride && !overrideReason.trim()) {
      toast.error("Override reason required for out-of-band pricing");
      return;
    }

    try {
      await backendRequest("/api/gigs/create/", {
        body: {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          category,
          hours: hoursNum,
          distance_km: distanceNum,
          requested_total: budgetNum,
          cart_value: cartNum,
          complexity_keys: complexityKeys,
          override_reason: needsOverride ? overrideReason : "",
        },
      });
      await refreshProfile();
      toast.success("Gig posted successfully!");
      navigate("/my-gigs");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to post gig");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-lg mx-auto animate-fade-in">
        <Card>
          <CardHeader>
            <CardTitle>Post a New Gig</CardTitle>
            <CardDescription>Describe the task you need done</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Pick up documents from CBD" maxLength={100} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe what needs to be done..." maxLength={1000} rows={4} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Budget (R)</Label>
                  <Input type="number" min="1" step="0.01" value={budget} onChange={(e) => setBudget(e.target.value)} required placeholder="50.00" />
                </div>
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Estimated Hours</Label>
                  <Input type="number" min="0.5" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Distance (km)</Label>
                  <Input type="number" min="0" step="0.1" value={distanceKm} onChange={(e) => setDistanceKm(e.target.value)} required />
                </div>
              </div>
              {category === "shopping" && (
                <div className="space-y-2">
                  <Label>Cart Value (R) - informational only</Label>
                  <Input type="number" min="0" step="0.01" value={cartValue} onChange={(e) => setCartValue(e.target.value)} placeholder="0.00" />
                </div>
              )}
              {complexityOptions.length > 0 && (
                <div className="space-y-2">
                  <Label>Complexity Factors</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {complexityOptions.map((opt) => {
                      const checked = complexityKeys.includes(opt.key);
                      return (
                        <label key={opt.key} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => {
                              setComplexityKeys((prev) => e.target.checked ? [...prev, opt.key] : prev.filter((k) => k !== opt.key));
                            }}
                          />
                          <span className="capitalize">{opt.key}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Suggested Pricing</Label>
                <div className="rounded-md border p-3 text-sm space-y-1">
                  {quoteLoading && <p className="text-muted-foreground">Calculating...</p>}
                  {!quoteLoading && quote && (
                    <>
                      <p>Subtotal: <span className="font-mono">R{quote.subtotal.toFixed(2)}</span></p>
                      <p>Platform Fee: <span className="font-mono">R{quote.fee.toFixed(2)}</span></p>
                      <p>Total: <span className="font-mono">R{quote.total.toFixed(2)}</span></p>
                      <p className="text-xs text-muted-foreground">Suggested band: R{quote.bandMin.toFixed(2)} - R{quote.bandMax.toFixed(2)}</p>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Input value={location} onChange={(e) => setLocation(e.target.value)} required placeholder="e.g. Johannesburg CBD" maxLength={100} />
              </div>
              {quote && (parseFloat(budget) < quote.bandMin || parseFloat(budget) > quote.bandMax) && (
                <div className="space-y-2">
                  <Label>Override Reason</Label>
                  <Textarea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Explain why this price is outside the suggested band" />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Your wallet balance: <span className="font-mono font-semibold">R{(profile?.balance || 0).toFixed(2)}</span>
              </p>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Post Gig
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
