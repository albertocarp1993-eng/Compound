import { useMemo } from 'react';
import { PayoutCalendarDay } from '../../types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

const intensityClass = (intensity: number): string => {
  if (intensity >= 4) return 'bg-emerald-400';
  if (intensity === 3) return 'bg-emerald-500/70';
  if (intensity === 2) return 'bg-emerald-500/45';
  if (intensity === 1) return 'bg-emerald-500/25';
  return 'bg-zinc-800';
};

const tooltipDate = (date: string): string =>
  new Date(`${date}T00:00:00.000Z`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type DividendPayoutHeatmapProps = {
  year: number;
  data: PayoutCalendarDay[];
  projectedAnnualDividends: number;
  loading?: boolean;
};

export function DividendPayoutHeatmap({
  year,
  data,
  projectedAnnualDividends,
  loading = false,
}: DividendPayoutHeatmapProps): JSX.Element {
  const cells = useMemo(() => {
    const map = new Map(data.map((day) => [day.date, day]));
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));

    const days: Array<{ date: string; amount: number; intensity: number }> = [];

    for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      const key = date.toISOString().slice(0, 10);
      const existing = map.get(key);
      days.push({
        date: key,
        amount: existing?.amount ?? 0,
        intensity: existing?.intensity ?? 0,
      });
    }

    return days;
  }, [data, year]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Dividend Payout Calendar</CardTitle>
          <CardDescription>Income heatmap by expected payout day.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[210px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Dividend Payout Calendar</CardTitle>
        <CardDescription>
          Projected annual dividends: <span className="numeric text-emerald-300">{formatCurrency(projectedAnnualDividends)}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="grid min-w-[730px] grid-flow-col grid-rows-7 gap-1">
            {cells.map((cell) => (
              <div
                key={cell.date}
                title={`${tooltipDate(cell.date)} • ${formatCurrency(cell.amount)}`}
                className={`h-3 w-3 rounded-[3px] ${intensityClass(cell.intensity)}`}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DividendPayoutHeatmap;
