import { MoatRating, Prisma, Verdict } from '@prisma/client';
import { Request, Response, Router } from 'express';
import { prisma } from '../lib/prisma';
import {
  ExternalCompanyMatch,
  ExternalFinancialRow,
  ExternalNewsItem,
  ExternalQuote,
  externalDataService,
} from '../services/externalDataService';
import { calculateAssetScoreDetails, calculateCompositeQualityScore } from '../services/scoringService';

export type AssetDbClient = Pick<typeof prisma, 'asset'>;

export type ExternalDataClient = {
  searchCompanies: (query: string) => Promise<ExternalCompanyMatch[]>;
  getCompanyProfile: (symbol: string) => Promise<ExternalCompanyMatch | null>;
  getFinancialStatements: (symbol: string) => Promise<ExternalFinancialRow[]>;
  getQuote: (symbol: string) => Promise<ExternalQuote | null>;
  getNews: (symbol: string) => Promise<ExternalNewsItem[]>;
};

type AssetWithFinancials = Prisma.AssetGetPayload<{
  include: {
    fundamentals: true;
    financials: true;
  };
}>;

type FinancialRowPayload = {
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

type FundamentalsPayload = {
  peRatio: number;
  roe: number;
  debtToEquity: number;
  payoutRatio: number;
  dividendGrowthStreak: number;
  dividendSafetyScore: number;
  moatRating: MoatRating;
  historicalVolatility: number;
  healthRating: number;
  verdict: Verdict;
  snowballScore: number;
};

type PeriodComparisonMetrics = {
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

type AnnualTrendMetrics = {
  sampleYears: number;
  revenueCagrPct: number | null;
  epsCagrPct: number | null;
  freeCashFlowCagrPct: number | null;
};

type AssetMetricsPayload = {
  qoq: PeriodComparisonMetrics | null;
  yoy: PeriodComparisonMetrics | null;
  annualTrend: AnnualTrendMetrics | null;
};

type FinancialMetricCategory =
  | 'Income Statement'
  | 'Cash Flow'
  | 'Balance Sheet'
  | 'Per Share'
  | 'Margins'
  | 'Returns'
  | 'Leverage'
  | 'Efficiency';

type FinancialMetricUnit = 'USD' | 'PERCENT' | 'RATIO' | 'PER_SHARE' | 'SHARES';

type FinancialMetricRow = {
  key: string;
  category: FinancialMetricCategory;
  metric: string;
  unit: FinancialMetricUnit;
  latestValue: number | null;
  priorQuarterValue: number | null;
  sameQuarterLastYearValue: number | null;
  qoqChangePct: number | null;
  yoyChangePct: number | null;
};

type ScoreModelPayload = {
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

type ValuationContextPayload = {
  peRatio: number | null;
  pegRatio: number | null;
  epsGrowthPct: number | null;
  valuationBand: 'Attractive' | 'Fair' | 'Expensive' | 'N/A';
  reason: string;
};

const periodPriority: Record<FinancialRowPayload['period'], number> = {
  QUARTERLY: 2,
  ANNUAL: 1,
};

const fiscalPeriodPriority: Record<string, number> = {
  Q4: 4,
  Q3: 3,
  Q2: 2,
  Q1: 1,
  FY: 0,
};

const toPercentage = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
};

const toRatio = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(4));
};

const toRoundedOrNull = (value: number): number | null => {
  if (!Number.isFinite(value)) return null;
  return Number(value.toFixed(2));
};

const growthPct = (current: number, previous: number): number | null => {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return toRoundedOrNull(((current - previous) / Math.abs(previous)) * 100);
};

const deltaPct = (current: number, previous: number): number | null => {
  if (!Number.isFinite(current) || !Number.isFinite(previous)) return null;
  return toRoundedOrNull(current - previous);
};

const sortFinancialRows = (rows: FinancialRowPayload[]): FinancialRowPayload[] =>
  [...rows].sort((a, b) => {
    if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
    if (a.period !== b.period) return periodPriority[b.period] - periodPriority[a.period];
    return (fiscalPeriodPriority[b.fiscalPeriod] ?? 0) - (fiscalPeriodPriority[a.fiscalPeriod] ?? 0);
  });

