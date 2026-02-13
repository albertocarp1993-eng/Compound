import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AssetTable from '../components/AssetTable';
import DealRoomDrawer from '../components/DealRoomDrawer';
import MoatDistribution from '../components/analytics/MoatDistribution';
import QualityMap from '../components/analytics/QualityMap';
import ScoreGauge from '../components/analytics/ScoreGauge';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useDashboardLayoutContext } from '../components/layout/DashboardLayout';
import { AnalyticsMatrixPoint } from '../types/analytics';

export function CommandCenterPage(): JSX.Element {
  const navigate = useNavigate();
  const {
    selectedPortfolio,
    selectedPortfolioId,
    portfolioLoading,
    createPortfolioName,
    setCreatePortfolioName,
    creatingPortfolio,
    createPortfolioError,
    onCreatePortfolio,
    dashboardData,
    reloadPortfolios,
  } = useDashboardLayoutContext();

  const [dealRoomPoint, setDealRoomPoint] = useState<AnalyticsMatrixPoint | null>(null);
  const [dealRoomOpen, setDealRoomOpen] = useState(false);

  const qualityLeader = useMemo(() => {
    if (dashboardData.holdings.length === 0) return null;
    return dashboardData.holdings.reduce((best, candidate) =>
      candidate.calculatedScore > best.calculatedScore ? candidate : best,
    );
  }, [dashboardData.holdings]);

  const valueOpportunity = useMemo(() => {
    const candidates = dashboardData.holdings
      .filter((holding) => holding.calculatedScore >= 70)
      .sort((a, b) => a.peRatio - b.peRatio);
    return candidates[0] ?? null;
  }, [dashboardData.holdings]);

  if (!portfolioLoading && !selectedPortfolioId) {
    return (
      <section className="rounded-xl border border-[var(--line)] bg-[color:var(--surface)] p-6 text-center">
        <h2 className="text-xl font-semibold text-[color:var(--text)]">Create your first portfolio</h2>
        <p className="mt-2 text-sm text-[color:var(--muted)]">
          Add a portfolio to unlock command-center analytics.
        </p>

        <form onSubmit={(event) => void onCreatePortfolio(event)} className="mx-auto mt-4 max-w-sm space-y-2">
          <input
            value={createPortfolioName}
            onChange={(event) => setCreatePortfolioName(event.target.value)}
            placeholder="Snowball Elite Core"
            className="h-10 w-full rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-3 text-sm text-[color:var(--text)]"
          />
          <Button type="submit" className="w-full" disabled={creatingPortfolio}>
            {creatingPortfolio ? 'Creating...' : 'Create Portfolio'}
          </Button>
        </form>

        {createPortfolioError && <p className="mt-2 text-sm text-rose-400">{createPortfolioError}</p>}

        <Button variant="secondary" className="mt-4" onClick={() => void reloadPortfolios()}>
          Refresh Portfolios
        </Button>
      </section>
    );
  }

  return (
    <>
      <section className="mb-4 rounded-xl border border-[var(--line)] bg-[color:var(--surface)] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-[color:var(--text)]">
              {selectedPortfolio?.name ?? 'Portfolio'}
            </h2>
            <p className="text-sm text-[color:var(--muted)]">
              Market-wide command view for quality, valuation, and position sizing.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{selectedPortfolio?.holdingsCount ?? 0} holdings</Badge>
            <Badge variant="info">{selectedPortfolio?.userName ?? 'Unknown owner'}</Badge>
            {qualityLeader && <Badge variant="success">Leader: {qualityLeader.symbol}</Badge>}
            {valueOpportunity && <Badge variant="warning">Value: {valueOpportunity.symbol}</Badge>}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3">
          <ScoreGauge
            score={dashboardData.health?.weightedAverageScore ?? 0}
            loading={dashboardData.loading}
            title="Portfolio Health"
            subtitle="Weighted quality score"
          />
        </div>

        <div className="col-span-12 xl:col-span-6">
          <QualityMap
            data={dashboardData.matrix}
            loading={dashboardData.loading}
            onSelectPoint={(point) => {
              setDealRoomPoint(point);
              setDealRoomOpen(true);
            }}
          />
        </div>

        <div className="col-span-12 xl:col-span-3">
          <MoatDistribution data={dashboardData.matrix} loading={dashboardData.loading} />
        </div>

        <div className="col-span-12">
          <AssetTable
            data={dashboardData.holdings}
            loading={dashboardData.loading}
            onOpenStock={(symbol) => navigate(`/stocks/${symbol}`)}
          />
        </div>
      </section>

      <DealRoomDrawer
        point={dealRoomPoint}
        open={dealRoomOpen}
        onOpenChange={setDealRoomOpen}
        onOpenStock={(symbol) => navigate(`/stocks/${symbol}`)}
      />
    </>
  );
}

export default CommandCenterPage;
