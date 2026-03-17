import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth-context";
import { usePricingConfig } from "@/lib/pricing-context";
import { calculatePrice, type PriceCalculationResult, type PriceCalculationInput } from "@/lib/price-calculator";
import { AppLayout } from "@/components/AppLayout";
import { FormProgressIndicator } from "@/components/FormProgressIndicator";
import { CategorySelector } from "@/components/CategorySelector";
import { PricingModeSelector } from "@/components/PricingModeSelector";
import { PricingModeExplainer } from "@/components/PricingModeExplainer";
import { CategoryFieldsForm, type CategoryFieldsValues } from "@/components/CategoryFieldsForm";
import { PriceEstimatePanel } from "@/components/PriceEstimatePanel";
import { MobilePriceSheet } from "@/components/MobilePriceSheet";
import { BelowMinimumWarningDialog } from "@/components/BelowMinimumWarningDialog";
import { FormFieldValidation } from "@/components/FormFieldValidation";
import { GigPreviewDialog } from "@/components/GigPreviewDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { backendRequest } from "@/lib/backend";

const categories = ["errand", "pickup", "delivery", "shopping", "other"] as const;

type PricingMode = "fixed" | "smart";

export default function PostGigPage() {
  const { user, profile, refreshProfile } = useAuth();
  const { config, loading: configLoading, error: configError } = usePricingConfig();
  const navigate = useNavigate();

  // Form fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<string>("errand");
  
  // Pricing mode
  const [pricingMode, setPricingMode] = useState<PricingMode>("smart");
  
  // Smart price fields
  const [categoryFields, setCategoryFields] = useState<CategoryFieldsValues>({});
  const [priceCalculationResult, setPriceCalculationResult] = useState<PriceCalculationResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  
  // Dialog states
  const [showBelowMinimumWarning, setShowBelowMinimumWarning] = useState(false);
  const [belowMinimumAcknowledged, setBelowMinimumAcknowledged] = useState(false);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  // Submit state
  const [loading, setLoading] = useState(false);
  
  // Form validation
  const [formStep, setFormStep] = useState(1);

  // Calculate form step
  useEffect(() => {
    const hasBasics = title.trim() && description.trim() && location.trim();
    const hasCategory = category;
    const budgetNum = parseFloat(budget);
    const hasBudget = budgetNum > 0;
    
    if (hasBasics && hasCategory && hasBudget) {
      setFormStep(3);
    } else if (hasBasics && hasCategory) {
      setFormStep(2);
    } else if (hasBasics) {
      setFormStep(2);
    } else {
      setFormStep(1);
    }
  }, [title, description, location, category, budget]);

  // Determine if smart price mode is available
  const canUseSmartPrice = !!config && !configError;

  // If config not available, default to fixed price
  useEffect(() => {
    if (!canUseSmartPrice && pricingMode === "smart") {
      setPricingMode("fixed");
    }
  }, [canUseSmartPrice, pricingMode]);

  // Calculate price whenever category or category fields change
  useEffect(() => {
    if (pricingMode !== "smart" || !config) {
      setPriceCalculationResult(null);
      return;
    }

    setIsCalculating(true);
    const timer = setTimeout(() => {
      try {
        const input: PriceCalculationInput = {
          category,
          ...categoryFields,
        };
        const result = calculatePrice(config, input);
        setPriceCalculationResult(result);
      } catch (error) {
        console.error("Error calculating price:", error);
        setPriceCalculationResult(null);
      } finally {
        setIsCalculating(false);
      }
    }, 300); // Debounce calculation

    return () => clearTimeout(timer);
  }, [pricingMode, category, categoryFields, config]);

  // Reset pricing when mode changes
  useEffect(() => {
    setBudget("");
    setCategoryFields({});
    setBelowMinimumAcknowledged(false);
  }, [pricingMode]);

  // Reset category fields when category changes
  useEffect(() => {
    setCategoryFields({});
    setBelowMinimumAcknowledged(false);
  }, [category]);

  // Accept suggested price
  const handleAcceptSuggested = () => {
    if (priceCalculationResult) {
      setBudget(priceCalculationResult.suggestedBudget.toFixed(2));
      setBelowMinimumAcknowledged(false);
    }
  };

  // Handle category field change
  const handleCategoryFieldChange = (field: keyof CategoryFieldsValues, value: any) => {
    setCategoryFields((prev) => ({ ...prev, [field]: value }));
  };

  // Validate and submit form
  const handleSubmitClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    const budgetNum = parseFloat(budget);
    if (!budgetNum || budgetNum <= 0) {
      toast.error("Enter a valid budget");
      return;
    }
    if (!title.trim() || !description.trim() || !location.trim()) {
      toast.error("Fill all required fields");
      return;
    }
    if ((profile.balance || 0) < budgetNum) {
      toast.error("Insufficient balance. Top up your wallet first.");
      return;
    }

    // Check if budget is below minimum for smart pricing
    if (
      pricingMode === "smart" &&
      priceCalculationResult &&
      budgetNum < priceCalculationResult.minimumPrice &&
      !belowMinimumAcknowledged
    ) {
      setShowBelowMinimumWarning(true);
      return;
    }

    // Show preview dialog
    setShowPreview(true);
  };

  const handleConfirmSubmit = async () => {
    const budgetNum = parseFloat(budget);

    try {
      setLoading(true);
      await backendRequest("/api/gigs/create/", {
        body: {
          title: title.trim(),
          description: description.trim(),
          location: location.trim(),
          category,
          requested_total: budgetNum,
          pricing_mode: pricingMode,
          below_minimum_price: belowMinimumAcknowledged,
          ...(pricingMode === "smart" && priceCalculationResult && {
            calculated_price: priceCalculationResult.suggestedBudget,
            platform_fee: priceCalculationResult.platformFee,
            payfast_fee: priceCalculationResult.payfastFee,
            hustler_receives: priceCalculationResult.hustlerReceives,
            pricing_config_version: 1,
          }),
          ...categoryFields,
        },
      });
      await refreshProfile();
      toast.success("Gig posted successfully!");
      navigate("/my-gigs");
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to post gig");
    } finally {
      setLoading(false);
      setShowPreview(false);
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-background py-8 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Post a New Gig</h1>
            <p className="text-muted-foreground">Create a gig and find a hustler to complete it</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-8">
            <FormProgressIndicator 
              currentStep={formStep}
              totalSteps={3}
              steps={["Task Details", "Pricing", "Review"]}
            />
          </div>

          <form onSubmit={handleSubmitClick} className="space-y-8">
            {/* Section 1: Basic Details */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-xl">Task Details</CardTitle>
                <CardDescription>Describe what you need done</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-base font-semibold">
                    Task Title
                  </Label>
                  <Input
                    id="title"
                    placeholder="e.g., Move furniture to new apartment"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={100}
                    className="text-base"
                  />
                  <FormFieldValidation
                    label="Task Title"
                    value={title}
                    maxLength={100}
                    required={true}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-base font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Provide details about the task..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={5}
                    className="text-base resize-none"
                  />
                  <FormFieldValidation
                    label="Description"
                    value={description}
                    maxLength={500}
                    required={true}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-base font-semibold">
                    Location
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Johannesburg, South Africa"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    maxLength={100}
                    className="text-base"
                  />
                  <FormFieldValidation
                    label="Location"
                    value={location}
                    maxLength={100}
                    required={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Section 2: Category Selection */}
            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-xl">Task Category</CardTitle>
                <CardDescription>What type of task is this?</CardDescription>
              </CardHeader>
              <CardContent>
                <CategorySelector
                  value={category as any}
                  onSelect={(value) => setCategory(value)}
                />
              </CardContent>
            </Card>

            {/* Section 3: Pricing */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl">Pricing Setup</CardTitle>
                    <CardDescription>Choose your pricing mode and budget</CardDescription>
                  </div>
                  <PricingModeExplainer 
                    mode={pricingMode}
                    configAvailable={canUseSmartPrice}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Pricing Mode Selection */}
                {!configLoading && (
                  <PricingModeSelector
                    mode={pricingMode}
                    onModeChange={(mode) => setPricingMode(mode)}
                    configAvailable={canUseSmartPrice}
                  />
                )}

                {configLoading && (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                )}

                {/* Category-specific fields for smart pricing */}
                {pricingMode === "smart" && !configLoading && (
                  <CategoryFieldsForm
                    category={category}
                    values={categoryFields}
                    onChange={handleCategoryFieldChange}
                  />
                )}

                {/* Budget Input */}
                <div className="space-y-2">
                  <Label htmlFor="budget" className="text-base font-semibold">
                    {pricingMode === "smart" ? "Your Budget" : "Offered Price"}
                  </Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                        R
                      </span>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="0.00"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        step="0.01"
                        min="0"
                        className="pl-8 text-base"
                      />
                    </div>
                    {pricingMode === "smart" && priceCalculationResult && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAcceptSuggested}
                        className="whitespace-nowrap"
                      >
                        Accept Suggested
                      </Button>
                    )}
                  </div>
                </div>

                {/* Smart Price Info */}
                {pricingMode === "smart" && !isCalculating && priceCalculationResult && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                    <p className="text-sm text-blue-900 dark:text-blue-100">
                      <span className="font-semibold">Suggested Budget:</span> R
                      {priceCalculationResult.suggestedBudget.toFixed(2)} ·{" "}
                      <span className="font-semibold">Minimum:</span> R
                      {priceCalculationResult.minimumPrice.toFixed(2)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Price Estimate Panel - Desktop */}
            {pricingMode === "smart" && !isCalculating && priceCalculationResult && (
              <div className="hidden md:block sticky top-6 z-40">
                <PriceEstimatePanel
                  result={priceCalculationResult}
                  isLoading={isCalculating}
                  userBudget={parseFloat(budget) || 0}
                  belowMinimumAcknowledged={belowMinimumAcknowledged}
                  onAcceptSuggested={handleAcceptSuggested}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="lg"
                className="flex-1"
                disabled={
                  loading ||
                  !title.trim() ||
                  !description.trim() ||
                  !location.trim() ||
                  !budget ||
                  parseFloat(budget) <= 0
                }
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Posting...
                  </>
                ) : (
                  "Review & Post Gig"
                )}
              </Button>
            </div>
          </form>

          {/* Warnings Dialog */}
          <BelowMinimumWarningDialog
            open={showBelowMinimumWarning}
            onOpenChange={setShowBelowMinimumWarning}
            suggestedPrice={priceCalculationResult?.minimumPrice || 0}
            userBudget={parseFloat(budget) || 0}
            onConfirm={() => {
              setBelowMinimumAcknowledged(true);
              setShowBelowMinimumWarning(false);
            }}
          />

          {/* Gig Preview Dialog */}
          <GigPreviewDialog
            open={showPreview}
            onOpenChange={setShowPreview}
            gig={{
              title: title.trim(),
              description: description.trim(),
              location: location.trim(),
              category,
              budget: parseFloat(budget),
              pricingMode,
              hustlerReceives:
                pricingMode === "smart" && priceCalculationResult
                  ? priceCalculationResult.hustlerReceives
                  : parseFloat(budget),
            }}
            onConfirm={handleConfirmSubmit}
            isLoading={loading}
          />

          {/* Mobile Price Sheet */}
          {pricingMode === "smart" && !isCalculating && priceCalculationResult && (
            <MobilePriceSheet
              open={mobileSheetOpen}
              onOpenChange={setMobileSheetOpen}
              result={priceCalculationResult}
              isLoading={isCalculating}
              userBudget={parseFloat(budget) || 0}
              belowMinimumAcknowledged={belowMinimumAcknowledged}
              onAcceptSuggested={handleAcceptSuggested}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
}
