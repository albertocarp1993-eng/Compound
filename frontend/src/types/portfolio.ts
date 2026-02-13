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
