import { MoatRating, PrismaClient } from '@prisma/client';
import { calculateAssetScore, ScoringInput } from '../src/services/scoringService';

const prisma = new PrismaClient();

type SeedAsset = {
  symbol: string;
  name: string;
  currentPrice: number;
  fundamentals: ScoringInput;
  quantity: number;
  avgCost: number;
};

const seedAssets: SeedAsset[] = [
  {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    currentPrice: 189.5,
    fundamentals: {
      pe_ratio: 28,
      roe: 150,
      debt_to_equity: 1.7,
      dividend_safety_score: 86,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.26,
    },
    quantity: 25,
    avgCost: 160,
  },
  {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    currentPrice: 410.2,
    fundamentals: {
      pe_ratio: 34,
      roe: 38,
      debt_to_equity: 0.5,
      dividend_safety_score: 93,
      moat_rating: MoatRating.WIDE,
      historical_volatility: 0.22,
    },
    quantity: 8,
    avgCost: 320,
  },
  {
    symbol: 'JNJ',
    name: 'Johnson & Johnson',
    currentPrice: 162.3,
    fundamentals: {
      pe_ratio: 16,
      roe: 29,
      debt_to_equity: 0.6,
      dividend_safety_score: 95,
      moat_rating: MoatRating.NARROW,
      historical_volatility: 0.18,
    },
    quantity: 15,
    avgCost: 145,
  },
  {
    symbol: 'PENY',
    name: 'PennyX Bio Ventures',
    currentPrice: 1.1,
    fundamentals: {
      pe_ratio: 0,
      roe: -5,
      debt_to_equity: 4.6,
      dividend_safety_score: 5,
      moat_rating: MoatRating.NONE,
      historical_volatility: 0.85,
    },
    quantity: 1500,
    avgCost: 2.8,
  },
];

async function main(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "Transaction",
      "Holding",
      "AssetFundamentals",
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
        create: {
          name: 'Snowball Core',
        },
      },
    },
    include: {
      portfolios: true,
    },
  });

  const portfolio = user.portfolios[0];

  for (const asset of seedAssets) {
    const calculatedScore = calculateAssetScore(asset.fundamentals);

    const createdAsset = await prisma.asset.create({
      data: {
        symbol: asset.symbol,
        name: asset.name,
        currentPrice: asset.currentPrice,
        fundamentals: {
          create: {
            ...asset.fundamentals,
            calculated_score: calculatedScore,
          },
        },
      },
    });

    await prisma.holding.create({
      data: {
        portfolioId: portfolio.id,
        assetId: createdAsset.id,
        quantity: asset.quantity,
        avgCost: asset.avgCost,
      },
    });

    await prisma.transaction.create({
      data: {
        portfolioId: portfolio.id,
        assetId: createdAsset.id,
        type: 'BUY',
        quantity: asset.quantity,
        price: asset.avgCost,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log('Seed completed with Snowball fundamentals and scores.');
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
