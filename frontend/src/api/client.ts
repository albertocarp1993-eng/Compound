import {
  AnalyticsMatrixResponse,
  HoldingsAnalyticsResponse,
  PortfolioHealthResponse,
} from '../types/analytics';
import { PortfoliosResponse } from '../types/portfolio';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

async function fetchJson<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as { error?: string; details?: string };
      message = body.details ? `${body.error ?? message}: ${body.details}` : body.error ?? message;
    } catch {
      // Keep default message when response body is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const getPortfolios = (): Promise<PortfoliosResponse> =>
  fetchJson<PortfoliosResponse>('/api/portfolios');

export const getPortfolioHealth = (portfolioId: number): Promise<PortfolioHealthResponse> =>
  fetchJson<PortfolioHealthResponse>(`/api/analytics/portfolio-health?portfolioId=${portfolioId}`);

export const getMatrix = (portfolioId: number): Promise<AnalyticsMatrixResponse> =>
  fetchJson<AnalyticsMatrixResponse>(`/api/analytics/matrix?portfolioId=${portfolioId}`);

export const getHoldings = (portfolioId: number): Promise<HoldingsAnalyticsResponse> =>
  fetchJson<HoldingsAnalyticsResponse>(`/api/analytics/holdings?portfolioId=${portfolioId}`);