const toFinancialPayloadRow = (
  row: Omit<
    FinancialRowPayload,
    | 'grossMarginPct'
    | 'operatingMarginPct'
    | 'netMarginPct'
    | 'debtToAssetsPct'
    | 'freeCashFlowMarginPct'
    | 'operatingCashFlowMarginPct'
    | 'debtToEquityRatio'
    | 'currentRatio'
    | 'returnOnAssetsPct'
    | 'returnOnEquityPct'
    | 'capexToRevenuePct'
    | 'sbcToRevenuePct'
    | 'assetTurnoverRatio'
    | 'fcfConversionPct'
    | 'interestCoverageRatio'
  >,
): FinancialRowPayload => ({
  ...row,
  grossMarginPct: toPercentage(row.grossProfit, row.revenue),
  operatingMarginPct: toPercentage(row.operatingIncome, row.revenue),
  netMarginPct: toPercentage(row.netIncome, row.revenue),
  debtToAssetsPct: toPercentage(row.totalLiabilities, row.totalAssets),
  freeCashFlowMarginPct: toPercentage(row.freeCashFlow, row.revenue),
  operatingCashFlowMarginPct: toPercentage(row.operatingCashFlow, row.revenue),
  debtToEquityRatio: toRatio(row.totalLiabilities, row.totalEquity),
  currentRatio: toRatio(row.currentAssets, row.currentLiabilities),
  returnOnAssetsPct: toPercentage(row.netIncome, row.totalAssets),
  returnOnEquityPct: toPercentage(row.netIncome, row.totalEquity),
  capexToRevenuePct: toPercentage(row.capitalExpenditures, row.revenue),
  sbcToRevenuePct: toPercentage(row.stockBasedCompensation, row.revenue),
  assetTurnoverRatio: toRatio(row.revenue, row.totalAssets),
  fcfConversionPct: toPercentage(row.freeCashFlow, row.netIncome),
  interestCoverageRatio: toRatio(row.operatingIncome, Math.abs(row.interestExpense)),
});

const fromLocalFinancialRows = (asset: AssetWithFinancials): FinancialRowPayload[] =>
  sortFinancialRows(
    asset.financials.map((item) =>
      toFinancialPayloadRow({
        fiscalYear: item.fiscal_year,
        fiscalPeriod: item.fiscal_period,
        period: item.period,
        revenue: item.revenue,
        grossProfit: item.gross_profit,
        operatingIncome: item.operating_income,
        netIncome: item.net_income,
        eps: item.eps,
        operatingCashFlow: 0,
        capitalExpenditures: 0,
        freeCashFlow: item.free_cash_flow,
        stockBasedCompensation: 0,
        dilutedSharesOutstanding: 0,
        researchAndDevelopmentExpense: 0,
        sellingGeneralAdministrativeExpense: 0,
        totalAssets: item.total_assets,
        currentAssets: 0,
        cashAndEquivalents: 0,
        totalLiabilities: item.total_liabilities,
        currentLiabilities: 0,
        longTermDebt: 0,
        totalEquity: item.total_equity,
        interestExpense: 0,
        dividendsPerShare: item.dividends_per_share,
      }),
    ),
  );

const fromExternalFinancialRows = (rows: ExternalFinancialRow[]): FinancialRowPayload[] =>
  sortFinancialRows(
    rows.map((item) =>
      toFinancialPayloadRow({
        fiscalYear: item.fiscalYear,
        fiscalPeriod: item.fiscalPeriod,
        period: item.period,
        revenue: item.revenue,
        grossProfit: item.grossProfit,
        operatingIncome: item.operatingIncome,
        netIncome: item.netIncome,
        eps: item.eps,
        operatingCashFlow: item.operatingCashFlow,
        capitalExpenditures: item.capitalExpenditures,
        freeCashFlow: item.freeCashFlow,
        stockBasedCompensation: item.stockBasedCompensation,
        dilutedSharesOutstanding: item.dilutedSharesOutstanding,
        researchAndDevelopmentExpense: item.researchAndDevelopmentExpense,
        sellingGeneralAdministrativeExpense: item.sellingGeneralAdministrativeExpense,
        totalAssets: item.totalAssets,
        currentAssets: item.currentAssets,
        cashAndEquivalents: item.cashAndEquivalents,
        totalLiabilities: item.totalLiabilities,
        currentLiabilities: item.currentLiabilities,
        longTermDebt: item.longTermDebt,
        totalEquity: item.totalEquity,
        interestExpense: item.interestExpense,
        dividendsPerShare: item.dividendsPerShare,
      }),
    ),
  );

const fromLocalFundamentals = (asset: AssetWithFinancials): FundamentalsPayload | null =>
  asset.fundamentals
    ? {
        peRatio: asset.fundamentals.pe_ratio,
        roe: asset.fundamentals.roe,
        debtToEquity: asset.fundamentals.debt_to_equity,
        payoutRatio: asset.fundamentals.payout_ratio,
        dividendGrowthStreak: asset.fundamentals.dividend_growth_streak,
        dividendSafetyScore: asset.fundamentals.dividend_safety_score,
        moatRating: asset.fundamentals.moat_rating,
        historicalVolatility: asset.fundamentals.historical_volatility,
        healthRating: asset.fundamentals.health_rating,
        verdict: asset.fundamentals.verdict,
        snowballScore: asset.fundamentals.calculated_score,
      }
    : null;

const estimateDividendGrowthStreak = (rows: FinancialRowPayload[]): number => {
  const annualRows = rows
    .filter((row) => row.period === 'ANNUAL')
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  if (annualRows.length === 0) return 0;

  let streak = 0;
  let previousDividend = 0;

  for (const row of annualRows) {
    const dividend = row.dividendsPerShare;
    if (dividend <= 0) {
      streak = 0;
      previousDividend = 0;
      continue;
    }

    if (previousDividend === 0) {
      streak = 1;
      previousDividend = dividend;
      continue;
    }

    if (dividend >= previousDividend) {
      streak += 1;
    } else {
      streak = 1;
    }
    previousDividend = dividend;
  }

  return streak;
};

