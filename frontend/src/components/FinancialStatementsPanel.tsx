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

type DisplayUnit = 'USD' | 'PERCENT' | 'RATIO' | 'PER_SHARE' | 'SHARES';

type StatementView = 'income' | 'balance' | 'cashflow' | 'ratios';

type StatementMetricDefinition = {
  key: string;
  label: string;
  unit: DisplayUnit;
  getter: (row: AssetFinancialsResponse['financials'][number]) => number;
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
  unit: DisplayUnit,
): string => {
  if (value === null || !Number.isFinite(value)) return 'N/A';
  if (unit === 'USD') return formatMoney(value);
  if (unit === 'PERCENT') return `${value.toFixed(2)}%`;
  if (unit === 'RATIO') return formatRatio(value);
  if (unit === 'PER_SHARE') return `$${value.toFixed(2)}`;
  return formatShares(value);
};

const periodRank: Record<string, number> = { Q4: 4, Q3: 3, Q2: 2, Q1: 1, FY: 0 };

const formatPeriodLabel = (row: AssetFinancialsResponse['financials'][number]): string =>
  row.period === 'QUARTERLY' ? `${row.fiscalYear} ${row.fiscalPeriod}` : `${row.fiscalYear}`;

const incomeStatementDefs: StatementMetricDefinition[] = [
  { key: 'revenue', label: 'Revenue', unit: 'USD', getter: (row) => row.revenue },
  { key: 'grossProfit', label: 'Gross Profit', unit: 'USD', getter: (row) => row.grossProfit },
  { key: 'operatingIncome', label: 'Operating Income', unit: 'USD', getter: (row) => row.operatingIncome },
  { key: 'netIncome', label: 'Net Income', unit: 'USD', getter: (row) => row.netIncome },
  { key: 'researchAndDevelopmentExpense', label: 'R&D Expense', unit: 'USD', getter: (row) => row.researchAndDevelopmentExpense },
  { key: 'sellingGeneralAdministrativeExpense', label: 'SG&A Expense', unit: 'USD', getter: (row) => row.sellingGeneralAdministrativeExpense },
  { key: 'stockBasedCompensation', label: 'Stock-Based Compensation', unit: 'USD', getter: (row) => row.stockBasedCompensation },
  { key: 'eps', label: 'EPS', unit: 'PER_SHARE', getter: (row) => row.eps },
];

const balanceSheetDefs: StatementMetricDefinition[] = [
  { key: 'cashAndEquivalents', label: 'Cash & Equivalents', unit: 'USD', getter: (row) => row.cashAndEquivalents },
  { key: 'currentAssets', label: 'Current Assets', unit: 'USD', getter: (row) => row.currentAssets },
  { key: 'totalAssets', label: 'Total Assets', unit: 'USD', getter: (row) => row.totalAssets },
  { key: 'currentLiabilities', label: 'Current Liabilities', unit: 'USD', getter: (row) => row.currentLiabilities },
  { key: 'totalLiabilities', label: 'Total Liabilities', unit: 'USD', getter: (row) => row.totalLiabilities },
  { key: 'longTermDebt', label: 'Long-Term Debt', unit: 'USD', getter: (row) => row.longTermDebt },
  { key: 'totalEquity', label: 'Total Equity', unit: 'USD', getter: (row) => row.totalEquity },
  { key: 'dilutedSharesOutstanding', label: 'Diluted Shares Out.', unit: 'SHARES', getter: (row) => row.dilutedSharesOutstanding },
];

const cashFlowDefs: StatementMetricDefinition[] = [
  { key: 'operatingCashFlow', label: 'Operating Cash Flow', unit: 'USD', getter: (row) => row.operatingCashFlow },
  { key: 'capitalExpenditures', label: 'Capital Expenditures', unit: 'USD', getter: (row) => row.capitalExpenditures },
  { key: 'freeCashFlow', label: 'Free Cash Flow', unit: 'USD', getter: (row) => row.freeCashFlow },
  { key: 'dividendsPerShare', label: 'Dividends Per Share', unit: 'PER_SHARE', getter: (row) => row.dividendsPerShare },
  { key: 'freeCashFlowMarginPct', label: 'FCF Margin', unit: 'PERCENT', getter: (row) => row.freeCashFlowMarginPct },
  { key: 'fcfConversionPct', label: 'FCF Conversion', unit: 'PERCENT', getter: (row) => row.fcfConversionPct },
  { key: 'capexToRevenuePct', label: 'Capex / Revenue', unit: 'PERCENT', getter: (row) => row.capexToRevenuePct },
  { key: 'sbcToRevenuePct', label: 'SBC / Revenue', unit: 'PERCENT', getter: (row) => row.sbcToRevenuePct },
];

