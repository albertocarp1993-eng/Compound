import { useCallback, useEffect, useState } from 'react';
import {
  getHoldings,
  getMatrix,
  getPayoutCalendar,
  getPortfolioHealth,
  getPortfolioKpis,
  getSnowballSeries,
} from '../api/client';
import {
  AnalyticsMatrixPoint,
  HoldingAnalytics,
  PayoutCalendarResponse,
  PortfolioHealthResponse,
  PortfolioKpiResponse,
  SnowballResponse,
} from '../types/analytics';

type DashboardDataState = {
  health: PortfolioHealthResponse | null;
  matrix: AnalyticsMatrixPoint[];
  holdings: HoldingAnalytics[];
  kpis: PortfolioKpiResponse | null;
  snowball: SnowballResponse | null;
  payoutCalendar: PayoutCalendarResponse | null;
  loading: boolean;
  error: string | null;
};

const initialState: DashboardDataState = {
  health: null,
  matrix: [],
  holdings: [],
  kpis: null,
  snowball: null,
  payoutCalendar: null,
  loading: false,
  error: null,
};

export function useDashboardData(portfolioId: number | null): DashboardDataState & {
  refetch: () => Promise<void>;
} {
  const [state, setState] = useState<DashboardDataState>(initialState);

  const refetch = useCallback(async () => {
    if (!portfolioId) {
      setState(initialState);
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const [health, matrixResponse, holdingsResponse, kpis, snowball, payoutCalendar] =
        await Promise.all([
          getPortfolioHealth(portfolioId),
          getMatrix(portfolioId),
          getHoldings(portfolioId),
          getPortfolioKpis(portfolioId),
          getSnowballSeries(portfolioId),
          getPayoutCalendar(portfolioId),
        ]);

      setState({
        health,
        matrix: matrixResponse.matrix,
        holdings: holdingsResponse.holdings,
        kpis,
        snowball,
        payoutCalendar,
        loading: false,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dashboard data';
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

export default useDashboardData;
