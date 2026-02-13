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

export type CompositeScoreComponent = 'valuation' | 'growth' | 'profitability' | 'safety' | 'moat';

export type CompositeScoreWeights = Record<CompositeScoreComponent, number>;

export type CompositeScoreComponents = Record<CompositeScoreComponent, number>;

export type CompositeScoreBreakdownItem = {
  component: CompositeScoreComponent;
  score: number;
  weight: number;
  weightedContribution: number;
  reason: string;
};

export type CompositeScoreInput = {
  peRatio?: number | null;
  roe?: number | null;
  debtToEquity?: number | null;
  payoutRatio?: number | null;
  dividendSafetyScore?: number | null;
  moatRating?: MoatRating | null;
  historicalVolatility?: number | null;
  dividendGrowthStreak?: number | null;
  qoqRevenueGrowthPct?: number | null;
  qoqNetIncomeGrowthPct?: number | null;
  qoqEpsGrowthPct?: number | null;
  qoqFreeCashFlowGrowthPct?: number | null;
  yoyRevenueGrowthPct?: number | null;
  yoyNetIncomeGrowthPct?: number | null;
  yoyEpsGrowthPct?: number | null;
  yoyFreeCashFlowGrowthPct?: number | null;
  grossMarginPct?: number | null;
  operatingMarginPct?: number | null;
  netMarginPct?: number | null;
  freeCashFlowMarginPct?: number | null;
};

export type CompositeScoreResult = {
  compositeScore: number;
  components: CompositeScoreComponents;
  weights: CompositeScoreWeights;
  label: 'ELITE' | 'STRONG' | 'WATCH' | 'RISK';
  breakdown: CompositeScoreBreakdownItem[];
};

const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

