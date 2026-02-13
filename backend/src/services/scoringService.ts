import { AssetFundamentals, MoatRating } from '@prisma/client';

export type ScoringInput = Pick<
  AssetFundamentals,
  | 'pe_ratio'
  | 'roe'
  | 'debt_to_equity'
  | 'dividend_safety_score'
  | 'moat_rating'
  | 'historical_volatility'
>;

export type ScoreBreakdownItem = {
  metric: string;
  value: string;
  points: number;
  reason: string;
};

export type ScoreDetails = {
  score: number;
  breakdown: ScoreBreakdownItem[];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const moatPoints = (moat: MoatRating): number => {
  if (moat === 'WIDE') return 20;
  if (moat === 'NARROW') return 10;
  return 0;
};

const valuationPoints = (peRatio: number): number => {
  if (peRatio <= 0) return -10;
  if (peRatio <= 15) return 12;
  if (peRatio <= 25) return 5;

  // Penalize expensive assets above threshold.
  const penalty = (peRatio - 25) * 0.8;
  return -clamp(penalty, 0, 25);
};

const profitabilityPoints = (roe: number): number => {
  const scaled = roe / 5;
  return clamp(scaled, -20, 30);
};

const debtPoints = (debtToEquity: number): number => {
  if (debtToEquity <= 0.5) return 8;
  if (debtToEquity <= 1.0) return 5;
  if (debtToEquity <= 2.0) return 0;

  const penalty = (debtToEquity - 2.0) * 10;
  return -clamp(penalty, 0, 25);
};

const dividendSafetyPoints = (dividendSafetyScore: number): number => {
  const normalized = clamp(dividendSafetyScore, 0, 100);
  return (normalized - 50) / 5;
};

const volatilityPoints = (historicalVolatility: number): number => {
  if (historicalVolatility <= 0.2) return 5;
  if (historicalVolatility <= 0.4) return 0;

  const penalty = (historicalVolatility - 0.4) * 30;
  return -clamp(penalty, 0, 10);
};

export const calculateAssetScoreDetails = (
  fundamentals: ScoringInput | AssetFundamentals,
): ScoreDetails => {
  const breakdown: ScoreBreakdownItem[] = [];

  const base = 50;

  const moat = moatPoints(fundamentals.moat_rating);
  breakdown.push({
    metric: 'Moat',
    value: fundamentals.moat_rating,
    points: moat,
    reason:
      fundamentals.moat_rating === 'WIDE'
        ? 'Durable competitive edge.'
        : fundamentals.moat_rating === 'NARROW'
          ? 'Some durable advantage.'
          : 'No structural advantage identified.',
  });

  const valuation = valuationPoints(fundamentals.pe_ratio);
  breakdown.push({
    metric: 'Valuation (P/E)',
    value: fundamentals.pe_ratio.toFixed(2),
    points: valuation,
    reason:
      fundamentals.pe_ratio > 25
        ? 'Expensive relative valuation.'
        : 'Reasonable or attractive valuation.',
  });

  const profitability = profitabilityPoints(fundamentals.roe);
  breakdown.push({
    metric: 'Profitability (ROE)',
    value: `${fundamentals.roe.toFixed(2)}%`,
    points: profitability,
    reason: 'Higher ROE gets a direct quality boost.',
  });

  const debt = debtPoints(fundamentals.debt_to_equity);
  breakdown.push({
    metric: 'Debt / Equity',
    value: fundamentals.debt_to_equity.toFixed(2),
    points: debt,
    reason:
      fundamentals.debt_to_equity > 2.0
        ? 'Leverage above risk threshold.'
        : 'Balance sheet leverage is manageable.',
  });

  const dividendSafety = dividendSafetyPoints(fundamentals.dividend_safety_score);
  breakdown.push({
    metric: 'Dividend Safety',
    value: `${fundamentals.dividend_safety_score}/100`,
    points: dividendSafety,
    reason: 'Safer dividends improve defensive quality.',
  });

  const volatility = volatilityPoints(fundamentals.historical_volatility);
  breakdown.push({
    metric: 'Historical Volatility',
    value: fundamentals.historical_volatility.toFixed(2),
    points: volatility,
    reason:
      fundamentals.historical_volatility > 0.4
        ? 'Higher volatility reduces quality confidence.'
        : 'Stable price behavior supports quality.',
  });

  const rawScore =
    base + moat + valuation + profitability + debt + dividendSafety + volatility;

  const score = Math.round(clamp(rawScore, 0, 100));

  return { score, breakdown };
};

export const calculateAssetScore = (
  fundamentals: ScoringInput | AssetFundamentals,
): number =>
  calculateAssetScoreDetails(fundamentals).score;
