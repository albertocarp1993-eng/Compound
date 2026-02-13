import { useMemo } from 'react';
import { PayoutCalendarDay } from '../../types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

const intensityClass = (intensity: number): string => {
  if (intensity >= 4) return 'bg-emerald-400';
  if (intensity === 3) return 'bg-emerald-500/70';
  if (intensity === 2) return 'bg-emerald-500/45';
  if (intensity === 1) return 'bg-emerald-500/25';
  return 'bg-[color:var(--surface-strong)]';
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
  const { cells, monthMarkers } = useMemo(() => {
    const map = new Map(data.map((day) => [day.date, day]));
    const start = new Date(Date.UTC(year, 0, 1));
    const end = new Date(Date.UTC(year, 11, 31));

    const days: Array<{ date: string; amount: number; intensity: number }> = [];
    const months: Array<{ date: string; label: string; index: number }> = [];
    let cellIndex = 0;

    for (let date = new Date(start); date <= end; date.setUTCDate(date.getUTCDate() + 1)) {
      const key = date.toISOString().slice(0, 10);
      const existing = map.get(key);
      if (date.getUTCDate() === 1) {
        months.push({
          date: key,
          label: date.toLocaleDateString('en-US', { month: 'short' }),
          index: cellIndex,
        });
      }
      days.push({
        date: key,
        amount: existing?.amount ?? 0,
        intensity: existing?.intensity ?? 0,
      });
      cellIndex += 1;
    }

    return {
      cells: days,
      monthMarkers: months,
    };
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
          <div className="mb-2 grid min-w-[730px] grid-flow-col grid-rows-1 gap-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted)]">
            {monthMarkers.map((month) => (
              <div key={month.date} style={{ gridColumnStart: month.index + 1 }}>
                {month.label}
              </div>
            ))}
          </div>
          <div className="grid min-w-[730px] grid-flow-col grid-rows-7 gap-1">
            {cells.map((cell) => (
              <div
                key={cell.date}
                title={`${tooltipDate(cell.date)} • ${formatCurrency(cell.amount)}`}
                className={`h-3 w-3 rounded-[3px] ${intensityClass(cell.intensity)}`}
              />
            ))}
          </div>

          <div className="mt-3 flex items-center justify-end gap-2 text-[10px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
            <span>Low</span>
            <span className="h-2 w-2 rounded-[2px] bg-[color:var(--surface-strong)]" />
            <span className="h-2 w-2 rounded-[2px] bg-emerald-500/25" />
            <span className="h-2 w-2 rounded-[2px] bg-emerald-500/45" />
            <span className="h-2 w-2 rounded-[2px] bg-emerald-500/70" />
            <span className="h-2 w-2 rounded-[2px] bg-emerald-400" />
            <span>High</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default DividendPayoutHeatmap;
