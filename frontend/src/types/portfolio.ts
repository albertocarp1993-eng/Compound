export type PortfolioSummary = {
  id: number;
  name: string;
  userId: number;
  userName: string;
  holdingsCount: number;
  totalValue: number;
};

export type PortfoliosResponse = {
  count: number;
  portfolios: PortfolioSummary[];
};

export type CreatePortfolioPayload = {
  name: string;
  userId?: number;
  userName?: string;
  userEmail?: string;
};

export type CreatePortfolioResponse = {
  portfolio: PortfolioSummary;
};
