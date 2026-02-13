import { MoatRating, PrismaClient, Verdict } from '@prisma/client';
import {
  ScoringInput,
  calculateAssetScore,
  calculateAssetScoreDetails,
} from '../src/services/scoringService';

const prisma = new PrismaClient();

type SeedFinancialStatement = {
  fiscal_year: number;
  revenue: number;
  gross_profit: number;
  operating_income: number;
  net_income: number;
  eps: number;
  free_cash_flow: number;
  total_assets: number;
  total_liabilities: number;
  total_equity: number;
  dividends_per_share: number;
};

type SeedAsset = {
  symbol: string;
  name: string;
  currentPrice: number;
  quantity: number;
  avgCost: number;
  dripEnabled: boolean;
  fundamentals: ScoringInput & {
    pe_ratio: number;
    roe: number;
    dividend_safety_score: number;
    historical_volatility: number;
  };
  baseRevenue: number;
  annualGrowthRate: number;
  netMargin: number;
  operatingMargin: number;
  grossMargin: number;
  fcfMargin: number;
  assetTurnover: number;
};

const years = [2021, 2022, 2023, 2024, 2025];

const seedAssets: SeedAsset[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 196.2,
    quantity: 42,
    avgCost: 148,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 28,
      roe: 150,
      debt_to_equity: 1.7,
      payout_ratio: 15.7,
      dividend_growth_streak: 12,
      dividend_safety_score: 90,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.26,
    },
    baseRevenue: 365_800,
    annualGrowthRate: 0.054,
    netMargin: 0.253,
    operatingMargin: 0.298,
    grossMargin: 0.442,
    fcfMargin: 0.258,
    assetTurnover: 1.09,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    currentPrice: 424.6,
    quantity: 18,
    avgCost: 302,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 34,
      roe: 38,
      debt_to_equity: 0.5,
      payout_ratio: 27.4,
      dividend_growth_streak: 19,
      dividend_safety_score: 95,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.22,
    },
    baseRevenue: 168_100,
    annualGrowthRate: 0.08,
    netMargin: 0.337,
    operatingMargin: 0.402,
    grossMargin: 0.688,
    fcfMargin: 0.302,
    assetTurnover: 0.56,
  },
  {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    currentPrice: 182.8,
    quantity: 24,
    avgCost: 126,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 24,
      roe: 30,
      debt_to_equity: 0.11,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 80,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.24,
    },
    baseRevenue: 257_600,
    annualGrowthRate: 0.095,
    netMargin: 0.255,
    operatingMargin: 0.293,
    grossMargin: 0.565,
    fcfMargin: 0.247,
    assetTurnover: 0.68,
  },
  {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    currentPrice: 181.1,
    quantity: 28,
    avgCost: 116,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 52,
      roe: 24,
      debt_to_equity: 0.83,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 60,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.31,
    },
    baseRevenue: 469_800,
    annualGrowthRate: 0.109,
    netMargin: 0.071,
    operatingMargin: 0.087,
    grossMargin: 0.477,
    fcfMargin: 0.089,
    assetTurnover: 1.22,
  },
  {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    currentPrice: 738.5,
    quantity: 7,
    avgCost: 312,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 70,
      roe: 64,
      debt_to_equity: 0.21,
      payout_ratio: 1.3,
      dividend_growth_streak: 12,
      dividend_safety_score: 88,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.46,
    },
    baseRevenue: 26_900,
    annualGrowthRate: 0.28,
    netMargin: 0.46,
    operatingMargin: 0.58,
    grossMargin: 0.74,
    fcfMargin: 0.43,
    assetTurnover: 1.05,
  },
  {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    currentPrice: 504.2,
    quantity: 9,
    avgCost: 265,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 27,
      roe: 33,
      debt_to_equity: 0.31,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 72,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.34,
    },
    baseRevenue: 117_900,
    annualGrowthRate: 0.135,
    netMargin: 0.298,
    operatingMargin: 0.347,
    grossMargin: 0.807,
    fcfMargin: 0.31,
    assetTurnover: 0.63,
  },
  {
    symbol: 'V',
    name: 'Visa Inc.',
    currentPrice: 292.4,
    quantity: 14,
    avgCost: 211,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 31,
      roe: 48,
      debt_to_equity: 0.65,
      payout_ratio: 22,
      dividend_growth_streak: 15,
      dividend_safety_score: 92,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.19,
    },
    baseRevenue: 24_100,
    annualGrowthRate: 0.11,
    netMargin: 0.529,
    operatingMargin: 0.668,
    grossMargin: 0.805,
    fcfMargin: 0.59,
    assetTurnover: 0.55,
  },
  {
    symbol: 'MA',
    name: 'Mastercard Incorporated',
    currentPrice: 482.9,
    quantity: 8,
    avgCost: 325,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 35,
      roe: 183,
      debt_to_equity: 2.3,
      payout_ratio: 19,
      dividend_growth_streak: 12,
      dividend_safety_score: 85,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.22,
    },
    baseRevenue: 18_900,
    annualGrowthRate: 0.12,
    netMargin: 0.45,
    operatingMargin: 0.56,
    grossMargin: 0.792,
    fcfMargin: 0.49,
    assetTurnover: 0.47,
  },
  {
    symbol: 'COST',
    name: 'Costco Wholesale Corporation',
    currentPrice: 742.7,
    quantity: 6,
    avgCost: 513,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 48,
      roe: 31,
      debt_to_equity: 0.39,
      payout_ratio: 28,
      dividend_growth_streak: 20,
      dividend_safety_score: 90,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.2,
    },
    baseRevenue: 195_900,
    annualGrowthRate: 0.094,
    netMargin: 0.026,
    operatingMargin: 0.034,
    grossMargin: 0.114,
    fcfMargin: 0.037,
    assetTurnover: 2.7,
  },
  {
    symbol: 'PEP',
    name: 'PepsiCo, Inc.',
    currentPrice: 168.3,
    quantity: 20,
    avgCost: 148,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 23,
      roe: 54,
      debt_to_equity: 2.1,
      payout_ratio: 69,
      dividend_growth_streak: 52,
      dividend_safety_score: 74,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.17,
    },
    baseRevenue: 79_500,
    annualGrowthRate: 0.062,
    netMargin: 0.108,
    operatingMargin: 0.151,
    grossMargin: 0.547,
    fcfMargin: 0.12,
    assetTurnover: 0.84,
  },
  {
    symbol: 'KO',
    name: 'The Coca-Cola Company',
    currentPrice: 63.8,
    quantity: 55,
    avgCost: 54,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 25,
      roe: 42,
      debt_to_equity: 1.58,
      payout_ratio: 74,
      dividend_growth_streak: 62,
      dividend_safety_score: 70,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.16,
    },
    baseRevenue: 41_700,
    annualGrowthRate: 0.05,
    netMargin: 0.226,
    operatingMargin: 0.296,
    grossMargin: 0.597,
    fcfMargin: 0.21,
    assetTurnover: 0.46,
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    currentPrice: 162.1,
    quantity: 19,
    avgCost: 145,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 16,
      roe: 29,
      debt_to_equity: 0.59,
      payout_ratio: 43,
      dividend_growth_streak: 61,
      dividend_safety_score: 96,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.18,
    },
    baseRevenue: 93_800,
    annualGrowthRate: 0.031,
    netMargin: 0.186,
    operatingMargin: 0.243,
    grossMargin: 0.665,
    fcfMargin: 0.214,
    assetTurnover: 0.54,
  },
  {
    symbol: 'PG',
    name: 'The Procter & Gamble Company',
    currentPrice: 167.7,
    quantity: 21,
    avgCost: 139,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 26,
      roe: 33,
      debt_to_equity: 0.66,
      payout_ratio: 63,
      dividend_growth_streak: 67,
      dividend_safety_score: 89,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.16,
    },
    baseRevenue: 80_200,
    annualGrowthRate: 0.047,
    netMargin: 0.184,
    operatingMargin: 0.236,
    grossMargin: 0.506,
    fcfMargin: 0.189,
    assetTurnover: 0.73,
  },
  {
    symbol: 'ABNB',
    name: 'Airbnb, Inc.',
    currentPrice: 158.9,
    quantity: 13,
    avgCost: 117,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 31,
      roe: 43,
      debt_to_equity: 0.29,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 52,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.4,
    },
    baseRevenue: 8_500,
    annualGrowthRate: 0.22,
    netMargin: 0.27,
    operatingMargin: 0.3,
    grossMargin: 0.835,
    fcfMargin: 0.336,
    assetTurnover: 0.75,
  },
  {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    currentPrice: 224.4,
    quantity: 16,
    avgCost: 206,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 68,
      roe: 22,
      debt_to_equity: 0.19,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 40,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.56,
    },
    baseRevenue: 53_800,
    annualGrowthRate: 0.27,
    netMargin: 0.113,
    operatingMargin: 0.137,
    grossMargin: 0.243,
    fcfMargin: 0.096,
    assetTurnover: 1.11,
  },
  {
    symbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    currentPrice: 174.5,
    quantity: 20,
    avgCost: 118,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 49,
      roe: 7,
      debt_to_equity: 0.06,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 55,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.49,
    },
    baseRevenue: 16_400,
    annualGrowthRate: 0.17,
    netMargin: 0.09,
    operatingMargin: 0.118,
    grossMargin: 0.503,
    fcfMargin: 0.11,
    assetTurnover: 0.56,
  },
  {
    symbol: 'NKE',
    name: 'NIKE, Inc.',
    currentPrice: 101.9,
    quantity: 24,
    avgCost: 112,
    dripEnabled: true,
    fundamentals: {
      pe_ratio: 30,
      roe: 33,
      debt_to_equity: 0.96,
      payout_ratio: 42,
      dividend_growth_streak: 22,
      dividend_safety_score: 84,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.31,
    },
    baseRevenue: 46_700,
    annualGrowthRate: 0.061,
    netMargin: 0.106,
    operatingMargin: 0.122,
    grossMargin: 0.448,
    fcfMargin: 0.121,
    assetTurnover: 1.41,
  },
  {
    symbol: 'BABA',
    name: 'Alibaba Group Holding Limited',
    currentPrice: 86.1,
    quantity: 38,
    avgCost: 139,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 12,
      roe: 10,
      debt_to_equity: 0.21,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 48,
      moat_rating: MoatRating.NONE,
      historical_volatility: 0.43,
    },
    baseRevenue: 134_800,
    annualGrowthRate: 0.076,
    netMargin: 0.138,
    operatingMargin: 0.171,
    grossMargin: 0.379,
    fcfMargin: 0.124,
    assetTurnover: 0.67,
  },
  {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc.',
    currentPrice: 27.4,
    quantity: 90,
    avgCost: 18,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 150,
      roe: 4,
      debt_to_equity: 0.05,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 35,
      moat_rating: MoatRating.NONE,
      historical_volatility: 0.58,
    },
    baseRevenue: 1_900,
    annualGrowthRate: 0.2,
    netMargin: 0.094,
    operatingMargin: 0.112,
    grossMargin: 0.805,
    fcfMargin: 0.24,
    assetTurnover: 0.39,
  },
  {
    symbol: 'PENY',
    name: 'PennyX Bio Ventures',
    currentPrice: 1.1,
    quantity: 3500,
    avgCost: 2.8,
    dripEnabled: false,
    fundamentals: {
      pe_ratio: 0,
      roe: -5,
      debt_to_equity: 4.6,
      payout_ratio: 0,
      dividend_growth_streak: 0,
      dividend_safety_score: 5,
      moat_rating: MoatRating.NONE,
      historical_volatility: 0.85,
    },
    baseRevenue: 14,
    annualGrowthRate: -0.05,
    netMargin: -0.66,
    operatingMargin: -0.6,
    grossMargin: 0.08,
    fcfMargin: -0.54,
    assetTurnover: 0.42,
  },
];

