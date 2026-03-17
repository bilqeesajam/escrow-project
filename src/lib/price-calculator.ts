import type { PricingConfig } from './pricing-context';

export interface PriceCalculationInput {
  category: string;
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

export interface PriceCalculationResult {
  suggestedBudget: number;
  platformFee: number;
  payfastFee: number;
  hustlerReceives: number;
  minimumPrice: number;
  maximumPrice: number;
  isBelowMinimum: boolean;
}

export function calculatePrice(
  config: PricingConfig | null,
  input: PriceCalculationInput
): PriceCalculationResult | null {
  if (!config) return null;

  let basePrice = 0;

  // Calculate base price based on category and fields
  switch (input.category) {
    case 'errand': {
      const hours = input.estimatedHours || 1;
      const complexityMultiplier = input.complexity
        ? config.complexity_multipliers[input.complexity] || 1
        : 1;
      const categoryMultiplier = config.category_multipliers['errand'] || 1;
      basePrice = config.base_rate_per_hour * hours * complexityMultiplier * categoryMultiplier;
      break;
    }

    case 'pickup': {
      const baseHours = 1;
      const waitTimeMultiplier = 1 + (input.pickupWaitTime || 0) / 60 * 0.2;
      const weightMultiplier = input.itemWeight === 'light' ? 1 : input.itemWeight === 'medium' ? 1.2 : 1.4;
      const categoryMultiplier = config.category_multipliers['pickup'] || 1;
      basePrice =
        config.base_rate_per_hour *
        baseHours *
        waitTimeMultiplier *
        weightMultiplier *
        categoryMultiplier;
      break;
    }

    case 'delivery': {
      const distance = input.deliveryDistance || 0;
      const baseDeliveryPrice = config.base_rate_per_hour * 0.5; // Base 30 mins
      const distanceRate = distance * 5; // R5 per km
      const sizeMultiplier = input.itemSize === 'small' ? 1 : input.itemSize === 'medium' ? 1.3 : 1.6;
      const urgencyMultiplier = input.urgency === 'high' ? 1.5 : input.urgency === 'urgent' ? 2 : 1;
      const categoryMultiplier = config.category_multipliers['delivery'] || 1;
      basePrice =
        (baseDeliveryPrice + distanceRate) * sizeMultiplier * urgencyMultiplier * categoryMultiplier;
      break;
    }

    case 'shopping': {
      const cartValue = input.cartValue || 0;
      const numberOfStores = input.numberOfStores || 1;
      const shoppingTimeMultiplier = (input.shoppingTime || 1) / 60; // convert mins to hours
      const categoryMultiplier = config.category_multipliers['shopping'] || 1;
      const shoppingFee = config.base_rate_per_hour * shoppingTimeMultiplier * numberOfStores * categoryMultiplier;
      const cartHandlingFee = cartValue * 0.05; // 5% of cart value
      basePrice = shoppingFee + cartHandlingFee;
      break;
    }

    case 'other': {
      const hours = input.estimatedHours || 1;
      const categoryMultiplier = config.category_multipliers['other'] || 1;
      basePrice = config.base_rate_per_hour * hours * categoryMultiplier;
      break;
    }

    default:
      basePrice = config.minimum_gig_price;
  }

  // Ensure minimum price
  const suggestedPrice = Math.max(basePrice, config.minimum_gig_price);

  // Calculate fees
  const platformFee = suggestedPrice * (config.platform_fee_percentage / 100);
  const payfastFee =
    suggestedPrice * (config.payfast_fee_percentage / 100) + config.payfast_fee_fixed;

  const hustlerReceives = suggestedPrice - platformFee - payfastFee;

  // Calculate band
  const bandPercentage = config.suggested_price_band_percentage || 20;
  const minimumPrice = suggestedPrice * (1 - bandPercentage / 100);
  const maximumPrice = suggestedPrice * (1 + bandPercentage / 100);

  return {
    suggestedBudget: suggestedPrice,
    platformFee,
    payfastFee,
    hustlerReceives: Math.max(hustlerReceives, 0),
    minimumPrice,
    maximumPrice,
    isBelowMinimum: suggestedPrice < config.minimum_gig_price,
  };
}
