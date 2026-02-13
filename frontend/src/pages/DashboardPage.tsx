import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import AssetTable from '../components/AssetTable';
import DealRoomDrawer from '../components/DealRoomDrawer';
import DividendPayoutHeatmap from '../components/analytics/DividendPayoutHeatmap';
import MoatDistribution from '../components/analytics/MoatDistribution';
import QualityMap from '../components/analytics/QualityMap';
import ScoreGauge from '../components/analytics/ScoreGauge';
import SnowballChart from '../components/analytics/SnowballChart';
import TremorPerformancePanel from '../components/analytics/TremorPerformancePanel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { useDashboardLayoutContext } from '../components/layout/DashboardLayout';
import { AnalyticsMatrixPoint } from '../types/analytics';

type WidgetId = 'gauge' | 'quality' | 'moat' | 'snowball' | 'dividends' | 'table';

const widgetClassName: Record<WidgetId, string> = {
  gauge: 'col-span-12 xl:col-span-3',
  quality: 'col-span-12 xl:col-span-6',
  moat: 'col-span-12 xl:col-span-3',
  snowball: 'col-span-12 xl:col-span-8',
  dividends: 'col-span-12 xl:col-span-4',
  table: 'col-span-12',
};

type SortableWidgetProps = {
  id: WidgetId;
  className: string;
  children: JSX.Element;
};

function SortableWidget({ id, className, children }: SortableWidgetProps): JSX.Element {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`${className} ${isDragging ? 'opacity-75' : 'opacity-100'} animate-fade-in-up`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

export function DashboardPage(): JSX.Element {
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

  const [widgetOrder, setWidgetOrder] = useState<WidgetId[]>([
    'gauge',
    'quality',
    'moat',
    'snowball',
    'dividends',
    'table',
  ]);

  const [dealRoomPoint, setDealRoomPoint] = useState<AnalyticsMatrixPoint | null>(null);
  const [dealRoomOpen, setDealRoomOpen] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const qualityLeader = useMemo(() => {
    if (dashboardData.holdings.length === 0) return null;
    return dashboardData.holdings.reduce((best, candidate) =>
      candidate.calculatedScore > best.calculatedScore ? candidate : best,
    );
  }, [dashboardData.holdings]);

  const renderWidget = (id: WidgetId): JSX.Element => {
    if (id === 'gauge') {
      return (
        <section id="quality-audit">
          <ScoreGauge
            score={dashboardData.health?.weightedAverageScore ?? 0}
            loading={dashboardData.loading}
            title="Health Rating"
            subtitle="Snowball weighted average"
          />
        </section>
      );
    }

    if (id === 'quality') {
      return (
        <section id="command-center">
          <QualityMap
            data={dashboardData.matrix}
            loading={dashboardData.loading}
            onSelectPoint={(point) => {
              setDealRoomPoint(point);
              setDealRoomOpen(true);
            }}
          />
        </section>
      );
    }

    if (id === 'moat') {
      return (
        <section>
          <MoatDistribution data={dashboardData.matrix} loading={dashboardData.loading} />
        </section>
      );
    }

    if (id === 'snowball') {
      return (
        <section id="snowball-projection">
          <SnowballChart data={dashboardData.snowball?.points ?? []} loading={dashboardData.loading} />
        </section>
      );
    }

    if (id === 'dividends') {
      return (
        <section id="dividends">
          <DividendPayoutHeatmap
            year={dashboardData.payoutCalendar?.year ?? new Date().getUTCFullYear()}
            data={dashboardData.payoutCalendar?.days ?? []}
            projectedAnnualDividends={dashboardData.payoutCalendar?.projectedAnnualDividends ?? 0}
            loading={dashboardData.loading}
          />
        </section>
      );
    }

    return (
      <section>
        <AssetTable
          data={dashboardData.holdings}
          loading={dashboardData.loading}
          onOpenStock={(symbol) => navigate(`/stocks/${symbol}`)}
        />
      </section>
    );
  };

  if (!portfolioLoading && !selectedPortfolioId) {
    return (
      <section className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-6 text-center">
        <h2 className="text-xl font-semibold text-zinc-100">Create your first portfolio</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Add a portfolio to unlock the command center, quality map, and snowball analytics.
        </p>

        <form onSubmit={(event) => void onCreatePortfolio(event)} className="mx-auto mt-4 max-w-sm space-y-2">
          <input
            value={createPortfolioName}
            onChange={(event) => setCreatePortfolioName(event.target.value)}
            placeholder="Snowball Elite Core"
            className="h-10 w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 text-sm text-zinc-100"
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
      <section className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold text-zinc-100">
              {selectedPortfolio?.name ?? 'Portfolio'}
            </h2>
            <p className="text-sm text-zinc-400">
              Draggable widget workspace for quality, dividends, valuation, and compounding analytics.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="default">{selectedPortfolio?.holdingsCount ?? 0} holdings</Badge>
            <Badge variant="info">{selectedPortfolio?.userName ?? 'Unknown owner'}</Badge>
            {qualityLeader && <Badge variant="success">Leader: {qualityLeader.symbol}</Badge>}
          </div>
        </div>
      </section>

      <TremorPerformancePanel
        points={dashboardData.snowball?.points ?? []}
        loading={dashboardData.loading}
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(event) => {
          const { active, over } = event;
          if (!over || active.id === over.id) return;

          setWidgetOrder((current) => {
            const oldIndex = current.indexOf(active.id as WidgetId);
            const newIndex = current.indexOf(over.id as WidgetId);
            return arrayMove(current, oldIndex, newIndex);
          });
        }}
      >
        <SortableContext items={widgetOrder} strategy={rectSortingStrategy}>
          <section className="grid grid-cols-12 gap-4">
            {widgetOrder.map((widgetId) => (
              <SortableWidget key={widgetId} id={widgetId} className={widgetClassName[widgetId]}>
                {renderWidget(widgetId)}
              </SortableWidget>
            ))}
          </section>
        </SortableContext>
      </DndContext>

      <DealRoomDrawer
        point={dealRoomPoint}
        open={dealRoomOpen}
        onOpenChange={setDealRoomOpen}
        onOpenStock={(symbol) => navigate(`/stocks/${symbol}`)}
      />
    </>
  );
}

export default DashboardPage;