const ratioDefs: StatementMetricDefinition[] = [
  { key: 'grossMarginPct', label: 'Gross Margin', unit: 'PERCENT', getter: (row) => row.grossMarginPct },
  { key: 'operatingMarginPct', label: 'Operating Margin', unit: 'PERCENT', getter: (row) => row.operatingMarginPct },
  { key: 'netMarginPct', label: 'Net Margin', unit: 'PERCENT', getter: (row) => row.netMarginPct },
  { key: 'operatingCashFlowMarginPct', label: 'Operating CF Margin', unit: 'PERCENT', getter: (row) => row.operatingCashFlowMarginPct },
  { key: 'returnOnAssetsPct', label: 'Return on Assets', unit: 'PERCENT', getter: (row) => row.returnOnAssetsPct },
  { key: 'returnOnEquityPct', label: 'Return on Equity', unit: 'PERCENT', getter: (row) => row.returnOnEquityPct },
  { key: 'debtToAssetsPct', label: 'Debt / Assets', unit: 'PERCENT', getter: (row) => row.debtToAssetsPct },
  { key: 'debtToEquityRatio', label: 'Debt / Equity', unit: 'RATIO', getter: (row) => row.debtToEquityRatio },
  { key: 'currentRatio', label: 'Current Ratio', unit: 'RATIO', getter: (row) => row.currentRatio },
  { key: 'interestCoverageRatio', label: 'Interest Coverage', unit: 'RATIO', getter: (row) => row.interestCoverageRatio },
  { key: 'assetTurnoverRatio', label: 'Asset Turnover', unit: 'RATIO', getter: (row) => row.assetTurnoverRatio },
];

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
  const [statementView, setStatementView] = useState<StatementView>('income');

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
  const hasQuarterly = quarterlyRows.length > 0;
  const hasAnnual = annualRows.length > 0;
  const baseRows = statementPeriod === 'QUARTERLY'
    ? hasQuarterly
      ? quarterlyRows
      : annualRows
    : hasAnnual
      ? annualRows
      : data.financials;

  const rowsForDisplay = [...baseRows].sort((a, b) => {
    if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
    return (periodRank[b.fiscalPeriod] ?? 0) - (periodRank[a.fiscalPeriod] ?? 0);
  });

  const periodColumns = rowsForDisplay.slice(0, statementPeriod === 'QUARTERLY' ? 8 : 6);
  const latestColumn = periodColumns[0] ?? null;
  const previousColumn = periodColumns[1] ?? null;
  const samePeriodLastYear = latestColumn
    ? periodColumns.find(
        (row) =>
          row.fiscalYear === latestColumn.fiscalYear - 1 &&
          (statementPeriod === 'ANNUAL' || row.fiscalPeriod === latestColumn.fiscalPeriod),
      ) ?? null
    : null;

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

  const statementTables: Record<StatementView, StatementMetricDefinition[]> = {
    income: incomeStatementDefs,
    balance: balanceSheetDefs,
    cashflow: cashFlowDefs,
    ratios: ratioDefs,
  };
  const activeStatementDefs = statementTables[statementView];

  const metricChange = (
    definition: StatementMetricDefinition,
    from: AssetFinancialsResponse['financials'][number] | null,
    to: AssetFinancialsResponse['financials'][number] | null,
  ): number | null => {
    if (!from || !to) return null;
    const fromValue = definition.getter(from);
    const toValue = definition.getter(to);
    if (!Number.isFinite(fromValue) || !Number.isFinite(toValue) || toValue === 0) return null;

    if (definition.unit === 'PERCENT' || definition.unit === 'RATIO' || definition.unit === 'PER_SHARE') {
      return fromValue - toValue;
    }

    return ((fromValue - toValue) / Math.abs(toValue)) * 100;
  };

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
              disabled={!hasAnnual}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementPeriod === 'ANNUAL'
                  ? 'border-sky-400/50 bg-sky-400/15 text-sky-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              } ${!hasAnnual ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              Annual
            </button>
            <button
              type="button"
              onClick={() => setStatementPeriod('QUARTERLY')}
              disabled={!hasQuarterly}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementPeriod === 'QUARTERLY'
                  ? 'border-sky-400/50 bg-sky-400/15 text-sky-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              } ${!hasQuarterly ? 'cursor-not-allowed opacity-40' : ''}`}
            >
              Quarterly
            </button>
            <p className="text-[11px] text-[color:var(--muted)]">
              Mode: {statementPeriod} | Showing {rowsForDisplay.length} rows
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

        <div className="mt-5">
          <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">
            Statement Explorer
          </p>
          <p className="mt-1 text-[11px] text-[color:var(--muted)]">
            StockAnalysis-style tables for statement, balance sheet, cash flow, and ratios.
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setStatementView('income')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementView === 'income'
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              }`}
            >
              Income Statement
            </button>
            <button
              type="button"
              onClick={() => setStatementView('balance')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementView === 'balance'
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              }`}
            >
              Balance Sheet
            </button>
            <button
              type="button"
              onClick={() => setStatementView('cashflow')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementView === 'cashflow'
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              }`}
            >
              Cash Flow
            </button>
            <button
              type="button"
              onClick={() => setStatementView('ratios')}
              className={`rounded-md border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ${
                statementView === 'ratios'
                  ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300'
                  : 'border-[var(--line)] text-[color:var(--muted)]'
              }`}
            >
              Ratios
            </button>
          </div>

          <div className="mt-3 overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] bg-[color:var(--surface-soft)] text-left text-[color:var(--muted)]">
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">Metric</th>
                  {periodColumns.map((column) => (
                    <th key={`col-${column.fiscalYear}-${column.fiscalPeriod}`} className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">
                      {formatPeriodLabel(column)}
                    </th>
                  ))}
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">QoQ</th>
                  <th className="px-3 py-2 font-semibold uppercase tracking-[0.12em]">YoY</th>
                </tr>
              </thead>
              <tbody>
                {activeStatementDefs.map((definition) => (
                  <tr key={definition.key} className="border-b border-[var(--line)] text-[color:var(--text)]">
                    <td className="px-3 py-2">{definition.label}</td>
                    {periodColumns.map((column) => (
                      <td key={`${definition.key}-${column.fiscalYear}-${column.fiscalPeriod}`} className="numeric px-3 py-2">
                        {formatMetricValue(definition.getter(column), definition.unit)}
                      </td>
                    ))}
                    <td className={`numeric px-3 py-2 ${toneClass(metricChange(definition, latestColumn, previousColumn))}`}>
                      {definition.unit === 'PERCENT' || definition.unit === 'RATIO' || definition.unit === 'PER_SHARE'
                        ? formatMetricValue(metricChange(definition, latestColumn, previousColumn), definition.unit)
                        : formatDeltaPct(metricChange(definition, latestColumn, previousColumn))}
                    </td>
                    <td className={`numeric px-3 py-2 ${toneClass(metricChange(definition, latestColumn, samePeriodLastYear))}`}>
                      {definition.unit === 'PERCENT' || definition.unit === 'RATIO' || definition.unit === 'PER_SHARE'
                        ? formatMetricValue(metricChange(definition, latestColumn, samePeriodLastYear), definition.unit)
                        : formatDeltaPct(metricChange(definition, latestColumn, samePeriodLastYear))}
                    </td>
                  </tr>
                ))}
                {activeStatementDefs.length === 0 && (
                  <tr>
                    <td colSpan={periodColumns.length + 3} className="px-3 py-3 text-sm text-[color:var(--muted)]">
                      No statement metrics available for this view.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {comprehensiveMetrics.length > 0 && (
            <p className="mt-2 text-[11px] text-[color:var(--muted)]">
              Latest quarter labels: {latestQuarterLabel}, {priorQuarterLabel}, {sameQuarterLastYearLabel}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default FinancialStatementsPanel;
