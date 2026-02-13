import { AssetFundamentals, MoatRating, Verdict } from '@prisma/client';

export type ScoringInput = Pick<
  AssetFundamentals,
  | 'moat_rating'
  | 'debt_to_equity'
  | 'dividend_growth_streak'
  | 'payout_ratio'
> &
  Partial<
    Pick<
      AssetFundamentals,
      | 'pe_ratio'
      | 'roe'
      | 'dividend_safety_score'
      | 'historical_volatility'
    >
  >;

export type ScoreBreakdownItem = {
  metric: string;
  value: string;
  points: number;
  reason: string;
};

export type ScoreDetails = {
  score: number;
  healthRating: number;
  verdict: Verdict;
  breakdown: ScoreBreakdownItem[];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const moatPoints = (moat: MoatRating): number => {
  if (moat === 'WIDE') return 20;
  if (moat === 'NARROW') return 10;
  return 0;
};

const dividendGrowthPoints = (dividendGrowthStreak: number): number => {
  if (dividendGrowthStreak > 10) return 15;
  return 0;
};

const payoutPoints = (payoutRatio: number): number => (payoutRatio < 60 ? 10 : 0);

const debtPoints = (debtToEquity: number): number => (debtToEquity > 1.5 ? -15 : 0);

const verdictFromScore = (score: number): Verdict => {
  if (score >= 80) return 'BUY';
  if (score >= 55) return 'HOLD';
  return 'TRIM';
};

export const calculateAssetScoreDetails = (
  fundamentals: ScoringInput | AssetFundamentals,
): ScoreDetails => {
  const breakdown: ScoreBreakdownItem[] = [];

  const base = 50;
  breakdown.push({
    metric: 'Base',
    value: 'Starting point',
    points: base,
    reason: 'All assets begin with a neutral baseline.',
  });

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

  const dividendGrowthStreak = fundamentals.dividend_growth_streak ?? 0;
  const dividendGrowth = dividendGrowthPoints(dividendGrowthStreak);
  breakdown.push({
    metric: 'Dividend Growth Streak',
    value: `${dividendGrowthStreak} years`,
    points: dividendGrowth,
    reason:
      dividendGrowthStreak > 10
        ? 'Long streak supports long-term compounding confidence.'
        : 'Short or no streak gets no bonus.',
  });

  const payoutRatio = fundamentals.payout_ratio ?? 100;
  const payout = payoutPoints(payoutRatio);
  breakdown.push({
    metric: 'Payout Ratio',
    value: `${payoutRatio.toFixed(2)}%`,
    points: payout,
    reason:
      payoutRatio < 60
        ? 'Low payout ratio provides dividend safety headroom.'
        : 'No bonus above target payout threshold.',
  });

  const debtToEquity = fundamentals.debt_to_equity ?? 2;
  const debt = debtPoints(debtToEquity);
  breakdown.push({
    metric: 'Debt / Equity',
    value: debtToEquity.toFixed(2),
    points: debt,
    reason:
      debtToEquity > 1.5
        ? 'Leverage above threshold reduces score.'
        : 'Leverage within preferred range.',
  });

  const rawScore = base + moat + dividendGrowth + payout + debt;
  const healthRating = Math.round(clamp(rawScore, 0, 100));
  const verdict = verdictFromScore(healthRating);

  breakdown.push({
    metric: 'Verdict',
    value: verdict,
    points: 0,
    reason: 'Final recommendation from the health rating band.',
  });

  return { score: healthRating, healthRating, verdict, breakdown };
};

export const calculateAssetScore = (
  fundamentals: ScoringInput | AssetFundamentals,
): number =>
  calculateAssetScoreDetails(fundamentals).score;
