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

export type UpdateHoldingPayload = {
  quantity?: number;
  avgCost?: number;
  dripEnabled?: boolean;
};

export type HoldingPosition = {
  id: number;
  portfolioId: number;
  assetId: number;
  symbol: string;
  name: string;
  quantity: number;
  avgCost: number;
  dripEnabled: boolean;
  currentPrice: number;
  positionValue: number;
};

export type UpdateHoldingResponse = {
  holding: HoldingPosition;
};

export type DeleteHoldingResponse = {
  deleted: boolean;
  holding: HoldingPosition;
};
