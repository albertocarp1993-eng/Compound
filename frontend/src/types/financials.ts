import { HealthVerdict } from './analytics';
import { MoatRating } from './scoring';

export type AssetFinancialRow = {
  fiscalYear: number;
  fiscalPeriod: string;
  period: 'ANNUAL' | 'QUARTERLY';
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  freeCashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  dividendsPerShare: number;
  grossMarginPct: number;
  operatingMarginPct: number;
  netMarginPct: number;
  debtToAssetsPct: number;
};

export type AssetFundamentalsPayload = {
  peRatio: number;
  roe: number;
  debtToEquity: number;
  payoutRatio: number;
  dividendGrowthStreak: number;
  dividendSafetyScore: number;
  moatRating: MoatRating;
  historicalVolatility: number;
  healthRating: number;
  verdict: HealthVerdict;
  snowballScore: number;
};

export type AssetFinancialsResponse = {
  symbol: string;
  name: string;
  currentPrice: number;
  fundamentals: AssetFundamentalsPayload | null;
  financials: AssetFinancialRow[];
};