const toNumberOrNull = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const average = (values: number[]): number => {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

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

const COMPOSITE_WEIGHTS: CompositeScoreWeights = {
  valuation: 0.25,
  growth: 0.25,
  profitability: 0.2,
  safety: 0.15,
  moat: 0.15,
};

const scoreValuation = (peRatio: number | null): number => {
  if (peRatio === null || peRatio <= 0) return 35;
  if (peRatio <= 10) return 95;
  if (peRatio <= 15) return 88;
  if (peRatio <= 20) return 78;
  if (peRatio <= 25) return 68;
  if (peRatio <= 35) return 52;
  if (peRatio <= 45) return 40;
  return 28;
};

const scoreGrowthMetric = (metric: number): number => clamp(50 + metric * 1.2, 0, 100);

const scoreGrowth = (input: CompositeScoreInput): number => {
  const growthMetrics = [
    toNumberOrNull(input.qoqRevenueGrowthPct),
    toNumberOrNull(input.qoqNetIncomeGrowthPct),
    toNumberOrNull(input.qoqEpsGrowthPct),
    toNumberOrNull(input.qoqFreeCashFlowGrowthPct),
    toNumberOrNull(input.yoyRevenueGrowthPct),
    toNumberOrNull(input.yoyNetIncomeGrowthPct),
    toNumberOrNull(input.yoyEpsGrowthPct),
    toNumberOrNull(input.yoyFreeCashFlowGrowthPct),
  ].filter((value): value is number => value !== null);

  if (growthMetrics.length === 0) return 50;
  return Math.round(average(growthMetrics.map((metric) => scoreGrowthMetric(metric))));
};

const scoreRoe = (roe: number | null): number => {
  if (roe === null) return 55;
  if (roe >= 25) return 95;
  if (roe >= 20) return 88;
  if (roe >= 15) return 78;
  if (roe >= 10) return 68;
  if (roe >= 5) return 58;
  if (roe >= 0) return 45;
  return 20;
};

const scoreMargin = (margin: number | null): number => {
  if (margin === null) return 55;
  if (margin >= 30) return 95;
  if (margin >= 20) return 86;
  if (margin >= 12) return 76;
  if (margin >= 5) return 66;
  if (margin >= 0) return 52;
  return 22;
};

const scoreProfitability = (input: CompositeScoreInput): number => {
  const scores = [
    scoreRoe(toNumberOrNull(input.roe)),
    scoreMargin(toNumberOrNull(input.grossMarginPct)),
    scoreMargin(toNumberOrNull(input.operatingMarginPct)),
    scoreMargin(toNumberOrNull(input.netMarginPct)),
    scoreMargin(toNumberOrNull(input.freeCashFlowMarginPct)),
  ];

  return Math.round(average(scores));
};

const scoreDebtToEquity = (debtToEquity: number | null): number => {
  if (debtToEquity === null) return 55;
  if (debtToEquity <= 0.4) return 95;
  if (debtToEquity <= 0.8) return 85;
  if (debtToEquity <= 1.2) return 75;
  if (debtToEquity <= 1.8) return 60;
  if (debtToEquity <= 2.5) return 45;
  return 25;
};

const scorePayoutRatio = (payoutRatio: number | null): number => {
  if (payoutRatio === null || payoutRatio <= 0) return 55;
  if (payoutRatio <= 35) return 90;
  if (payoutRatio <= 60) return 80;
  if (payoutRatio <= 80) return 60;
  if (payoutRatio <= 100) return 40;
  return 20;
};

const scoreVolatility = (historicalVolatility: number | null): number => {
  if (historicalVolatility === null || historicalVolatility <= 0) return 55;
  if (historicalVolatility <= 0.2) return 88;
  if (historicalVolatility <= 0.3) return 76;
  if (historicalVolatility <= 0.45) return 60;
  if (historicalVolatility <= 0.6) return 45;
  return 30;
};

const scoreSafety = (input: CompositeScoreInput): number => {
  const scores = [
    scoreDebtToEquity(toNumberOrNull(input.debtToEquity)),
    scorePayoutRatio(toNumberOrNull(input.payoutRatio)),
    toNumberOrNull(input.dividendSafetyScore) ?? 55,
    scoreVolatility(toNumberOrNull(input.historicalVolatility)),
  ];

  return Math.round(average(scores));
};

const scoreMoat = (moatRating: MoatRating | null, dividendGrowthStreak: number | null): number => {
  const base =
    moatRating === 'WIDE'
      ? 95
      : moatRating === 'NARROW'
        ? 75
        : moatRating === 'NONE'
          ? 45
          : 55;

  const streak = dividendGrowthStreak ?? 0;
  const streakBonus = streak > 20 ? 8 : streak > 10 ? 5 : streak > 5 ? 2 : 0;
  return clamp(base + streakBonus, 0, 100);
};

const labelFromCompositeScore = (
  score: number,
): CompositeScoreResult['label'] => {
  if (score >= 85) return 'ELITE';
  if (score >= 70) return 'STRONG';
  if (score >= 50) return 'WATCH';
  return 'RISK';
};

export const calculateCompositeQualityScore = (
  input: CompositeScoreInput,
): CompositeScoreResult => {
  const components: CompositeScoreComponents = {
    valuation: scoreValuation(toNumberOrNull(input.peRatio)),
    growth: scoreGrowth(input),
    profitability: scoreProfitability(input),
    safety: scoreSafety(input),
    moat: scoreMoat(input.moatRating ?? null, toNumberOrNull(input.dividendGrowthStreak)),
  };

  const weighted =
    components.valuation * COMPOSITE_WEIGHTS.valuation +
    components.growth * COMPOSITE_WEIGHTS.growth +
    components.profitability * COMPOSITE_WEIGHTS.profitability +
    components.safety * COMPOSITE_WEIGHTS.safety +
    components.moat * COMPOSITE_WEIGHTS.moat;

  const compositeScore = Math.round(clamp(weighted, 0, 100));
  const label = labelFromCompositeScore(compositeScore);

  const breakdown: CompositeScoreBreakdownItem[] = [
    {
      component: 'valuation',
      score: components.valuation,
      weight: COMPOSITE_WEIGHTS.valuation,
      weightedContribution: Number(
        (components.valuation * COMPOSITE_WEIGHTS.valuation).toFixed(2),
      ),
      reason: 'P/E based value banding. Lower valuation scores higher.',
    },
    {
      component: 'growth',
      score: components.growth,
      weight: COMPOSITE_WEIGHTS.growth,
      weightedContribution: Number(
        (components.growth * COMPOSITE_WEIGHTS.growth).toFixed(2),
      ),
      reason: 'QoQ and YoY growth across revenue, income, EPS, and free cash flow.',
    },
    {
      component: 'profitability',
      score: components.profitability,
      weight: COMPOSITE_WEIGHTS.profitability,
      weightedContribution: Number(
        (components.profitability * COMPOSITE_WEIGHTS.profitability).toFixed(2),
      ),
      reason: 'ROE and margin quality (gross, operating, net, free cash flow).',
    },
    {
      component: 'safety',
      score: components.safety,
      weight: COMPOSITE_WEIGHTS.safety,
      weightedContribution: Number((components.safety * COMPOSITE_WEIGHTS.safety).toFixed(2)),
      reason: 'Leverage, payout ratio, dividend safety, and volatility.',
    },
    {
      component: 'moat',
      score: components.moat,
      weight: COMPOSITE_WEIGHTS.moat,
      weightedContribution: Number((components.moat * COMPOSITE_WEIGHTS.moat).toFixed(2)),
      reason: 'Competitive moat with dividend growth streak bonus.',
    },
  ];

  return {
    compositeScore,
    components,
    weights: COMPOSITE_WEIGHTS,
    label,
    breakdown,
  };
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