const deriveFundamentals = (
  rows: FinancialRowPayload[],
  quotePrice: number | null,
): FundamentalsPayload | null => {
  if (rows.length === 0) return null;

  const incomeRow = rows.find((row) => row.eps > 0 || row.netIncome !== 0) ?? rows[0];
  const balanceRow = rows.find((row) => row.totalEquity !== 0 || row.totalLiabilities !== 0) ?? rows[0];
  const dividendRow = rows.find((row) => row.dividendsPerShare !== 0 || row.eps !== 0) ?? incomeRow;

  const peRatio =
    quotePrice !== null && incomeRow.eps > 0 ? Number((quotePrice / incomeRow.eps).toFixed(2)) : 0;

  const roe =
    balanceRow.totalEquity !== 0
      ? Number(((incomeRow.netIncome / balanceRow.totalEquity) * 100).toFixed(2))
      : 8;

  let debtToEquity = 2.5;
  if (balanceRow.totalEquity !== 0) {
    if (balanceRow.totalLiabilities === 0) {
      debtToEquity = 1.2;
    } else {
      debtToEquity = Number((balanceRow.totalLiabilities / balanceRow.totalEquity).toFixed(2));
    }
  }

  let dividendSafetyScore = 55;
  let payoutRatio = 85;
  if (dividendRow.dividendsPerShare <= 0) {
    dividendSafetyScore = 50;
  } else if (dividendRow.eps > 0) {
    payoutRatio = (dividendRow.dividendsPerShare / dividendRow.eps) * 100;
    if (payoutRatio <= 40) dividendSafetyScore = 90;
    else if (payoutRatio <= 60) dividendSafetyScore = 75;
    else if (payoutRatio <= 80) dividendSafetyScore = 55;
    else dividendSafetyScore = 30;
  }

  const dividendGrowthStreak = estimateDividendGrowthStreak(rows);
  const moatRating: MoatRating = 'NONE';
  const historicalVolatility = 0.35;

  const details = calculateAssetScoreDetails({
    debt_to_equity: debtToEquity,
    payout_ratio: payoutRatio,
    dividend_growth_streak: dividendGrowthStreak,
    moat_rating: moatRating,
  });

  return {
    peRatio,
    roe,
    debtToEquity,
    payoutRatio: Number(payoutRatio.toFixed(2)),
    dividendGrowthStreak,
    dividendSafetyScore,
    moatRating,
    historicalVolatility,
    healthRating: details.healthRating,
    verdict: details.verdict,
    snowballScore: details.score,
  };
};

const buildPeriodComparison = (
  latest: FinancialRowPayload,
  previous: FinancialRowPayload,
): PeriodComparisonMetrics => {
  const latestFcfMargin = toPercentage(latest.freeCashFlow, latest.revenue);
  const previousFcfMargin = toPercentage(previous.freeCashFlow, previous.revenue);

  return {
    latestLabel: `${latest.fiscalYear} ${latest.fiscalPeriod}`,
    previousLabel: `${previous.fiscalYear} ${previous.fiscalPeriod}`,
    revenueGrowthPct: growthPct(latest.revenue, previous.revenue),
    netIncomeGrowthPct: growthPct(latest.netIncome, previous.netIncome),
    epsGrowthPct: growthPct(latest.eps, previous.eps),
    freeCashFlowGrowthPct: growthPct(latest.freeCashFlow, previous.freeCashFlow),
    operatingCashFlowGrowthPct: growthPct(latest.operatingCashFlow, previous.operatingCashFlow),
    stockBasedCompensationGrowthPct: growthPct(
      latest.stockBasedCompensation,
      previous.stockBasedCompensation,
    ),
    grossMarginDeltaPct: deltaPct(latest.grossMarginPct, previous.grossMarginPct),
    operatingMarginDeltaPct: deltaPct(latest.operatingMarginPct, previous.operatingMarginPct),
    netMarginDeltaPct: deltaPct(latest.netMarginPct, previous.netMarginPct),
    freeCashFlowMarginDeltaPct: deltaPct(latestFcfMargin, previousFcfMargin),
    debtToEquityDelta: deltaPct(latest.debtToEquityRatio, previous.debtToEquityRatio),
    currentRatioDelta: deltaPct(latest.currentRatio, previous.currentRatio),
    interestCoverageDelta: deltaPct(latest.interestCoverageRatio, previous.interestCoverageRatio),
  };
};

const cagrPct = (latestValue: number, baseValue: number, years: number): number | null => {
  if (
    !Number.isFinite(latestValue) ||
    !Number.isFinite(baseValue) ||
    baseValue <= 0 ||
    latestValue <= 0 ||
    years <= 0
  ) {
    return null;
  }

  return toRoundedOrNull((Math.pow(latestValue / baseValue, 1 / years) - 1) * 100);
};

