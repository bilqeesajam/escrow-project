import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface CategoryFieldsValues {
  estimatedHours?: number;
  complexity?: string;
  pickupWaitTime?: number;
  itemWeight?: string;
  deliveryDistance?: number;
  itemSize?: string;
  urgency?: string;
  cartValue?: number;
  numberOfStores?: number;
  shoppingTime?: number;
}

interface CategoryFieldsFormProps {
  category: string;
  values: CategoryFieldsValues;
  onChange: (field: keyof CategoryFieldsValues, value: any) => void;
}

export function CategoryFieldsForm({ category, values, onChange }: CategoryFieldsFormProps) {
  return (
    <Card className="border-2">
      <CardHeader>
        <CardTitle className="text-lg capitalize">
          {category === "errand"
            ? "Errand Details"
            : category === "pickup"
            ? "Pickup Details"
            : category === "delivery"
            ? "Delivery Details"
            : category === "shopping"
            ? "Shopping Details"
            : "Task Details"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* ERRAND FIELDS */}
        {category === "errand" && (
          <>
            <div className="space-y-3">
              <Label>Estimated Hours: {values.estimatedHours || 1}h</Label>
              <Slider
                value={[values.estimatedHours || 1]}
                onValueChange={(v) => onChange("estimatedHours", v[0])}
                min={0.5}
                max={8}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Between 0.5 and 8 hours</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="errand-complexity">Complexity</Label>
              <Select
                value={values.complexity || "simple"}
                onValueChange={(v) => onChange("complexity", v)}
              >
                <SelectTrigger id="errand-complexity">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* PICKUP FIELDS */}
        {category === "pickup" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="pickup-wait">Estimated Wait Time (minutes)</Label>
              <Input
                id="pickup-wait"
                type="number"
                min="0"
                step="5"
                value={values.pickupWaitTime || 0}
                onChange={(e) => onChange("pickupWaitTime", Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickup-weight">Item Weight</Label>
              <Select
                value={values.itemWeight || "light"}
                onValueChange={(v) => onChange("itemWeight", v)}
              >
                <SelectTrigger id="pickup-weight">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light (&lt;5kg)</SelectItem>
                  <SelectItem value="medium">Medium (5-20kg)</SelectItem>
                  <SelectItem value="heavy">Heavy (&gt;20kg)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* DELIVERY FIELDS */}
        {category === "delivery" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="delivery-distance">Distance (km)</Label>
              <Input
                id="delivery-distance"
                type="number"
                min="0"
                step="0.1"
                value={values.deliveryDistance || 0}
                onChange={(e) => onChange("deliveryDistance", Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-size">Item Size</Label>
              <Select
                value={values.itemSize || "small"}
                onValueChange={(v) => onChange("itemSize", v)}
              >
                <SelectTrigger id="delivery-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delivery-urgency">Urgency</Label>
              <Select
                value={values.urgency || "normal"}
                onValueChange={(v) => onChange("urgency", v)}
              >
                <SelectTrigger id="delivery-urgency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {/* SHOPPING FIELDS */}
        {category === "shopping" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="shopping-cart">Estimated Cart Value (R)</Label>
              <Input
                id="shopping-cart"
                type="number"
                min="0"
                step="10"
                value={values.cartValue || 0}
                onChange={(e) => onChange("cartValue", Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shopping-stores">Number of Stores</Label>
              <Select
                value={String(values.numberOfStores || 1)}
                onValueChange={(v) => onChange("numberOfStores", parseInt(v))}
              >
                <SelectTrigger id="shopping-stores">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>Estimated Shopping Time: {values.shoppingTime || 30}m</Label>
              <Slider
                value={[values.shoppingTime || 30]}
                onValueChange={(v) => onChange("shoppingTime", v[0])}
                min={15}
                max={180}
                step={15}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Between 15 and 180 minutes</p>
            </div>
          </>
        )}

        {/* OTHER FIELDS */}
        {category === "other" && (
          <>
            <div className="space-y-3">
              <Label>Estimated Hours: {values.estimatedHours || 1}h</Label>
              <Slider
                value={[values.estimatedHours || 1]}
                onValueChange={(v) => onChange("estimatedHours", v[0])}
                min={0.5}
                max={8}
                step={0.5}
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">Between 0.5 and 8 hours</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
