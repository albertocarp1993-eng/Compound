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

export type PeriodComparisonMetrics = {
  latestLabel: string;
  previousLabel: string;
  revenueGrowthPct: number | null;
  netIncomeGrowthPct: number | null;
  epsGrowthPct: number | null;
  freeCashFlowGrowthPct: number | null;
  grossMarginDeltaPct: number | null;
  operatingMarginDeltaPct: number | null;
  netMarginDeltaPct: number | null;
  freeCashFlowMarginDeltaPct: number | null;
};

export type AnnualTrendMetrics = {
  sampleYears: number;
  revenueCagrPct: number | null;
  epsCagrPct: number | null;
  freeCashFlowCagrPct: number | null;
};

export type AssetMetricsPayload = {
  qoq: PeriodComparisonMetrics | null;
  yoy: PeriodComparisonMetrics | null;
  annualTrend: AnnualTrendMetrics | null;
};

export type AssetScoreModelPayload = {
  compositeScore: number;
  label: 'ELITE' | 'STRONG' | 'WATCH' | 'RISK';
  components: {
    valuation: number;
    growth: number;
    profitability: number;
    safety: number;
    moat: number;
  };
  weights: {
    valuation: number;
    growth: number;
    profitability: number;
    safety: number;
    moat: number;
  };
  breakdown: Array<{
    component: 'valuation' | 'growth' | 'profitability' | 'safety' | 'moat';
    score: number;
    weight: number;
    weightedContribution: number;
    reason: string;
  }>;
};

export type AssetFinancialsResponse = {
  symbol: string;
  name: string;
  currentPrice: number;
  fundamentals: AssetFundamentalsPayload | null;
  metrics?: AssetMetricsPayload;
  scoreModel?: AssetScoreModelPayload | null;
  financials: AssetFinancialRow[];
};