const buildAnnualTrend = (rows: FinancialRowPayload[]): AnnualTrendMetrics | null => {
  const annualRows = rows
    .filter((row) => row.period === 'ANNUAL')
    .sort((a, b) => a.fiscalYear - b.fiscalYear);

  if (annualRows.length < 2) return null;

  const latest = annualRows[annualRows.length - 1];
  const base = annualRows[Math.max(0, annualRows.length - 4)];
  const sampleYears = latest.fiscalYear - base.fiscalYear;
  if (sampleYears <= 0) return null;

  return {
    sampleYears,
    revenueCagrPct: cagrPct(latest.revenue, base.revenue, sampleYears),
    epsCagrPct: cagrPct(latest.eps, base.eps, sampleYears),
    freeCashFlowCagrPct: cagrPct(latest.freeCashFlow, base.freeCashFlow, sampleYears),
  };
};

const buildAssetMetrics = (rows: FinancialRowPayload[]): AssetMetricsPayload => {
  const quarterlyRows = rows
    .filter((row) => row.period === 'QUARTERLY')
    .sort((a, b) => {
      if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
      return (fiscalPeriodPriority[b.fiscalPeriod] ?? 0) - (fiscalPeriodPriority[a.fiscalPeriod] ?? 0);
    });

  const latestQuarter = quarterlyRows[0];
  const previousQuarter = quarterlyRows[1];
  const yoyQuarter = latestQuarter
    ? quarterlyRows.find(
        (row) =>
          row.fiscalYear === latestQuarter.fiscalYear - 1 &&
          row.fiscalPeriod === latestQuarter.fiscalPeriod,
      )
    : undefined;

  return {
    qoq:
      latestQuarter && previousQuarter
        ? buildPeriodComparison(latestQuarter, previousQuarter)
        : null,
    yoy:
      latestQuarter && yoyQuarter
        ? buildPeriodComparison(latestQuarter, yoyQuarter)
        : null,
    annualTrend: buildAnnualTrend(rows),
  };
};

type MetricDefinition = {
  key: string;
  category: FinancialMetricCategory;
  metric: string;
  unit: FinancialMetricUnit;
  getter: (row: FinancialRowPayload) => number;
  deltaMode?: 'growth' | 'delta';
};

const metricDefinitions: MetricDefinition[] = [
  { key: 'revenue', category: 'Income Statement', metric: 'Revenue', unit: 'USD', getter: (row) => row.revenue },
  { key: 'gross_profit', category: 'Income Statement', metric: 'Gross Profit', unit: 'USD', getter: (row) => row.grossProfit },
  { key: 'operating_income', category: 'Income Statement', metric: 'Operating Income', unit: 'USD', getter: (row) => row.operatingIncome },
  { key: 'net_income', category: 'Income Statement', metric: 'Net Income', unit: 'USD', getter: (row) => row.netIncome },
  { key: 'r_and_d', category: 'Income Statement', metric: 'R&D Expense', unit: 'USD', getter: (row) => row.researchAndDevelopmentExpense },
  { key: 'sga', category: 'Income Statement', metric: 'SG&A Expense', unit: 'USD', getter: (row) => row.sellingGeneralAdministrativeExpense },
  { key: 'operating_cash_flow', category: 'Cash Flow', metric: 'Operating Cash Flow', unit: 'USD', getter: (row) => row.operatingCashFlow },
  { key: 'capex', category: 'Cash Flow', metric: 'Capital Expenditures', unit: 'USD', getter: (row) => row.capitalExpenditures },
  { key: 'free_cash_flow', category: 'Cash Flow', metric: 'Free Cash Flow', unit: 'USD', getter: (row) => row.freeCashFlow },
  { key: 'stock_based_comp', category: 'Cash Flow', metric: 'Stock-Based Compensation', unit: 'USD', getter: (row) => row.stockBasedCompensation },
  { key: 'total_assets', category: 'Balance Sheet', metric: 'Total Assets', unit: 'USD', getter: (row) => row.totalAssets },
  { key: 'cash_equiv', category: 'Balance Sheet', metric: 'Cash & Equivalents', unit: 'USD', getter: (row) => row.cashAndEquivalents },
  { key: 'current_assets', category: 'Balance Sheet', metric: 'Current Assets', unit: 'USD', getter: (row) => row.currentAssets },
  { key: 'total_liabilities', category: 'Balance Sheet', metric: 'Total Liabilities', unit: 'USD', getter: (row) => row.totalLiabilities },
  { key: 'current_liabilities', category: 'Balance Sheet', metric: 'Current Liabilities', unit: 'USD', getter: (row) => row.currentLiabilities },
  { key: 'long_term_debt', category: 'Balance Sheet', metric: 'Long-Term Debt', unit: 'USD', getter: (row) => row.longTermDebt },
  { key: 'total_equity', category: 'Balance Sheet', metric: 'Total Equity', unit: 'USD', getter: (row) => row.totalEquity },
  { key: 'eps', category: 'Per Share', metric: 'EPS', unit: 'PER_SHARE', getter: (row) => row.eps },
  { key: 'dividends_per_share', category: 'Per Share', metric: 'Dividends Per Share', unit: 'PER_SHARE', getter: (row) => row.dividendsPerShare },
  { key: 'diluted_shares', category: 'Per Share', metric: 'Diluted Shares Outstanding', unit: 'SHARES', getter: (row) => row.dilutedSharesOutstanding },
  { key: 'gross_margin', category: 'Margins', metric: 'Gross Margin', unit: 'PERCENT', getter: (row) => row.grossMarginPct, deltaMode: 'delta' },
  { key: 'operating_margin', category: 'Margins', metric: 'Operating Margin', unit: 'PERCENT', getter: (row) => row.operatingMarginPct, deltaMode: 'delta' },
  { key: 'net_margin', category: 'Margins', metric: 'Net Margin', unit: 'PERCENT', getter: (row) => row.netMarginPct, deltaMode: 'delta' },
  { key: 'operating_cash_flow_margin', category: 'Margins', metric: 'Operating Cash Flow Margin', unit: 'PERCENT', getter: (row) => row.operatingCashFlowMarginPct, deltaMode: 'delta' },
  { key: 'free_cash_flow_margin', category: 'Margins', metric: 'Free Cash Flow Margin', unit: 'PERCENT', getter: (row) => row.freeCashFlowMarginPct, deltaMode: 'delta' },
  { key: 'sbc_to_revenue', category: 'Margins', metric: 'SBC / Revenue', unit: 'PERCENT', getter: (row) => row.sbcToRevenuePct, deltaMode: 'delta' },
  { key: 'capex_to_revenue', category: 'Margins', metric: 'Capex / Revenue', unit: 'PERCENT', getter: (row) => row.capexToRevenuePct, deltaMode: 'delta' },
  { key: 'return_on_assets', category: 'Returns', metric: 'Return on Assets', unit: 'PERCENT', getter: (row) => row.returnOnAssetsPct, deltaMode: 'delta' },
  { key: 'return_on_equity', category: 'Returns', metric: 'Return on Equity', unit: 'PERCENT', getter: (row) => row.returnOnEquityPct, deltaMode: 'delta' },
  { key: 'debt_to_assets', category: 'Leverage', metric: 'Debt / Assets', unit: 'PERCENT', getter: (row) => row.debtToAssetsPct, deltaMode: 'delta' },
  { key: 'debt_to_equity', category: 'Leverage', metric: 'Debt / Equity', unit: 'RATIO', getter: (row) => row.debtToEquityRatio, deltaMode: 'delta' },
  { key: 'current_ratio', category: 'Leverage', metric: 'Current Ratio', unit: 'RATIO', getter: (row) => row.currentRatio, deltaMode: 'delta' },
  { key: 'interest_coverage', category: 'Leverage', metric: 'Interest Coverage', unit: 'RATIO', getter: (row) => row.interestCoverageRatio, deltaMode: 'delta' },
  { key: 'asset_turnover', category: 'Efficiency', metric: 'Asset Turnover', unit: 'RATIO', getter: (row) => row.assetTurnoverRatio, deltaMode: 'delta' },
  { key: 'fcf_conversion', category: 'Efficiency', metric: 'FCF Conversion', unit: 'PERCENT', getter: (row) => row.fcfConversionPct, deltaMode: 'delta' },
];

