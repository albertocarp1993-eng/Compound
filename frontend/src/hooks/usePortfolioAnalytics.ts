import { useCallback, useEffect, useState } from 'react';
import { getHoldings, getMatrix, getPortfolioHealth } from '../api/client';
import {
  AnalyticsMatrixPoint,
  HoldingAnalytics,
  PortfolioHealthResponse,
} from '../types/analytics';

type PortfolioAnalyticsState = {
  health: PortfolioHealthResponse | null;
  matrix: AnalyticsMatrixPoint[];
  holdings: HoldingAnalytics[];
  loading: boolean;
  error: string | null;
};

const initialState: PortfolioAnalyticsState = {
  health: null,
  matrix: [],
  holdings: [],
  loading: false,
  error: null,
};

export function usePortfolioAnalytics(portfolioId: number | null) {
  const [state, setState] = useState<PortfolioAnalyticsState>(initialState);

  const refetch = useCallback(async () => {
    if (!portfolioId) {
      setState(initialState);
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [health, matrixResponse, holdingsResponse] = await Promise.all([
        getPortfolioHealth(portfolioId),
        getMatrix(portfolioId),
        getHoldings(portfolioId),
      ]);

      setState({
        health,
        matrix: matrixResponse.matrix,
        holdings: holdingsResponse.holdings,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load analytics data';
      setState((prev) => ({ ...prev, loading: false, error: message }));
    }
  }, [portfolioId]);

  useEffect(() => {
    void refetch();
  }, [refetch]);

  return {
    ...state,
    refetch,
  };
}
