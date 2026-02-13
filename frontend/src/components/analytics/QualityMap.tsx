import {
  CartesianGrid,
  Cell,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import { AnalyticsMatrixPoint } from '../../types/analytics';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

type QualityMapProps = {
  data: AnalyticsMatrixPoint[];
  loading?: boolean;
  onSelectPoint?: (point: AnalyticsMatrixPoint) => void;
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function QualityMap({ data, loading = false, onSelectPoint }: QualityMapProps): JSX.Element {
  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle>Quality Map</CardTitle>
          <CardDescription>Valuation, quality score, and position size.</CardDescription>
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
        <CardTitle>Quality Map</CardTitle>
        <CardDescription>
          Target top-right: high quality score with lower valuation multiple.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 15, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid stroke="var(--line)" strokeDasharray="4 4" />
              <ReferenceArea
                x1={0}
                x2={25}
                y1={80}
                y2={100}
                fill="#16a34a"
                fillOpacity={0.09}
                ifOverflow="visible"
              />
              <ReferenceLine x={25} stroke="#475569" strokeDasharray="5 5" />
              <ReferenceLine y={80} stroke="#475569" strokeDasharray="5 5" />
              <XAxis
                type="number"
                dataKey="x"
                reversed
                name="Valuation (P/E)"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                label={{
                  value: 'Valuation (P/E) - cheaper is right',
                  position: 'insideBottom',
                  offset: -4,
                  fill: 'var(--muted)',
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={[0, 100]}
                name="Quality Score"
                tick={{ fill: 'var(--muted)', fontSize: 11 }}
                label={{
                  value: 'Quality Score',
                  angle: -90,
                  position: 'insideLeft',
                  fill: 'var(--muted)',
                }}
              />
              <ZAxis type="number" dataKey="z" range={[90, 1300]} name="Position Value" />
              <Tooltip
                cursor={{ strokeDasharray: '5 5', stroke: '#334155' }}
                contentStyle={{
                  borderRadius: 10,
                  borderColor: 'var(--line)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                }}
                formatter={(value: number, label: string) => {
                  if (label === 'Position Value') {
                    return [formatCurrency(value), 'Position Value'];
                  }
                  return [value, label];
                }}
                labelFormatter={(_, payload) => {
                  const point = payload?.[0]?.payload as AnalyticsMatrixPoint | undefined;
                  if (!point) return '';
                  return `${point.symbol} - ${point.name} • ${point.verdict}`;
                }}
              />
              <Scatter
                data={data}
                name="Holdings"
                onClick={(payload) => {
                  const point = payload as AnalyticsMatrixPoint | undefined;
                  if (point && onSelectPoint) onSelectPoint(point);
                }}
              >
                {data.map((point) => (
                  <Cell
                    key={point.assetId}
                    fill={point.color}
                    stroke="#111827"
                    strokeOpacity={0.8}
                    className="cursor-pointer"
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

export default QualityMap;