const pickQuarterRows = (
  rows: FinancialRowPayload[],
): {
  latest: FinancialRowPayload | null;
  priorQuarter: FinancialRowPayload | null;
  sameQuarterLastYear: FinancialRowPayload | null;
} => {
  const quarterlyRows = rows
    .filter((row) => row.period === 'QUARTERLY')
    .sort((a, b) => {
      if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
      return (fiscalPeriodPriority[b.fiscalPeriod] ?? 0) - (fiscalPeriodPriority[a.fiscalPeriod] ?? 0);
    });

  const latest = quarterlyRows[0] ?? rows[0] ?? null;
  const priorQuarter = quarterlyRows[1] ?? null;
  const sameQuarterLastYear = latest
    ? quarterlyRows.find(
        (row) =>
          row.fiscalYear === latest.fiscalYear - 1 &&
          row.fiscalPeriod === latest.fiscalPeriod,
      ) ?? null
    : null;

  return {
    latest,
    priorQuarter,
    sameQuarterLastYear,
  };
};

const computeMetricChange = (
  mode: 'growth' | 'delta',
  latestValue: number | null,
  previousValue: number | null,
): number | null => {
  if (latestValue === null || previousValue === null) return null;
  if (mode === 'delta') return deltaPct(latestValue, previousValue);
  return growthPct(latestValue, previousValue);
};

