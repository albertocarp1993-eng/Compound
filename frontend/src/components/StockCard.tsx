import { ScoreBreakdownItem, MoatRating } from '../types/scoring';
import { formatSignedPoints, getScoreColor } from '../utils/scoreColor';

type StockCardProps = {
  symbol: string;
  name: string;
  price: number;
  score: number;
  moatRating: MoatRating;
  peRatio?: number;
  roe?: number;
  debtToEquity?: number;
  dividendSafetyScore?: number;
  breakdown: ScoreBreakdownItem[];
  selected?: boolean;
  onSelect?: () => void;
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
  peRatio,
  roe,
  debtToEquity,
  dividendSafetyScore,
  breakdown,
  selected = false,
  onSelect,
}: StockCardProps): JSX.Element {
  const color = getScoreColor(score);

  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        selected ? 'border-sky-300 ring-2 ring-sky-100' : 'border-slate-200'
      }`}
    >
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

      <div className="mb-4 grid grid-cols-2 gap-2 text-xs text-slate-600 md:grid-cols-4">
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="uppercase tracking-wide text-slate-500">P/E</p>
          <p className="font-semibold text-slate-900">{peRatio?.toFixed(2) ?? 'N/A'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="uppercase tracking-wide text-slate-500">ROE</p>
          <p className="font-semibold text-slate-900">{roe !== undefined ? `${roe.toFixed(1)}%` : 'N/A'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="uppercase tracking-wide text-slate-500">Debt/Equity</p>
          <p className="font-semibold text-slate-900">{debtToEquity?.toFixed(2) ?? 'N/A'}</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-3 py-2">
          <p className="uppercase tracking-wide text-slate-500">Dividend Safety</p>
          <p className="font-semibold text-slate-900">
            {dividendSafetyScore !== undefined ? `${dividendSafetyScore}/100` : 'N/A'}
          </p>
        </div>
      </div>

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

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onSelect}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:border-sky-300 hover:text-sky-700"
        >
          Open Stock Page
        </button>
      </div>
    </article>
  );
}

export default StockCard;
