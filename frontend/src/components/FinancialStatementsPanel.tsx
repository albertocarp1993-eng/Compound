import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AssetFinancialsResponse } from '../types/financials';
import { getScoreColor } from '../utils/scoreColor';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

type FinancialStatementsPanelProps = {
  data: AssetFinancialsResponse | null;
  loading: boolean;
  error: string | null;
};

const formatMoney = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

const formatPct = (value: number): string => `${value.toFixed(1)}%`;

export function FinancialStatementsPanel({
  data,
  loading,
  error,
}: FinancialStatementsPanelProps): JSX.Element {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Financials</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-52" />
          <Skeleton className="mt-3 h-[260px] w-full" />
          <Skeleton className="mt-3 h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-rose-700/50 bg-rose-950/40">
        <CardHeader>
          <CardTitle>Company Financials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-rose-300">Failed to load financials: {error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Financials</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-400">Select a company to view financial statements.</p>
        </CardContent>
      </Card>
    );
  }

  const latest = data.financials[0];
  const chartData = [...data.financials]
    .reverse()
    .map((item) => ({
      year: `${item.fiscalYear}`,
      Revenue: item.revenue,
      'Net Income': item.netIncome,
      'Free Cash Flow': item.freeCashFlow,
    }));

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[color:var(--muted)]">Company Financials</p>
            <CardTitle className="text-2xl">
              {data.name} ({data.symbol})
            </CardTitle>
            <p className="text-sm text-[color:var(--muted)]">Statement values reported in USD</p>
          </div>

          {data.fundamentals && (
            <div className="flex items-center gap-2">
              <Badge variant={data.fundamentals.verdict === 'BUY' ? 'success' : data.fundamentals.verdict === 'HOLD' ? 'warning' : 'danger'}>
                {data.fundamentals.verdict}
              </Badge>
              <span className="numeric text-lg font-semibold" style={{ color: getScoreColor(data.fundamentals.snowballScore) }}>
                {data.fundamentals.snowballScore}
              </span>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {latest && (
          <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
            <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">Latest Revenue</p>
              <p className="numeric text-lg font-semibold text-[color:var(--text)]">{formatMoney(latest.revenue)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">Net Income</p>
              <p className="numeric text-lg font-semibold text-[color:var(--text)]">{formatMoney(latest.netIncome)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">Free Cash Flow</p>
              <p className="numeric text-lg font-semibold text-[color:var(--text)]">{formatMoney(latest.freeCashFlow)}</p>
            </div>
            <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] px-4 py-3">
              <p className="text-[11px] uppercase tracking-[0.12em] text-[color:var(--muted)]">Net Margin</p>
              <p className="numeric text-lg font-semibold text-[color:var(--text)]">{formatPct(latest.netMarginPct)}</p>
            </div>
          </div>
        )}

        <div className="mb-5 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 14, left: 10, bottom: 8 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" />
              <XAxis dataKey="year" tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 11 }} />
              <Tooltip
                formatter={(value) => formatMoney(Number(value))}
                contentStyle={{
                  borderRadius: 10,
                  borderColor: 'var(--line)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--text)',
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="Revenue" stroke="#38bdf8" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Net Income" stroke="#22c55e" strokeWidth={2} dot />
              <Line type="monotone" dataKey="Free Cash Flow" stroke="#f59e0b" strokeWidth={2} dot />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[color:var(--surface-soft)] text-left text-[color:var(--muted)]">
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Year</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Revenue</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Operating Income</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Net Income</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">EPS</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">FCF</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Gross Margin</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Debt / Assets</th>
              </tr>
            </thead>
            <tbody>
              {data.financials.map((row) => (
                <tr key={`${row.fiscalYear}-${row.fiscalPeriod}`} className="border-b border-[var(--line)] text-[color:var(--text)]">
                  <td className="numeric px-3 py-2">{row.fiscalYear}</td>
                  <td className="numeric px-3 py-2">{formatMoney(row.revenue)}</td>
                  <td className="numeric px-3 py-2">{formatMoney(row.operatingIncome)}</td>
                  <td className="numeric px-3 py-2">{formatMoney(row.netIncome)}</td>
                  <td className="numeric px-3 py-2">{row.eps.toFixed(2)}</td>
                  <td className="numeric px-3 py-2">{formatMoney(row.freeCashFlow)}</td>
                  <td className="numeric px-3 py-2">{formatPct(row.grossMarginPct)}</td>
                  <td className="numeric px-3 py-2">{formatPct(row.debtToAssetsPct)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialStatementsPanel;