const buildFinancialMetricsTable = (
  rows: FinancialRowPayload[],
  peRatio: number | null,
): FinancialMetricRow[] => {
  const { latest, priorQuarter, sameQuarterLastYear } = pickQuarterRows(rows);
  if (!latest) return [];

  const baseRows = metricDefinitions.map((definition) => {
    const latestValue = definition.getter(latest);
    const priorValue = priorQuarter ? definition.getter(priorQuarter) : null;
    const yoyValue = sameQuarterLastYear ? definition.getter(sameQuarterLastYear) : null;
    const mode = definition.deltaMode ?? 'growth';

    return {
      key: definition.key,
      category: definition.category,
      metric: definition.metric,
      unit: definition.unit,
      latestValue: Number.isFinite(latestValue) ? latestValue : null,
      priorQuarterValue: priorValue !== null && Number.isFinite(priorValue) ? priorValue : null,
      sameQuarterLastYearValue: yoyValue !== null && Number.isFinite(yoyValue) ? yoyValue : null,
      qoqChangePct: computeMetricChange(mode, latestValue, priorValue),
      yoyChangePct: computeMetricChange(mode, latestValue, yoyValue),
    };
  });

  const findQuarterMatch = (fiscalYear: number, fiscalPeriod: string): FinancialRowPayload | null =>
    rows.find(
      (row) =>
        row.period === 'QUARTERLY' &&
        row.fiscalYear === fiscalYear &&
        row.fiscalPeriod === fiscalPeriod,
    ) ?? null;

  const latestEpsGrowth = sameQuarterLastYear
    ? growthPct(latest.eps, sameQuarterLastYear.eps)
    : null;
  const priorSameQuarterLastYear = priorQuarter
    ? findQuarterMatch(priorQuarter.fiscalYear - 1, priorQuarter.fiscalPeriod)
    : null;
  const priorEpsGrowth = priorQuarter && priorSameQuarterLastYear
    ? growthPct(priorQuarter.eps, priorSameQuarterLastYear.eps)
    : null;

  const latestPeg = derivePegRatio(peRatio, latestEpsGrowth);
  const priorPeg = derivePegRatio(peRatio, priorEpsGrowth);

  baseRows.push({
    key: 'peg_ratio',
    category: 'Per Share',
    metric: 'PEG Ratio',
    unit: 'RATIO',
    latestValue: latestPeg,
    priorQuarterValue: priorPeg,
    sameQuarterLastYearValue: null,
    qoqChangePct: computeMetricChange('growth', latestPeg, priorPeg),
    yoyChangePct: null,
  });

  return baseRows;
};

const toNullableNumber = (value: number | null | undefined): number | null =>
  typeof value === 'number' && Number.isFinite(value) ? value : null;

const derivePegRatio = (peRatio: number | null, epsGrowthPct: number | null): number | null => {
  if (peRatio === null || epsGrowthPct === null || peRatio <= 0 || epsGrowthPct <= 0) return null;
  return toRoundedOrNull(peRatio / epsGrowthPct);
};

const classifyValuationBand = (
  peRatio: number | null,
  pegRatio: number | null,
): 'Attractive' | 'Fair' | 'Expensive' | 'N/A' => {
  if (peRatio === null || peRatio <= 0) return 'N/A';

  if (pegRatio !== null) {
    if (peRatio <= 20 && pegRatio <= 1.2) return 'Attractive';
    if (peRatio <= 30 && pegRatio <= 2) return 'Fair';
    return 'Expensive';
  }

  if (peRatio <= 15) return 'Attractive';
  if (peRatio <= 25) return 'Fair';
  return 'Expensive';
};

const buildValuationContext = (
  fundamentals: FundamentalsPayload | null,
  metrics: AssetMetricsPayload,
): ValuationContextPayload => {
  const peRatio = toNullableNumber(fundamentals?.peRatio ?? null);
  const epsGrowthPct = toNullableNumber(
    metrics.yoy?.epsGrowthPct ??
      metrics.qoq?.epsGrowthPct ??
      metrics.annualTrend?.epsCagrPct ??
      null,
  );
  const pegRatio = derivePegRatio(peRatio, epsGrowthPct);
  const valuationBand = classifyValuationBand(peRatio, pegRatio);

  let reason = 'Insufficient valuation data.';
  if (peRatio !== null && peRatio > 0) {
    if (pegRatio !== null) {
      reason = `P/E ${peRatio.toFixed(2)} and PEG ${pegRatio.toFixed(2)} using EPS growth ${epsGrowthPct?.toFixed(2)}%.`;
    } else if (epsGrowthPct !== null && epsGrowthPct <= 0) {
      reason = `P/E ${peRatio.toFixed(2)} with non-positive EPS growth (${epsGrowthPct.toFixed(2)}%) keeps valuation risk elevated.`;
    } else {
      reason = `P/E ${peRatio.toFixed(2)} (PEG unavailable without positive EPS growth history).`;
    }
  }

  return {
    peRatio,
    pegRatio,
    epsGrowthPct,
    valuationBand,
    reason,
  };
};

