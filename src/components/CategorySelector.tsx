import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, Truck, MapPin, ShoppingCart, FileText } from "lucide-react";

interface CategorySelectorProps {
  value: string;
  onSelect: (category: string) => void;
}

const categoryIcons: Record<string, { icon: React.ReactNode; color: string; description: string }> = {
  errand: {
    icon: <FileText className="h-6 w-6" />,
    color: "bg-blue-500/10 border-blue-500/30",
    description: "Tasks & errands",
  },
  pickup: {
    icon: <Package className="h-6 w-6" />,
    color: "bg-purple-500/10 border-purple-500/30",
    description: "Pick something up",
  },
  delivery: {
    icon: <Truck className="h-6 w-6" />,
    color: "bg-green-500/10 border-green-500/30",
    description: "Deliver items",
  },
  shopping: {
    icon: <ShoppingCart className="h-6 w-6" />,
    color: "bg-amber-500/10 border-amber-500/30",
    description: "Shopping assistance",
  },
  other: {
    icon: <MapPin className="h-6 w-6" />,
    color: "bg-gray-500/10 border-gray-500/30",
    description: "Other tasks",
  },
};

export function CategorySelector({ value, onSelect }: CategorySelectorProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-semibold">Select Category</label>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(categoryIcons).map(([key, { icon, color, description }]) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              value === key
                ? `${color} border-current ring-2 ring-accent`
                : "border-border hover:border-accent/50"
            }`}
          >
            <div className="flex flex-col items-center justify-center gap-2">
              <div className={value === key ? "text-accent" : "text-muted-foreground"}>
                {icon}
              </div>
              <span className="text-xs font-medium capitalize text-center">{key}</span>
              <span className="text-[10px] text-muted-foreground text-center">{description}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
