import { ScoreBreakdownItem, MoatRating } from '../types/scoring';
import { formatSignedPoints, getScoreColor } from '../utils/scoreColor';

type StockCardProps = {
  symbol: string;
  name: string;
  price: number;
  score: number;
  moatRating: MoatRating;
  breakdown: ScoreBreakdownItem[];
};

const moatTagStyles: Record<MoatRating, string> = {
  WIDE: 'bg-emerald-100 text-emerald-800',
  NARROW: 'bg-amber-100 text-amber-800',
  NONE: 'bg-rose-100 text-rose-800',
};

const formatPrice = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export function StockCard({
  symbol,
  name,
  price,
  score,
  moatRating,
  breakdown,
}: StockCardProps): JSX.Element {
  const color = getScoreColor(score);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wider text-slate-500">{symbol}</p>
          <h3 className="text-xl font-semibold text-slate-900">{name}</h3>
          <p className="text-sm text-slate-500">Current Price: {formatPrice(price)}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${moatTagStyles[moatRating]}`}
          >
            {moatRating} moat
          </span>
          <div
            className="grid h-20 w-20 place-items-center rounded-full border-4"
            style={{ borderColor: color }}
          >
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color }}>
                {Math.round(score)}
              </p>
              <p className="text-[10px] uppercase tracking-wide text-slate-500">Snowball</p>
            </div>
          </div>
        </div>
      </header>

      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-600">
          Score Breakdown
        </h4>

        <table className="w-full border-collapse overflow-hidden rounded-lg text-left text-sm">
          <thead>
            <tr className="bg-slate-100 text-slate-600">
              <th className="px-3 py-2 font-semibold">Metric</th>
              <th className="px-3 py-2 font-semibold">Value</th>
              <th className="px-3 py-2 font-semibold">Impact</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item) => (
              <tr key={item.metric} className="border-b border-slate-100 text-slate-700">
                <td className="px-3 py-2">{item.metric}</td>
                <td className="px-3 py-2">{item.value}</td>
                <td
                  className="px-3 py-2 font-semibold"
                  style={{ color: item.points >= 0 ? '#16a34a' : '#dc2626' }}
                  title={item.reason}
                >
                  {formatSignedPoints(item.points)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </article>
  );
}

export default StockCard;