const buildScoreModel = (
  fundamentals: FundamentalsPayload | null,
  financials: FinancialRowPayload[],
  metrics: AssetMetricsPayload,
): ScoreModelPayload | null => {
  if (!fundamentals) return null;

  const quarterlyLatest = financials.find((row) => row.period === 'QUARTERLY') ?? financials[0];
  const latestFinancial = quarterlyLatest ?? financials[0];
  const annualTrend = metrics.annualTrend;
  const valuationContext = buildValuationContext(fundamentals, metrics);

  const result = calculateCompositeQualityScore({
    peRatio: fundamentals.peRatio,
    pegRatio: valuationContext.pegRatio,
    roe: fundamentals.roe,
    returnOnAssetsPct: latestFinancial?.returnOnAssetsPct ?? null,
    debtToEquity: fundamentals.debtToEquity,
    debtToAssetsPct: latestFinancial?.debtToAssetsPct ?? null,
    currentRatio: latestFinancial?.currentRatio ?? null,
    interestCoverageRatio: latestFinancial?.interestCoverageRatio ?? null,
    assetTurnoverRatio: latestFinancial?.assetTurnoverRatio ?? null,
    fcfConversionPct: latestFinancial?.fcfConversionPct ?? null,
    sbcToRevenuePct: latestFinancial?.sbcToRevenuePct ?? null,
    capexToRevenuePct: latestFinancial?.capexToRevenuePct ?? null,
    payoutRatio: fundamentals.payoutRatio,
    dividendSafetyScore: fundamentals.dividendSafetyScore,
    moatRating: fundamentals.moatRating,
    historicalVolatility: fundamentals.historicalVolatility,
    dividendGrowthStreak: fundamentals.dividendGrowthStreak,
    qoqRevenueGrowthPct: metrics.qoq?.revenueGrowthPct ?? null,
    qoqNetIncomeGrowthPct: metrics.qoq?.netIncomeGrowthPct ?? null,
    qoqEpsGrowthPct: metrics.qoq?.epsGrowthPct ?? null,
    qoqFreeCashFlowGrowthPct: metrics.qoq?.freeCashFlowGrowthPct ?? null,
    qoqOperatingCashFlowGrowthPct: metrics.qoq?.operatingCashFlowGrowthPct ?? null,
    qoqStockBasedCompensationGrowthPct: metrics.qoq?.stockBasedCompensationGrowthPct ?? null,
    yoyRevenueGrowthPct: metrics.yoy?.revenueGrowthPct ?? null,
    yoyNetIncomeGrowthPct: metrics.yoy?.netIncomeGrowthPct ?? null,
    yoyEpsGrowthPct: metrics.yoy?.epsGrowthPct ?? null,
    yoyFreeCashFlowGrowthPct: metrics.yoy?.freeCashFlowGrowthPct ?? null,
    yoyOperatingCashFlowGrowthPct: metrics.yoy?.operatingCashFlowGrowthPct ?? null,
    yoyStockBasedCompensationGrowthPct: metrics.yoy?.stockBasedCompensationGrowthPct ?? null,
    revenueCagrPct: annualTrend?.revenueCagrPct ?? null,
    epsCagrPct: annualTrend?.epsCagrPct ?? null,
    freeCashFlowCagrPct: annualTrend?.freeCashFlowCagrPct ?? null,
    grossMarginPct: latestFinancial?.grossMarginPct ?? null,
    operatingMarginPct: latestFinancial?.operatingMarginPct ?? null,
    netMarginPct: latestFinancial?.netMarginPct ?? null,
    operatingCashFlowMarginPct: latestFinancial?.operatingCashFlowMarginPct ?? null,
    freeCashFlowMarginPct: latestFinancial?.freeCashFlowMarginPct ?? null,
  });

  return {
    compositeScore: result.compositeScore,
    label: result.label,
    components: result.components,
    weights: result.weights,
    breakdown: result.breakdown,
  };
};

const classifyMoat = (moatRating: string | null): string => {
  if (moatRating === 'WIDE') return 'Strong competitive protection';
  if (moatRating === 'NARROW') return 'Moderate competitive edge';
  if (moatRating === 'NONE') return 'Limited structural advantage';
  return 'N/A';
};

