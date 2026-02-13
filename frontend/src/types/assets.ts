import { HealthVerdict } from './analytics';
import {
  AssetFinancialRow,
  AssetFundamentalsPayload,
  AssetMetricsPayload,
  AssetScoreModelPayload,
} from './financials';
import { MoatRating } from './scoring';

export type AssetSearchResult = {
  symbol: string;
  name: string;
  currentPrice: number | null;
  snowballScore: number | null;
  peRatio: number | null;
  moatRating: MoatRating | null;
  source: 'local' | 'sec';
};

export type AssetSearchResponse = {
  count: number;
  results: AssetSearchResult[];
};

export type AssetNewsItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  source: string;
  summary: string | null;
};

export type AssetComprehensiveResponse = {
  symbol: string;
  name: string;
  currentPrice: number;
  fundamentals: AssetFundamentalsPayload | null;
  quote: {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    marketCap: number | null;
    currency: string | null;
    exchange: string | null;
    source: 'stooq' | 'local';
    asOf: string;
  };
  metrics?: AssetMetricsPayload;
  scoreModel?: AssetScoreModelPayload | null;
  insights: {
    moat: string;
    valuation: string;
    profitability: string;
    balanceSheet: string;
  };
  financials: AssetFinancialRow[];
  news: AssetNewsItem[];
  dataSources: {
    localFundamentals: boolean;
    secFinancials: boolean;
    quote: 'stooq' | 'local';
    news: 'google' | 'none';
  };
};

export type DealRoomPayload = {
  symbol: string;
  name: string;
  qualityScore: number;
  verdict: HealthVerdict;
  peRatio: number;
  positionValue: number;
  moatRating: MoatRating;
};
