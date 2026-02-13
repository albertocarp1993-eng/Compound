import { Fragment, useMemo, useState } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ChevronDown, ChevronRight, ExternalLink, PencilLine, Trash2 } from 'lucide-react';
import { HoldingAnalytics } from '../types/analytics';
import { formatSignedPoints, getScoreColor } from '../utils/scoreColor';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Skeleton } from './ui/skeleton';

type HoldingDraft = {
  quantity: string;
  avgCost: string;
  dripEnabled: boolean;
};

type RowBusyType = 'save' | 'delete' | null;

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const Sparkline = ({ values }: { values: number[] }): JSX.Element => {
  const points = useMemo(() => {
    if (values.length === 0) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = Math.max(0.0001, max - min);

    return values
      .map((value, index) => {
        const x = (index / (values.length - 1 || 1)) * 80;
        const y = 22 - ((value - min) / range) * 20;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  return (
    <svg viewBox="0 0 80 24" className="h-6 w-20">
      <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={points} />
    </svg>
  );
};

type AssetTableProps = {
  data: HoldingAnalytics[];
  loading?: boolean;
  onOpenStock: (symbol: string) => void;
  onUpdatePosition?: (
    holdingId: number,
    payload: { quantity: number; avgCost: number; dripEnabled: boolean },
  ) => Promise<void>;
  onDeletePosition?: (holdingId: number) => Promise<void>;
};

export function AssetTable({
  data,
  loading = false,
  onOpenStock,
  onUpdatePosition,
  onDeletePosition,
}: AssetTableProps): JSX.Element {
  const [drafts, setDrafts] = useState<Record<number, HoldingDraft>>({});
  const [rowErrors, setRowErrors] = useState<Record<number, string | null>>({});
  const [rowBusy, setRowBusy] = useState<Record<number, RowBusyType>>({});

  const columns = useMemo<ColumnDef<HoldingAnalytics>[]>(
    () => [
      {
        id: 'expand',
        header: '',
        size: 36,
        cell: ({ row }) =>
          row.getCanExpand() ? (
            <button
              type="button"
              onClick={row.getToggleExpandedHandler()}
              className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
            >
              {row.getIsExpanded() ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </button>
          ) : null,
      },
      {
        accessorKey: 'symbol',
        header: 'Ticker',
        cell: (info) => (
          <span className="numeric font-semibold text-[color:var(--text)]">{String(info.getValue())}</span>
        ),
      },
      {
        accessorKey: 'name',
        header: 'Name',
        cell: (info) => <span className="text-[color:var(--muted)]">{String(info.getValue())}</span>,
      },
      {
        id: 'price',
        header: 'Price',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <span className="numeric text-[color:var(--text)]">
              {formatCurrency(row.original.currentPrice)}
            </span>
            <Sparkline values={row.original.sparkline} />
          </div>
        ),
      },
      {
        id: 'quality',
        header: 'Quality Score',
        cell: ({ row }) => {
          const score = row.original.calculatedScore;
          const variant = score > 80 ? 'success' : score >= 50 ? 'warning' : 'danger';
          return <Badge variant={variant}>Q {score}</Badge>;
        },
      },
      {
        id: 'yield',
        header: 'Yield',
        cell: ({ row }) => {
          const yieldPct =
            row.original.value > 0
              ? (row.original.annualDividendIncome / row.original.value) * 100
              : 0;
          return <span className="numeric text-[color:var(--muted)]">{yieldPct.toFixed(2)}%</span>;
        },
      },
      {
        id: 'impact',
        header: 'Snowball Impact (10Y)',
        cell: ({ row }) => (
          <span className="numeric font-semibold text-emerald-300">
            {formatCurrency(row.original.snowballImpact10y)}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenStock(row.original.symbol)}
            className="h-7 px-2 text-[11px]"
          >
            Open
            <ExternalLink className="ml-1 h-3 w-3" />
          </Button>
        ),
      },
    ],
    [onOpenStock],
  );

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
  });

  const getDraft = (holding: HoldingAnalytics): HoldingDraft =>
    drafts[holding.holdingId] ?? {
      quantity: String(holding.quantity),
      avgCost: String(holding.avgCost),
      dripEnabled: holding.dripEnabled,
    };

  const setDraft = (holdingId: number, patch: Partial<HoldingDraft>): void => {
    setDrafts((prev) => ({
      ...prev,
      [holdingId]: {
        quantity: prev[holdingId]?.quantity ?? '',
        avgCost: prev[holdingId]?.avgCost ?? '',
        dripEnabled: prev[holdingId]?.dripEnabled ?? true,
        ...patch,
      },
    }));
  };

  const handleSavePosition = async (holding: HoldingAnalytics): Promise<void> => {
    if (!onUpdatePosition) return;

    const draft = getDraft(holding);
    const quantity = Number(draft.quantity);
    const avgCost = Number(draft.avgCost);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setRowErrors((prev) => ({ ...prev, [holding.holdingId]: 'Quantity must be a positive number.' }));
      return;
    }

    if (!Number.isFinite(avgCost) || avgCost <= 0) {
      setRowErrors((prev) => ({ ...prev, [holding.holdingId]: 'Avg cost must be a positive number.' }));
      return;
    }

    setRowBusy((prev) => ({ ...prev, [holding.holdingId]: 'save' }));
    setRowErrors((prev) => ({ ...prev, [holding.holdingId]: null }));

    try {
      await onUpdatePosition(holding.holdingId, {
        quantity,
        avgCost,
        dripEnabled: draft.dripEnabled,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save position changes.';
      setRowErrors((prev) => ({ ...prev, [holding.holdingId]: message }));
    } finally {
      setRowBusy((prev) => ({ ...prev, [holding.holdingId]: null }));
    }
  };

  const handleDeletePosition = async (holding: HoldingAnalytics): Promise<void> => {
    if (!onDeletePosition) return;

    const confirmed = window.confirm(
      `Remove ${holding.symbol} from this portfolio? This deletes the position only.`,
    );
    if (!confirmed) return;

    setRowBusy((prev) => ({ ...prev, [holding.holdingId]: 'delete' }));
    setRowErrors((prev) => ({ ...prev, [holding.holdingId]: null }));

    try {
      await onDeletePosition(holding.holdingId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete position.';
      setRowErrors((prev) => ({ ...prev, [holding.holdingId]: message }));
    } finally {
      setRowBusy((prev) => ({ ...prev, [holding.holdingId]: null }));
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Asset Command Center</CardTitle>
        <CardDescription>
          Compact CRM table with quality diagnostics, live valuation context, and expansion logic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-xs">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr key={headerGroup.id} className="border-b border-[var(--line)] text-[color:var(--muted)]">
                    {headerGroup.headers.map((header) => (
                      <th key={header.id} className="px-2 py-2 font-semibold uppercase tracking-[0.12em]">
                        {header.isPlaceholder
                          ? null
                          : flexRender(header.column.columnDef.header, header.getContext())}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody>
                {table.getRowModel().rows.map((row) => {
                  const draft = getDraft(row.original);
                  const busyState = rowBusy[row.original.holdingId] ?? null;
                  const rowError = rowErrors[row.original.holdingId];

                  return (
                    <Fragment key={row.id}>
                      <tr className="border-b border-[var(--line)] text-[color:var(--text)] hover:bg-[color:var(--surface-soft)]">
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-2 py-2 align-middle">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                      {row.getIsExpanded() && (
                        <tr className="border-b border-[var(--line)] bg-[color:var(--surface-soft)]">
                          <td colSpan={columns.length} className="px-3 py-3">
                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-[160px_1fr_420px]">
                              <div>
                                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                                  Mini Trend
                                </p>
                                <div className="rounded-md border border-[var(--line)] bg-[color:var(--surface)] p-2">
                                  <Sparkline values={row.original.sparkline} />
                                </div>
                              </div>

                              <div>
                                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                                  Quality Logic
                                </p>
                                <div className="overflow-x-auto rounded-md border border-[var(--line)] bg-[color:var(--surface)]">
                                  <table className="w-full text-[11px]">
                                    <thead>
                                      <tr className="border-b border-[var(--line)] text-[color:var(--muted)]">
                                        <th className="px-2 py-1 text-left">Metric</th>
                                        <th className="px-2 py-1 text-left">Value</th>
                                        <th className="px-2 py-1 text-left">Impact</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {row.original.breakdown.map((item) => (
                                        <tr
                                          key={`${row.original.symbol}-${item.metric}`}
                                          className="border-b border-[var(--line)] text-[color:var(--text)]"
                                        >
                                          <td className="px-2 py-1">{item.metric}</td>
                                          <td className="px-2 py-1">{item.value}</td>
                                          <td
                                            className="px-2 py-1"
                                            style={{ color: getScoreColor(item.points > 0 ? 85 : 35) }}
                                          >
                                            {formatSignedPoints(item.points)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>

                              <div>
                                <p className="mb-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                                  Position Settings
                                </p>
                                <div className="rounded-md border border-[var(--line)] bg-[color:var(--surface)] p-3">
                                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                    <label className="text-[11px] text-[color:var(--muted)]">
                                      Quantity
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={draft.quantity}
                                        onChange={(event) =>
                                          setDraft(row.original.holdingId, { quantity: event.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-2 text-sm text-[color:var(--text)]"
                                      />
                                    </label>

                                    <label className="text-[11px] text-[color:var(--muted)]">
                                      Avg Cost
                                      <input
                                        type="number"
                                        min="0"
                                        step="0.0001"
                                        value={draft.avgCost}
                                        onChange={(event) =>
                                          setDraft(row.original.holdingId, { avgCost: event.target.value })
                                        }
                                        className="mt-1 h-9 w-full rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-2 text-sm text-[color:var(--text)]"
                                      />
                                    </label>
                                  </div>

                                  <label className="mt-2 inline-flex items-center gap-2 text-xs text-[color:var(--muted)]">
                                    <input
                                      type="checkbox"
                                      checked={draft.dripEnabled}
                                      onChange={(event) =>
                                        setDraft(row.original.holdingId, {
                                          dripEnabled: event.target.checked,
                                        })
                                      }
                                    />
                                    DRIP enabled
                                  </label>

                                  {rowError && <p className="mt-2 text-xs text-rose-400">{rowError}</p>}

                                  <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                                    {onUpdatePosition && (
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => void handleSavePosition(row.original)}
                                        disabled={busyState !== null}
                                      >
                                        <PencilLine className="mr-1 h-3.5 w-3.5" />
                                        {busyState === 'save' ? 'Saving...' : 'Save Changes'}
                                      </Button>
                                    )}

                                    {onDeletePosition && (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => void handleDeletePosition(row.original)}
                                        disabled={busyState !== null}
                                      >
                                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                                        {busyState === 'delete' ? 'Removing...' : 'Remove Position'}
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AssetTable;
