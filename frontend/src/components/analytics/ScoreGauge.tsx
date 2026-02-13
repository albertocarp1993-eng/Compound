import {
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
} from 'recharts';
import { getScoreColor } from '../../utils/scoreColor';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

type ScoreGaugeProps = {
  score: number;
  title?: string;
  subtitle?: string;
  height?: number;
  loading?: boolean;
};

export function ScoreGauge({
  score,
  title = 'Portfolio Health',
  subtitle = 'Weighted quality across all positions',
  height = 255,
  loading = false,
}: ScoreGaugeProps): JSX.Element {
  const boundedScore = Math.max(0, Math.min(100, score));
  const color = getScoreColor(boundedScore);

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{subtitle}</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[220px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="relative h-[220px] w-full">
          <ResponsiveContainer width="100%" height={height}>
            <RadialBarChart
              data={[{ name: 'Portfolio Health', value: boundedScore, fill: color }]}
              startAngle={180}
              endAngle={0}
              innerRadius="70%"
              outerRadius="98%"
              barSize={20}
              cx="50%"
              cy="90%"
            >
              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
              <RadialBar background={{ fill: '#1f2937' }} dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>

          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center pt-10">
            <span className="numeric text-5xl font-bold" style={{ color }}>
              {Math.round(boundedScore)}
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-zinc-500">Health Score</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default ScoreGauge;
