import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

export interface PricingConfig {
  version: string;
  updated_at: string;
  base_rate_per_hour: number;
  platform_fee_percentage: number;
  payfast_fee_percentage: number;
  payfast_fee_fixed: number;
  category_multipliers: Record<string, number>;
  complexity_multipliers: Record<string, number>;
  minimum_gig_price: number;
  suggested_price_band_percentage: number;
}

interface PricingContextType {
  config: PricingConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
}

const PricingContext = createContext<PricingContextType | undefined>(undefined);

const CACHE_KEY = 'pricing_config_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export const usePricingConfig = () => {
  const context = useContext(PricingContext);
  if (!context) throw new Error('usePricingConfig must be used within a PricingProvider');
  return context;
};

async function fetchPricingConfig(): Promise<PricingConfig | null> {
  try {
    const response = await fetch('/api/pricing-config', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch pricing config: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching pricing config:', error);
    return null;
  }
}

function getCachedConfig(): { config: PricingConfig | null; isExpired: boolean } {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return { config: null, isExpired: true };

    const { config, timestamp } = JSON.parse(cached);
    const isExpired = Date.now() - timestamp > CACHE_DURATION;

    return { config, isExpired };
  } catch (error) {
    console.error('Error reading cached pricing config:', error);
    return { config: null, isExpired: true };
  }
}

function setCachedConfig(config: PricingConfig): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ config, timestamp: Date.now() }));
  } catch (error) {
    console.error('Error caching pricing config:', error);
  }
}

export const PricingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<PricingConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshConfig = async () => {
    setLoading(true);
    setError(null);

    const freshConfig = await fetchPricingConfig();
    
    if (freshConfig) {
      setConfig(freshConfig);
      setCachedConfig(freshConfig);
      setError(null);
    } else {
      // Fallback to cached config if fresh fetch fails
      const { config: cachedConfig } = getCachedConfig();
      if (cachedConfig) {
        setConfig(cachedConfig);
        setError('Using cached pricing config. Features may be partially unavailable.');
        toast.warning('Using cached pricing config - some features may be unavailable.');
      } else {
        setConfig(null);
        setError('Failed to load pricing configuration. Falling back to Fixed Price mode.');
        toast.warning('Failed to load pricing config. Using Fixed Price mode only.');
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const initConfig = async () => {
      // Try to get cached config first
      const { config: cachedConfig, isExpired } = getCachedConfig();
      
      if (cachedConfig && !isExpired) {
        setConfig(cachedConfig);
        setLoading(false);
        return;
      }

      // If cache is expired or missing, fetch fresh config
      await refreshConfig();
    };

    initConfig();
  }, []);

  return (
    <PricingContext.Provider value={{ config, loading, error, refreshConfig }}>
      {children}
    </PricingContext.Provider>
  );
};
