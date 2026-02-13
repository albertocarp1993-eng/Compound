import { MoatRating, ScoreBreakdownItem } from './scoring';

export type HealthVerdict = 'BUY' | 'HOLD' | 'TRIM';

export type AnalyticsMatrixPoint = {
  assetId: number;
  symbol: string;
  name: string;
  peRatio: number;
  qualityScore: number;
  positionValue: number;
  portfolioWeight: number;
  moatRating: MoatRating;
  verdict: HealthVerdict;
  color: string;
  x: number;
  y: number;
  z: number;
};

export type PortfolioHealthResponse = {
  portfolioId: number;
  weightedAverageScore: number;
  scoreColor: string;
  totalValue: number;
  holdingsAnalyzed: number;
};

export type HoldingAnalytics = {
  holdingId: number;
  assetId: number;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
  value: number;
  peRatio: number;
  roe: number;
  debtToEquity: number;
  payoutRatio: number;
  dividendGrowthStreak: number;
  dividendSafetyScore: number;
  historicalVolatility: number;
  moatRating: MoatRating;
  calculatedScore: number;
  healthVerdict: HealthVerdict;
  color: string;
  portfolioWeight: number;
  breakdown: ScoreBreakdownItem[];
  dripEnabled: boolean;
  snowballImpact10y: number;
  sparkline: number[];
  annualDividendIncome: number;
};

export type AnalyticsMatrixResponse = {
  portfolioId: number;
  totalValue: number;
  count: number;
  matrix: AnalyticsMatrixPoint[];
};

export type HoldingsAnalyticsResponse = {
  portfolioId: number;
  totalValue: number;
  count: number;
  holdings: HoldingAnalytics[];
};

export type PortfolioKpiResponse = {
  portfolioId: number;
  netWorth: number;
  dayChangePct: number;
  ytdDividends: number;
  investedCapital: number;
  snowballFactor: number;
};

export type SnowballPoint = {
  date: string;
  investedCapital: number;
  totalValue: number;
  compoundInterest: number;
  futureIncome: number;
  totalDividends: number;
};

export type SnowballResponse = {
  portfolioId: number;
  points: SnowballPoint[];
  summary: {
    totalValue: number;
    investedCapital: number;
    compoundInterest: number;
    futureIncome: number;
    totalDividends: number;
  };
};

export type PayoutCalendarDay = {
  date: string;
  amount: number;
  intensity: number;
};

export type PayoutCalendarResponse = {
  portfolioId: number;
  year: number;
  days: PayoutCalendarDay[];
  projectedAnnualDividends: number;
};
