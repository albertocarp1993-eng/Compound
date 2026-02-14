import { useState } from 'react';
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

const formatRatio = (value: number): string => value.toFixed(2);

const formatShares = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);

const formatMetricValue = (
  value: number | null,
  unit: 'USD' | 'PERCENT' | 'RATIO' | 'PER_SHARE' | 'SHARES',
): string => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  if (unit === 'USD') return formatMoney(value);
  if (unit === 'PERCENT') return `${value.toFixed(2)}%`;
  if (unit === 'RATIO') return formatRatio(value);
  if (unit === 'PER_SHARE') return `$${value.toFixed(2)}`;
  return formatShares(value);
};

const formatDeltaPct = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

const toneClass = (value: number | null): string => {
  if (value === null || !Number.isFinite(value)) return 'text-[color:var(--muted)]';
  return value >= 0 ? 'text-emerald-400' : 'text-rose-400';
};

export function FinancialStatementsPanel({
  data,
  loading,
  error,
}: FinancialStatementsPanelProps): JSX.Element {
  const [statementPeriod, setStatementPeriod] = useState<'ANNUAL' | 'QUARTERLY'>('QUARTERLY');

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
          <p className="text-sm text-[color:var(--muted)]">Select a company to view financial statements.</p>
        </CardContent>
      </Card>
    );
  }

  const annualRows = data.financials.filter((row) => row.period === 'ANNUAL');
  const quarterlyRows = data.financials.filter((row) => row.period === 'QUARTERLY');
  const baseRows = statementPeriod === 'QUARTERLY'
    ? quarterlyRows.length > 0
      ? quarterlyRows
      : annualRows
    : annualRows.length > 0
      ? annualRows
      : data.financials;

  const rowsForDisplay = [...baseRows].sort((a, b) => {
    if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
    const periodRank: Record<string, number> = { Q4: 4, Q3: 3, Q2: 2, Q1: 1, FY: 0 };
    return (periodRank[b.fiscalPeriod] ?? 0) - (periodRank[a.fiscalPeriod] ?? 0);
  });

  const latest = rowsForDisplay[0];
  const chartData = [...rowsForDisplay]
    .reverse()
    .map((item) => ({
      periodLabel: item.period === 'QUARTERLY' ? `${item.fiscalYear} ${item.fiscalPeriod}` : `${item.fiscalYear}`,
      Revenue: item.revenue,
      'Net Income': item.netIncome,
      'Free Cash Flow': item.freeCashFlow,
    }));
  const comprehensiveMetrics = data.financialMetricTable ?? [];
  const latestQuarterLabel = data.metrics?.qoq?.latestLabel ?? 'Latest';
  const priorQuarterLabel = data.metrics?.qoq?.previousLabel ?? 'Prior Quarter';
  const sameQuarterLastYearLabel = data.metrics?.yoy?.previousLabel ?? 'Same Quarter LY';

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

        {(annualRows.length > 0 || quarterlyRows.length > 0) && (
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatementPeriod('ANNUAL')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementPeriod === 'ANNUAL'
                  ? 'border-sky-400/50 bg-sky-400/15 text-sky-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              }`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setStatementPeriod('QUARTERLY')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementPeriod === 'QUARTERLY'
                  ? 'border-sky-400/50 bg-sky-400/15 text-sky-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              }`}
            >
              Quarterly
            </button>
            <p className="text-[11px] text-[color:var(--muted)]">
              Showing {rowsForDisplay.length} rows
            </p>
          </div>
        )}

        <div className="mb-5 h-[280px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 14, right: 14, left: 10, bottom: 30 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--line)" />
              <XAxis dataKey="periodLabel" tick={{ fill: 'var(--muted)', fontSize: 11 }} interval="preserveStartEnd" />
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
              <Legend verticalAlign="bottom" height={24} wrapperStyle={{ color: 'var(--muted)', fontSize: 11 }} />
              <Line type="monotone" dataKey="Revenue" stroke="#38bdf8" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Net Income" stroke="#22c55e" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Free Cash Flow" stroke="#f59e0b" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--line)] bg-[color:var(--surface-soft)] text-left text-[color:var(--muted)]">
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Year</th>
                <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Period</th>
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
              {rowsForDisplay.map((row) => (
                <tr key={`${row.fiscalYear}-${row.fiscalPeriod}`} className="border-b border-[var(--line)] text-[color:var(--text)]">
                  <td className="numeric px-3 py-2">{row.fiscalYear}</td>
                  <td className="px-3 py-2">{row.fiscalPeriod}</td>
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

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Comprehensive Metrics Matrix
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--muted)]">
            30+ metrics from SEC filings with QoQ and YoY deltas.
          </p>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[color:var(--surface-soft)] text-left text-[color:var(--muted)]">
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Category</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Metric</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">{latestQuarterLabel}</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">{priorQuarterLabel}</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">QoQ</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">{sameQuarterLastYearLabel}</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">YoY</th>
                </tr>
              </thead>
              <tbody>
                {comprehensiveMetrics.map((metricRow) => (
                  <tr key={metricRow.key} className="border-b border-[var(--line)] text-[color:var(--text)]">
                    <td className="px-3 py-2 text-[color:var(--muted)]">{metricRow.category}</td>
                    <td className="px-3 py-2">{metricRow.metric}</td>
                    <td className="numeric px-3 py-2">{formatMetricValue(metricRow.latestValue, metricRow.unit)}</td>
                    <td className="numeric px-3 py-2">{formatMetricValue(metricRow.priorQuarterValue, metricRow.unit)}</td>
                    <td className={`numeric px-3 py-2 ${toneClass(metricRow.qoqChangePct)}`}>
                      {formatDeltaPct(metricRow.qoqChangePct)}
                    </td>
                    <td className="numeric px-3 py-2">{formatMetricValue(metricRow.sameQuarterLastYearValue, metricRow.unit)}</td>
                    <td className={`numeric px-3 py-2 ${toneClass(metricRow.yoyChangePct)}`}>
                      {formatDeltaPct(metricRow.yoyChangePct)}
                    </td>
                  </tr>
                ))}
                {comprehensiveMetrics.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-3 text-sm text-[color:var(--muted)]">
                      Comprehensive metrics are not available for this symbol yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialStatementsPanel;
