import {
  CartesianGrid,
  Cell,
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
import { getScoreColor } from '../../utils/scoreColor';

type QualityScatterPlotProps = {
  data: AnalyticsMatrixPoint[];
  height?: number;
};

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function QualityScatterPlot({
  data,
  height = 420,
}: QualityScatterPlotProps): JSX.Element {
  return (
    <div className="h-full w-full rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-lg font-semibold text-slate-800">
        Price vs. Quality Matrix
      </h3>

      <ResponsiveContainer width="100%" height={height}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <ReferenceLine x={25} stroke="#cbd5e1" strokeDasharray="4 4" />
          <ReferenceLine y={80} stroke="#cbd5e1" strokeDasharray="4 4" />

          <XAxis
            type="number"
            dataKey="x"
            name="Valuation (P/E)"
            reversed
            tick={{ fill: '#475569', fontSize: 12 }}
            label={{
              value: 'Valuation (P/E) - cheaper is right',
              position: 'insideBottom',
              offset: -8,
              fill: '#334155',
            }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[0, 100]}
            name="Snowball Score"
            tick={{ fill: '#475569', fontSize: 12 }}
            label={{
              value: 'Snowball Score',
              angle: -90,
              position: 'insideLeft',
              fill: '#334155',
            }}
          />
          <ZAxis
            type="number"
            dataKey="z"
            name="Position Value"
            range={[80, 1400]}
          />
          <Tooltip
            cursor={{ strokeDasharray: '4 4' }}
            formatter={(value, name) => {
              if (name === 'Position Value') {
                return [formatCurrency(Number(value)), 'Position Value'];
              }
              return [value, name];
            }}
            contentStyle={{
              borderRadius: 10,
              border: '1px solid #cbd5e1',
              backgroundColor: '#ffffff',
            }}
            labelFormatter={(_, payload) => {
              if (!payload?.length) return '';
              const point = payload[0].payload as AnalyticsMatrixPoint;
              return `${point.symbol} • ${point.name}`;
            }}
          />
          <Scatter name="Holdings" data={data}>
            {data.map((point) => (
              <Cell
                key={point.assetId}
                fill={point.color ?? getScoreColor(point.qualityScore)}
                stroke="#0f172a"
                strokeOpacity={0.16}
              />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default QualityScatterPlot;
