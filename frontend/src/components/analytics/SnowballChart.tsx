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
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 12, right: 16, left: 8, bottom: 10 }}>
              <defs>
                <linearGradient id="snowballCompound" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#34d399" stopOpacity={0.2} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                minTickGap={45}
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
              />
              <YAxis
                tickFormatter={(value) => `$${Math.round(value / 1000)}k`}
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
                height={22}
                travellerWidth={10}
                stroke="#60a5fa"
                tickFormatter={formatDate}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default SnowballChart;
