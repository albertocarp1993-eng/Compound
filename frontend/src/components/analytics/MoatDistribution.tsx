import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AnalyticsMatrixPoint } from '../../types/analytics';
import { MoatRating } from '../../types/scoring';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

type MoatDistributionProps = {
  data: AnalyticsMatrixPoint[];
  height?: number;
  loading?: boolean;
};

type MoatSlice = {
  moatRating: MoatRating;
  capital: number;
  weight: number;
};

const moatColors: Record<MoatRating, string> = {
  WIDE: '#22c55e',
  NARROW: '#eab308',
  NONE: '#ef4444',
};

const labelByMoat: Record<MoatRating, string> = {
  WIDE: 'Wide',
  NARROW: 'Narrow',
  NONE: 'None',
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function MoatDistribution({ data, height = 260, loading = false }: MoatDistributionProps): JSX.Element {
  const slices = useMemo<MoatSlice[]>(() => {
    const totals = data.reduce(
      (acc, point) => {
        acc[point.moatRating] += point.positionValue;
        return acc;
      },
      { WIDE: 0, NARROW: 0, NONE: 0 } as Record<MoatRating, number>,
    );

    const totalCapital = totals.WIDE + totals.NARROW + totals.NONE;

    return (Object.keys(totals) as MoatRating[]).map((key) => ({
      moatRating: key,
      capital: totals[key],
      weight: totalCapital > 0 ? (totals[key] / totalCapital) * 100 : 0,
    }));
  }, [data]);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Moat Distribution</CardTitle>
          <CardDescription>How much capital sits behind durable businesses.</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[250px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Moat Distribution</CardTitle>
        <CardDescription>How much capital sits behind durable businesses.</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={height}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="capital"
              nameKey="moatRating"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={42}
              label={({ moatRating, weight }) => `${labelByMoat[moatRating as MoatRating]} ${weight.toFixed(0)}%`}
            >
              {slices.map((slice) => (
                <Cell key={slice.moatRating} fill={moatColors[slice.moatRating]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                borderColor: '#334155',
                backgroundColor: '#090f1d',
                color: '#e2e8f0',
              }}
              formatter={(value, _, item) => {
                const moatRating = item.payload.moatRating as MoatRating;
                return [formatCurrency(Number(value)), labelByMoat[moatRating]];
              }}
            />
            <Legend formatter={(value) => labelByMoat[value as MoatRating]} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export default MoatDistribution;