const toMoney = (value: number): number => Number(value.toFixed(2));

const buildFinancials = (asset: SeedAsset): SeedFinancialStatement[] =>
  years.map((year, index) => {
    const scale = Math.pow(1 + asset.annualGrowthRate, index);
    const revenue = Math.max(0.1, asset.baseRevenue * scale);
    const grossProfit = revenue * asset.grossMargin;
    const operatingIncome = revenue * asset.operatingMargin;
    const netIncome = revenue * asset.netMargin;
    const freeCashFlow = revenue * asset.fcfMargin;

    const totalAssets = revenue / Math.max(0.12, asset.assetTurnover);
    const totalEquity = asset.fundamentals.debt_to_equity <= 0
      ? totalAssets * 0.55
      : totalAssets / (1 + asset.fundamentals.debt_to_equity);
    const totalLiabilities = Math.max(0, totalAssets - totalEquity);

    const shareCount = Math.max(1, revenue * 2.7);
    const eps = netIncome / shareCount;

    const payoutRatio = Math.max(0, asset.fundamentals.payout_ratio) / 100;
    const dividendsPerShare = eps > 0 ? eps * payoutRatio : 0;

    return {
      fiscal_year: year,
      revenue: toMoney(revenue),
      gross_profit: toMoney(grossProfit),
      operating_income: toMoney(operatingIncome),
      net_income: toMoney(netIncome),
      eps: toMoney(eps),
      free_cash_flow: toMoney(freeCashFlow),
      total_assets: toMoney(totalAssets),
      total_liabilities: toMoney(totalLiabilities),
      total_equity: toMoney(totalEquity),
      dividends_per_share: toMoney(dividendsPerShare),
    };
  });

