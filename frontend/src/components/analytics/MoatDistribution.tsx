import { useMemo } from 'react';
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { AnalyticsMatrixPoint } from '../../types/analytics';
import { MoatRating } from '../../types/scoring';

type MoatDistributionProps = {
  data: AnalyticsMatrixPoint[];
  height?: number;
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
  WIDE: 'Wide Moat',
  NARROW: 'Narrow Moat',
  NONE: 'No Moat',
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function MoatDistribution({
  data,
  height = 320,
}: MoatDistributionProps): JSX.Element {
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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">Moat Distribution</h3>

      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={slices}
            dataKey="capital"
            nameKey="moatRating"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ moatRating, weight }) => `${labelByMoat[moatRating as MoatRating]} ${weight.toFixed(1)}%`}
          >
            {slices.map((slice) => (
              <Cell key={slice.moatRating} fill={moatColors[slice.moatRating]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, _, item) => {
              const moatRating = item.payload.moatRating as MoatRating;
              return [formatCurrency(Number(value)), labelByMoat[moatRating]];
            }}
          />
          <Legend formatter={(value) => labelByMoat[value as MoatRating]} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default MoatDistribution;
