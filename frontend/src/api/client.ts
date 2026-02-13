import {
  AnalyticsMatrixResponse,
  HoldingsAnalyticsResponse,
  PayoutCalendarResponse,
  PortfolioHealthResponse,
  PortfolioKpiResponse,
  SnowballResponse,
} from '../types/analytics';
import { AssetComprehensiveResponse, AssetSearchResponse } from '../types/assets';
import { AssetFinancialsResponse } from '../types/financials';
import {
  CreatePortfolioPayload,
  CreatePortfolioResponse,
  PortfoliosResponse,
} from '../types/portfolio';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const resolveApiErrorMessage = (body: unknown, status: number): string => {
  const fallback = `Request failed (${status})`;
  if (!body || typeof body !== 'object') return fallback;

  const payload = body as {
    error?: string;
    details?: unknown;
  };

  if (typeof payload.details === 'string') {
    return payload.error ? `${payload.error}: ${payload.details}` : payload.details;
  }

  if (payload.details && typeof payload.details === 'object') {
    const detailsObj = payload.details as {
      formErrors?: unknown;
      fieldErrors?: Record<string, unknown>;
    };

    if (Array.isArray(detailsObj.formErrors) && detailsObj.formErrors.length > 0) {
      return String(detailsObj.formErrors[0]);
    }

    if (detailsObj.fieldErrors && typeof detailsObj.fieldErrors === 'object') {
      const firstField = Object.values(detailsObj.fieldErrors).find(
        (value) => Array.isArray(value) && value.length > 0,
      );
      if (Array.isArray(firstField) && firstField.length > 0) {
        return String(firstField[0]);
      }
    }
  }

  return payload.error ?? fallback;
};

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    try {
      const body = (await response.json()) as unknown;
      message = resolveApiErrorMessage(body, response.status);
    } catch {
      // Keep default message when response body is not JSON.
    }
    throw new Error(message);
  }

  return (await response.json()) as T;
}

export const getPortfolios = (): Promise<PortfoliosResponse> =>
  fetchJson<PortfoliosResponse>('/api/portfolios');

export const createPortfolio = (
  payload: CreatePortfolioPayload,
): Promise<CreatePortfolioResponse> =>
  fetchJson<CreatePortfolioResponse>('/api/portfolios', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

export const getPortfolioHealth = (portfolioId: number): Promise<PortfolioHealthResponse> =>
  fetchJson<PortfolioHealthResponse>(`/api/analytics/portfolio-health?portfolioId=${portfolioId}`);

export const getMatrix = (portfolioId: number): Promise<AnalyticsMatrixResponse> =>
  fetchJson<AnalyticsMatrixResponse>(`/api/analytics/matrix?portfolioId=${portfolioId}`);

export const getHoldings = (portfolioId: number): Promise<HoldingsAnalyticsResponse> =>
  fetchJson<HoldingsAnalyticsResponse>(`/api/analytics/holdings?portfolioId=${portfolioId}`);

export const getPortfolioKpis = (portfolioId: number): Promise<PortfolioKpiResponse> =>
  fetchJson<PortfolioKpiResponse>(`/api/analytics/kpis?portfolioId=${portfolioId}`);

export const getSnowballSeries = (portfolioId: number): Promise<SnowballResponse> =>
  fetchJson<SnowballResponse>(`/api/analytics/snowball?portfolioId=${portfolioId}`);

export const getPayoutCalendar = (
  portfolioId: number,
  year?: number,
): Promise<PayoutCalendarResponse> =>
  fetchJson<PayoutCalendarResponse>(
    `/api/analytics/payout-calendar?portfolioId=${portfolioId}${year ? `&year=${year}` : ''}`,
  );

export const getAssetFinancials = (symbol: string): Promise<AssetFinancialsResponse> =>
  fetchJson<AssetFinancialsResponse>(`/api/assets/${symbol}/financials`);

export const searchAssets = (query: string): Promise<AssetSearchResponse> =>
  fetchJson<AssetSearchResponse>(`/api/assets/search?query=${encodeURIComponent(query)}`);

export const getAssetComprehensive = (symbol: string): Promise<AssetComprehensiveResponse> =>
  fetchJson<AssetComprehensiveResponse>(`/api/assets/${symbol.toUpperCase()}/comprehensive`);
