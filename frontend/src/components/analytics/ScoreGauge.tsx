import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts';
import { getScoreColor } from '../../utils/scoreColor';

type ScoreGaugeProps = {
  score: number;
  title?: string;
  subtitle?: string;
  height?: number;
};

export function ScoreGauge({
  score,
  title = 'Portfolio Health Score',
  subtitle = 'Weighted average quality across holdings',
  height = 280,
}: ScoreGaugeProps): JSX.Element {
  const boundedScore = Math.max(0, Math.min(100, score));
  const color = getScoreColor(boundedScore);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
      <p className="mb-3 text-sm text-slate-500">{subtitle}</p>

      <div className="relative h-[240px] w-full">
        <ResponsiveContainer width="100%" height={height}>
          <RadialBarChart
            data={[{ name: 'Portfolio Health', value: boundedScore, fill: color }]}
            startAngle={180}
            endAngle={0}
            innerRadius="72%"
            outerRadius="100%"
            barSize={24}
            cx="50%"
            cy="88%"
          >
            <PolarAngleAxis
              type="number"
              domain={[0, 100]}
              angleAxisId={0}
              tick={false}
            />
            <RadialBar
              background={{ fill: '#e2e8f0' }}
              dataKey="value"
              cornerRadius={14}
            />
          </RadialBarChart>
        </ResponsiveContainer>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-10">
          <span className="text-5xl font-bold" style={{ color }}>
            {Math.round(boundedScore)}
          </span>
          <span className="text-xs uppercase tracking-wide text-slate-500">out of 100</span>
        </div>
      </div>
    </div>
  );
}

export default ScoreGauge;
