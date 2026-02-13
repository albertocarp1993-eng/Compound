import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DealRoomDrawer from '../components/DealRoomDrawer';
import MoatDistribution from '../components/analytics/MoatDistribution';
import QualityMap from '../components/analytics/QualityMap';
import ScoreGauge from '../components/analytics/ScoreGauge';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useDashboardLayoutContext } from '../components/layout/DashboardLayout';
import { AnalyticsMatrixPoint } from '../types/analytics';

const verdictVariant = (verdict: 'BUY' | 'HOLD' | 'TRIM'): 'success' | 'warning' | 'danger' => {
  if (verdict === 'BUY') return 'success';
  if (verdict === 'HOLD') return 'warning';
  return 'danger';
};

export function QualityAuditPage(): JSX.Element {
  const navigate = useNavigate();
  const { dashboardData } = useDashboardLayoutContext();
  const [dealRoomPoint, setDealRoomPoint] = useState<AnalyticsMatrixPoint | null>(null);
  const [dealRoomOpen, setDealRoomOpen] = useState(false);

  const ranked = useMemo(
    () => [...dashboardData.holdings].sort((a, b) => b.calculatedScore - a.calculatedScore),
    [dashboardData.holdings],
  );

  return (
    <>
      <section className="mb-4 grid grid-cols-12 gap-4">
        <div className="col-span-12 xl:col-span-3">
          <ScoreGauge
            score={dashboardData.health?.weightedAverageScore ?? 0}
            loading={dashboardData.loading}
            title="Quality Audit Score"
            subtitle="Portfolio-level quality baseline"
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
      </section>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Quality Ranking</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {ranked.map((holding) => (
                <div key={holding.assetId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-3 py-2">
                  <div>
                    <p className="numeric text-sm font-semibold text-[color:var(--text)]">{holding.symbol}</p>
                    <p className="text-xs text-[color:var(--muted)]">{holding.name}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge variant={verdictVariant(holding.healthVerdict)}>{holding.healthVerdict}</Badge>
                    <span className="numeric rounded-md border border-[var(--line)] bg-[color:var(--surface)] px-2 py-1 text-sm text-[color:var(--text)]">
                      Q {holding.calculatedScore}
                    </span>
                    <span className="numeric text-xs text-[color:var(--muted)]">P/E {holding.peRatio.toFixed(1)}</span>
                    <Button size="sm" variant="ghost" onClick={() => navigate(`/stocks/${holding.symbol}`)}>
                      Open
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
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

export default QualityAuditPage;
