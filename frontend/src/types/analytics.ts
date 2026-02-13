import { MoatRating, ScoreBreakdownItem } from './scoring';

export type AnalyticsMatrixPoint = {
  assetId: number;
  symbol: string;
  name: string;
  peRatio: number;
  qualityScore: number;
  positionValue: number;
  portfolioWeight: number;
  moatRating: MoatRating;
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
  moatRating: MoatRating;
  calculatedScore: number;
  color: string;
  portfolioWeight: number;
  breakdown: ScoreBreakdownItem[];
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