export const createAssetRouter = (
  db: AssetDbClient = prisma,
  externalClient: ExternalDataClient = externalDataService,
): Router => {
  const router = Router();

  router.get('/api/assets/search', async (req: Request, res: Response) => {
    const query = String(req.query.query ?? '').trim();

    if (query.length === 0) {
      return res.json({ count: 0, results: [] });
    }

    try {
      const [localAssets, externalMatches] = await Promise.all([
        db.asset.findMany({
          where: {
            OR: [
              { symbol: { contains: query, mode: 'insensitive' } },
              { name: { contains: query, mode: 'insensitive' } },
            ],
          },
          include: {
            fundamentals: true,
          },
          orderBy: {
            symbol: 'asc',
          },
          take: 20,
        }),
        externalClient.searchCompanies(query),
      ]);

      const merged = new Map<
        string,
        {
          symbol: string;
          name: string;
          currentPrice: number | null;
          snowballScore: number | null;
          peRatio: number | null;
          moatRating: MoatRating | null;
          source: 'local' | 'sec';
        }
      >();

      for (const asset of localAssets) {
        merged.set(asset.symbol, {
          symbol: asset.symbol,
          name: asset.name,
          currentPrice: asset.currentPrice,
          snowballScore: asset.fundamentals?.health_rating ?? asset.fundamentals?.calculated_score ?? null,
          peRatio: asset.fundamentals?.pe_ratio ?? null,
          moatRating: asset.fundamentals?.moat_rating ?? asset.moat_rating,
          source: 'local',
        });
      }

      for (const external of externalMatches) {
        if (merged.has(external.symbol)) continue;

        merged.set(external.symbol, {
          symbol: external.symbol,
          name: external.name,
          currentPrice: null,
          snowballScore: null,
          peRatio: null,
          moatRating: null,
          source: 'sec',
        });
      }

      const results = [...merged.values()].slice(0, 20);
      return res.json({ count: results.length, results });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to search assets', details });
    }
  });

  router.get('/api/assets/:symbol/financials', async (req: Request, res: Response) => {
    const symbol = String(req.params.symbol ?? '').trim().toUpperCase();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol path parameter is required' });
    }

    try {
      const [asset, profile, externalRows, quote] = await Promise.all([
        db.asset.findFirst({
          where: { symbol },
          include: {
            fundamentals: true,
            financials: {
              orderBy: [{ fiscal_year: 'desc' }, { fiscal_period: 'desc' }],
            },
          },
        }) as Promise<AssetWithFinancials | null>,
        externalClient.getCompanyProfile(symbol),
        externalClient.getFinancialStatements(symbol),
        externalClient.getQuote(symbol),
      ]);

      if (!asset && !profile) {
        return res.status(404).json({ error: `Asset ${symbol} not found` });
      }

      const financials = externalRows.length > 0
        ? fromExternalFinancialRows(externalRows)
        : asset
          ? fromLocalFinancialRows(asset)
          : [];

      const currentPrice = quote?.price ?? asset?.currentPrice ?? 0;
      const fundamentals = asset
        ? fromLocalFundamentals(asset) ?? deriveFundamentals(financials, currentPrice)
        : deriveFundamentals(financials, currentPrice);
      const metrics = buildAssetMetrics(financials);
      const scoreModel = buildScoreModel(fundamentals, financials, metrics);
      const financialMetricTable = buildFinancialMetricsTable(financials, fundamentals?.peRatio ?? null);
      const valuationContext = buildValuationContext(fundamentals, metrics);

      return res.json({
        symbol,
        name: asset?.name ?? profile?.name ?? symbol,
        currentPrice,
        fundamentals,
        metrics,
        scoreModel,
        valuationContext,
        financialMetricTable,
        financials,
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch asset financials', details });
    }
  });

  router.get('/api/assets/:symbol/comprehensive', async (req: Request, res: Response) => {
    const symbol = String(req.params.symbol ?? '').trim().toUpperCase();
    if (!symbol) {
      return res.status(400).json({ error: 'symbol path parameter is required' });
    }

    try {
      const [asset, profile, externalRows, quote, news] = await Promise.all([
        db.asset.findFirst({
          where: { symbol },
          include: {
            fundamentals: true,
            financials: {
              orderBy: [{ fiscal_year: 'desc' }, { fiscal_period: 'desc' }],
            },
          },
        }) as Promise<AssetWithFinancials | null>,
        externalClient.getCompanyProfile(symbol),
        externalClient.getFinancialStatements(symbol),
        externalClient.getQuote(symbol),
        externalClient.getNews(symbol),
      ]);

      if (!asset && !profile) {
        return res.status(404).json({ error: `Asset ${symbol} not found` });
      }

      const financials = externalRows.length > 0
        ? fromExternalFinancialRows(externalRows)
        : asset
          ? fromLocalFinancialRows(asset)
          : [];

      const currentPrice = quote?.price ?? asset?.currentPrice ?? 0;

      const fundamentals = asset
        ? fromLocalFundamentals(asset) ?? deriveFundamentals(financials, currentPrice)
        : deriveFundamentals(financials, currentPrice);
      const metrics = buildAssetMetrics(financials);
      const scoreModel = buildScoreModel(fundamentals, financials, metrics);
      const financialMetricTable = buildFinancialMetricsTable(financials, fundamentals?.peRatio ?? null);
      const valuationContext = buildValuationContext(fundamentals, metrics);

      const resolvedQuote = quote
        ? {
            ...quote,
            asOf: new Date().toISOString(),
          }
        : {
            symbol,
            price: currentPrice,
            change: 0,
            changePercent: 0,
            marketCap: null,
            currency: 'USD',
            exchange: 'US',
            source: 'local' as const,
            asOf: new Date().toISOString(),
          };

      return res.json({
        symbol,
        name: asset?.name ?? profile?.name ?? symbol,
        currentPrice,
        fundamentals,
        quote: resolvedQuote,
        metrics,
        scoreModel,
        valuationContext,
        financialMetricTable,
        insights: {
          moat: classifyMoat(fundamentals?.moatRating ?? null),
          valuation: valuationContext.valuationBand === 'N/A'
            ? 'N/A'
            : `${valuationContext.valuationBand} (${valuationContext.reason})`,
          profitability: fundamentals
            ? fundamentals.roe >= 20
              ? 'High profitability profile'
              : fundamentals.roe >= 10
                ? 'Moderate profitability profile'
                : 'Weak profitability profile'
            : 'N/A',
          balanceSheet: fundamentals
            ? fundamentals.debtToEquity > 2
              ? 'Leverage risk elevated'
              : 'Leverage profile acceptable'
            : 'N/A',
        },
        financials,
        news,
        dataSources: {
          localFundamentals: Boolean(asset?.fundamentals),
          secFinancials: externalRows.length > 0,
          quote: quote?.source ?? 'local',
          news: news.length > 0 ? 'google' : 'none',
        },
      });
    } catch (error) {
      const details = error instanceof Error ? error.message : 'Unknown error';
      return res.status(500).json({ error: 'Failed to fetch comprehensive asset data', details });
    }
  });

  return router;
};

const assetRouter = createAssetRouter();

export default assetRouter;
