import { AreaChart, Card as TremorCard, Metric, Text } from '@tremor/react';
import { SnowballPoint } from '../../types/analytics';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type TremorPerformancePanelProps = {
  points: SnowballPoint[];
  loading?: boolean;
};

export function TremorPerformancePanel({ points, loading = false }: TremorPerformancePanelProps): JSX.Element {
  const mapped = points
    .filter((_, index) => index % 3 === 0)
    .map((point) => ({
      Date: new Date(point.date).toLocaleDateString('en-US', { year: '2-digit', month: 'short' }),
      'Total Value': point.totalValue,
      'Invested Capital': point.investedCapital,
    }));

  const latest = points[points.length - 1];
  const prior = points.length > 1 ? points[points.length - 2] : latest;
  const delta = latest && prior ? latest.totalValue - prior.totalValue : 0;

  if (loading) {
    return <Skeleton className="mb-4 h-[180px] w-full" />;
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-[var(--line)] bg-[color:var(--surface)] p-4">
      <TremorCard decoration="top" decorationColor="emerald" className="border-none bg-transparent p-0 shadow-none">
        <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
          <div>
            <Text>Snowball Trend (Tremor)</Text>
            <Metric>{formatCurrency(latest?.totalValue ?? 0)}</Metric>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">Latest Move</p>
            <p className="numeric text-sm font-semibold" style={{ color: delta >= 0 ? '#22c55e' : '#ef4444' }}>
              {delta >= 0 ? '+' : ''}
              {formatCurrency(delta)}
            </p>
          </div>
        </div>
        <AreaChart
          className="mt-2 h-40"
          data={mapped}
          index="Date"
          categories={['Total Value', 'Invested Capital']}
          colors={['emerald', 'blue']}
          valueFormatter={formatCurrency}
          yAxisWidth={54}
          showLegend={false}
          showGridLines={false}
          showYAxis={false}
          tickGap={28}
        />
      </TremorCard>
    </div>
  );
}

export default TremorPerformancePanel;
