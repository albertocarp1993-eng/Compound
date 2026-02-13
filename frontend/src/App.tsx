import { useEffect, useMemo, useState } from 'react';
import StockCard from './components/StockCard';
import MoatDistribution from './components/analytics/MoatDistribution';
import QualityScatterPlot from './components/analytics/QualityScatterPlot';
import ScoreGauge from './components/analytics/ScoreGauge';
import { getPortfolios } from './api/client';
import { usePortfolioAnalytics } from './hooks/usePortfolioAnalytics';
import { PortfolioSummary } from './types/portfolio';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

function App(): JSX.Element {
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  const {
    health,
    matrix,
    holdings,
    loading: analyticsLoading,
    error: analyticsError,
    refetch,
  } = usePortfolioAnalytics(selectedPortfolioId);

  useEffect(() => {
    const loadPortfolios = async () => {
      setPortfolioLoading(true);
      setPortfolioError(null);

      try {
        const response = await getPortfolios();
        setPortfolios(response.portfolios);

        if (response.portfolios.length > 0) {
          setSelectedPortfolioId((prev) => prev ?? response.portfolios[0].id);
        }
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to fetch portfolios from backend';
        setPortfolioError(message);
      } finally {
        setPortfolioLoading(false);
      }
    };

    void loadPortfolios();
  }, []);

  const selectedPortfolio = useMemo(
    () => portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null,
    [portfolios, selectedPortfolioId],
  );

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                Snowball Analytics
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Portfolio Quality Tracker</h1>
              <p className="mt-2 text-sm text-slate-600">
                Dynamic valuation vs. quality intelligence for dividend-growth investing.
              </p>
            </div>

            <div className="flex min-w-[240px] flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Portfolio
              </label>
              <select
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm text-slate-800 shadow-sm focus:border-sky-400 focus:outline-none"
                disabled={portfolioLoading || portfolios.length === 0}
                value={selectedPortfolioId ?? ''}
                onChange={(event) => setSelectedPortfolioId(Number(event.target.value))}
              >
                {portfolios.map((portfolio) => (
                  <option key={portfolio.id} value={portfolio.id}>
                    {portfolio.name} ({portfolio.userName})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedPortfolio && (
            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-slate-600 sm:grid-cols-3">
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Holdings</p>
                <p className="text-lg font-semibold text-slate-900">{selectedPortfolio.holdingsCount}</p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Total Value</p>
                <p className="text-lg font-semibold text-slate-900">
                  {formatCurrency(selectedPortfolio.totalValue)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-slate-500">Portfolio ID</p>
                <p className="text-lg font-semibold text-slate-900">#{selectedPortfolio.id}</p>
              </div>
            </div>
          )}
        </header>

        {portfolioError && (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Failed to load portfolios: {portfolioError}
          </div>
        )}

        {analyticsError && (
          <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>Failed to load analytics: {analyticsError}</span>
            <button
              type="button"
              onClick={() => void refetch()}
              className="rounded-lg border border-rose-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide"
            >
              Retry
            </button>
          </div>
        )}

        {(portfolioLoading || analyticsLoading) && (
          <div className="mb-4 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-800">
            Loading portfolio analytics...
          </div>
        )}

        {!portfolioLoading && !analyticsLoading && selectedPortfolioId && (
          <>
            <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <ScoreGauge score={health?.weightedAverageScore ?? 0} />
              </div>
              <div className="lg:col-span-2">
                <QualityScatterPlot data={matrix} />
              </div>
            </section>

            <section className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="lg:col-span-1">
                <MoatDistribution data={matrix} />
              </div>

              <div className="space-y-4 lg:col-span-2">
                {holdings.map((holding) => (
                  <StockCard
                    key={holding.assetId}
                    symbol={holding.symbol}
                    name={holding.name}
                    price={holding.currentPrice}
                    score={holding.calculatedScore}
                    moatRating={holding.moatRating}
                    breakdown={holding.breakdown}
                  />
                ))}
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
