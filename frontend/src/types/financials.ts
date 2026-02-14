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
  operatingCashFlow: number;
  capitalExpenditures: number;
  freeCashFlow: number;
  stockBasedCompensation: number;
  dilutedSharesOutstanding: number;
  researchAndDevelopmentExpense: number;
  sellingGeneralAdministrativeExpense: number;
  totalAssets: number;
  currentAssets: number;
  cashAndEquivalents: number;
  totalLiabilities: number;
  currentLiabilities: number;
  longTermDebt: number;
  totalEquity: number;
  interestExpense: number;
  dividendsPerShare: number;
  grossMarginPct: number;
  operatingMarginPct: number;
  netMarginPct: number;
  debtToAssetsPct: number;
  freeCashFlowMarginPct: number;
  operatingCashFlowMarginPct: number;
  debtToEquityRatio: number;
  currentRatio: number;
  returnOnAssetsPct: number;
  returnOnEquityPct: number;
  capexToRevenuePct: number;
  sbcToRevenuePct: number;
  assetTurnoverRatio: number;
  fcfConversionPct: number;
  interestCoverageRatio: number;
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
  operatingCashFlowGrowthPct: number | null;
  stockBasedCompensationGrowthPct: number | null;
  grossMarginDeltaPct: number | null;
  operatingMarginDeltaPct: number | null;
  netMarginDeltaPct: number | null;
  freeCashFlowMarginDeltaPct: number | null;
  debtToEquityDelta: number | null;
  currentRatioDelta: number | null;
  interestCoverageDelta: number | null;
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

export type FinancialMetricRow = {
  key: string;
  category:
    | 'Income Statement'
    | 'Cash Flow'
    | 'Balance Sheet'
    | 'Per Share'
    | 'Margins'
    | 'Returns'
    | 'Leverage'
    | 'Efficiency';
  metric: string;
  unit: 'USD' | 'PERCENT' | 'RATIO' | 'PER_SHARE' | 'SHARES';
  latestValue: number | null;
  priorQuarterValue: number | null;
  sameQuarterLastYearValue: number | null;
  qoqChangePct: number | null;
  yoyChangePct: number | null;
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
  valuationContext?: {
    peRatio: number | null;
    pegRatio: number | null;
    epsGrowthPct: number | null;
    valuationBand: 'Attractive' | 'Fair' | 'Expensive' | 'N/A';
    reason: string;
  };
  financialMetricTable?: FinancialMetricRow[];
  financials: AssetFinancialRow[];
};
