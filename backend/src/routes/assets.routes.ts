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
import { calculateAssetScoreDetails } from '../services/scoringService';

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

const toPercentage = (numerator: number, denominator: number): number => {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return 0;
  return Number(((numerator / denominator) * 100).toFixed(2));
};

const toFinancialPayloadRow = (
  row: Omit<FinancialRowPayload, 'grossMarginPct' | 'operatingMarginPct' | 'netMarginPct' | 'debtToAssetsPct'>,
): FinancialRowPayload => ({
  ...row,
  grossMarginPct: toPercentage(row.grossProfit, row.revenue),
  operatingMarginPct: toPercentage(row.operatingIncome, row.revenue),
  netMarginPct: toPercentage(row.netIncome, row.revenue),
  debtToAssetsPct: toPercentage(row.totalLiabilities, row.totalAssets),
});

const fromLocalFinancialRows = (asset: AssetWithFinancials): FinancialRowPayload[] =>
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
      freeCashFlow: item.free_cash_flow,
      totalAssets: item.total_assets,
      totalLiabilities: item.total_liabilities,
      totalEquity: item.total_equity,
      dividendsPerShare: item.dividends_per_share,
    }),
  );

const fromExternalFinancialRows = (rows: ExternalFinancialRow[]): FinancialRowPayload[] =>
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
      freeCashFlow: item.freeCashFlow,
      totalAssets: item.totalAssets,
      totalLiabilities: item.totalLiabilities,
      totalEquity: item.totalEquity,
      dividendsPerShare: item.dividendsPerShare,
    }),
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
        snowballScore: asset.fundamentals.health_rating,
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

const classifyValuation = (peRatio: number | null): string => {
  if (peRatio === null || peRatio <= 0) return 'N/A';
  if (peRatio <= 15) return 'Attractive';
  if (peRatio <= 25) return 'Fair';
  return 'Expensive';
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

      return res.json({
        symbol,
        name: asset?.name ?? profile?.name ?? symbol,
        currentPrice,
        fundamentals,
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
        insights: {
          moat: classifyMoat(fundamentals?.moatRating ?? null),
          valuation: classifyValuation(fundamentals?.peRatio ?? null),
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
