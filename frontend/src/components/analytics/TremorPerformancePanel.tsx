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

  if (loading) {
    return <Skeleton className="mb-4 h-[180px] w-full" />;
  }

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
      <TremorCard decoration="top" decorationColor="emerald" className="border-none bg-transparent p-0 shadow-none">
        <Text>Snowball Trend (Tremor)</Text>
        <Metric>{formatCurrency(latest?.totalValue ?? 0)}</Metric>
        <AreaChart
          className="mt-4 h-32"
          data={mapped}
          index="Date"
          categories={['Total Value', 'Invested Capital']}
          colors={['emerald', 'blue']}
          valueFormatter={formatCurrency}
          yAxisWidth={64}
          showLegend={true}
        />
      </TremorCard>
    </div>
  );
}

export default TremorPerformancePanel;
