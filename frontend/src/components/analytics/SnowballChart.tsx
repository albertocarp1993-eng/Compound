import {
  Area,
  Brush,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SnowballPoint } from '../../types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
  });

const formatDateShort = (value: string): string =>
  new Date(value).toLocaleDateString('en-US', {
    year: '2-digit',
    month: 'short',
  });

type SnowballChartProps = {
  data: SnowballPoint[];
  loading?: boolean;
};

export function SnowballChart({ data, loading = false }: SnowballChartProps): JSX.Element {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Snowball Projection</CardTitle>
          <CardDescription>Invested capital vs compounding effect over time</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[340px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Snowball Projection</CardTitle>
        <CardDescription>
          The gap between the layers shows how compounding is doing the heavy lifting.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-2 py-1 text-[color:var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-sky-400" /> Invested Capital
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-2 py-1 text-[color:var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Compound Interest
          </span>
          <span className="inline-flex items-center gap-1 rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-2 py-1 text-[color:var(--muted)]">
            <span className="h-2 w-2 rounded-full bg-amber-400" /> Future Income
          </span>
        </div>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 6, right: 16, left: 8, bottom: 44 }}>
              <defs>
                <linearGradient id="snowballCompound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDateShort}
                minTickGap={45}
                tickMargin={8}
                interval="preserveStartEnd"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
                tickMargin={8}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
              />
              <Tooltip
                formatter={(value: number, key: string) => [formatCurrency(value), key]}
                labelFormatter={(label) => formatDate(String(label))}
                contentStyle={{
                  backgroundColor: 'var(--surface)',
                  borderColor: 'var(--line)',
                  borderRadius: 10,
                  color: 'var(--text)',
                }}
              />
              <Area
                type="monotone"
                dataKey="investedCapital"
                name="Invested Capital"
                stackId="capital"
                fill="#2563eb"
                stroke="#60a5fa"
                fillOpacity={0.7}
              />
              <Area
                type="monotone"
                dataKey="compoundInterest"
                name="Compound Interest"
                stackId="capital"
                fill="url(#snowballCompound)"
                stroke="#34d399"
                fillOpacity={1}
              />
              <Line
                type="monotone"
                dataKey="futureIncome"
                name="Future Income"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
              <Brush
                dataKey="date"
                height={26}
                travellerWidth={10}
                stroke="#60a5fa"
                tickFormatter={formatDateShort}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default SnowballChart;