const buildSnapshots = (): Array<{
  date: Date;
  total_value: number;
  total_dividends: number;
  invested_capital: number;
  future_income: number;
}> => {
  const snapshots: Array<{
    date: Date;
    total_value: number;
    total_dividends: number;
    invested_capital: number;
    future_income: number;
  }> = [];

  const start = new Date('2021-01-01T00:00:00.000Z');
  let runningDividends = 0;

  for (let i = 0; i < 60; i += 1) {
    const date = new Date(start);
    date.setUTCMonth(start.getUTCMonth() + i);
    date.setUTCDate(1);

    const investedCapital = 75_000 + i * 1_450;
    const growthMultiple = 1 + i * 0.012 + i * i * 0.00018;
    const totalValue = investedCapital * growthMultiple;

    const monthDividend = totalValue * 0.00135;
    runningDividends += monthDividend;

    const futureIncome = totalValue * 0.031 + runningDividends * 0.014;

    snapshots.push({
      date,
      total_value: toMoney(totalValue),
      total_dividends: toMoney(runningDividends),
      invested_capital: toMoney(investedCapital),
      future_income: toMoney(futureIncome),
    });
  }

  return snapshots;
};

async function main(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Transaction",
      "Holding",
      "PortfolioSnapshot",
      "AssetFundamentals",
      "AssetFinancials",
      "Asset",
      "Portfolio",
      "User"
    RESTART IDENTITY CASCADE;
  `);

  const user = await prisma.user.create({
    data: {
      email: 'alberto@example.com',
      name: 'Alberto',
      portfolios: {
        create: [
          {
            name: 'Snowball Elite Core',
          },
          {
            name: 'Opportunity Satellite',
          },
        ],
      },
    },
    include: {
      portfolios: true,
    },
  });

  const corePortfolio = user.portfolios[0];
  const satellitePortfolio = user.portfolios[1];

  for (const asset of seedAssets) {
    const details = calculateAssetScoreDetails(asset.fundamentals);
    const calculatedScore = calculateAssetScore(asset.fundamentals);
    const financials = buildFinancials(asset);

    const createdAsset = await prisma.asset.create({
      data: {
        symbol: asset.symbol,
        name: asset.name,
        currentPrice: asset.currentPrice,
        moat_rating: asset.fundamentals.moat_rating,
        dividend_safety: asset.fundamentals.dividend_safety_score,
        fcf_yield: Number((asset.fundamentals.roe / Math.max(1, asset.fundamentals.pe_ratio)).toFixed(2)),
        fundamentals: {
          create: {
            ...asset.fundamentals,
            health_rating: details.healthRating,
            verdict: details.verdict,
            calculated_score: calculatedScore,
          },
        },
        financials: {
          create: financials,
        },
      },
    });

    const portfolioId = details.verdict === Verdict.TRIM ? satellitePortfolio.id : corePortfolio.id;

    await prisma.holding.create({
      data: {
        portfolioId,
        assetId: createdAsset.id,
        quantity: asset.quantity,
        avgCost: asset.avgCost,
        drip_enabled: asset.dripEnabled,
      },
    });

    await prisma.transaction.create({
      data: {
        portfolioId,
        assetId: createdAsset.id,
        type: 'BUY',
        quantity: asset.quantity,
        price: asset.avgCost,
      },
    });
  }

  const snapshots = buildSnapshots();

  await prisma.portfolioSnapshot.createMany({
    data: snapshots.map((snapshot) => ({
      portfolioId: corePortfolio.id,
      ...snapshot,
    })),
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed with 20 assets, 5-year snapshots, and Snowball Elite scoring.');
}

main()
  .catch(async (error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
