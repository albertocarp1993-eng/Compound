import { BadgeDollarSign, Gauge, Shield, TrendingDown, TrendingUp } from 'lucide-react';
import { AnalyticsMatrixPoint } from '../types/analytics';
import { formatSignedPoints, getScoreColor } from '../utils/scoreColor';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from './ui/sheet';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type DealRoomDrawerProps = {
  point: AnalyticsMatrixPoint | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenStock: (symbol: string) => void;
};

export function DealRoomDrawer({ point, open, onOpenChange, onOpenStock }: DealRoomDrawerProps): JSX.Element {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        {!point ? null : (
          <>
            <SheetHeader>
              <div className="mb-2 flex items-center gap-2">
                <Badge variant={point.verdict === 'BUY' ? 'success' : point.verdict === 'HOLD' ? 'warning' : 'danger'}>
                  {point.verdict}
                </Badge>
                <span className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Deal Room</span>
              </div>
              <SheetTitle className="text-2xl">
                {point.name} <span className="numeric text-[color:var(--muted)]">({point.symbol})</span>
              </SheetTitle>
              <SheetDescription>
                Drill-down for valuation, quality, moat context, and position exposure.
              </SheetDescription>
            </SheetHeader>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] p-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <Gauge className="h-3.5 w-3.5" /> Quality Score
                </p>
                <p className="numeric text-2xl font-semibold" style={{ color: getScoreColor(point.qualityScore) }}>
                  {point.qualityScore}
                </p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] p-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <BadgeDollarSign className="h-3.5 w-3.5" /> Position Value
                </p>
                <p className="numeric text-2xl font-semibold text-[color:var(--text)]">{formatCurrency(point.positionValue)}</p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] p-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <TrendingDown className="h-3.5 w-3.5" /> Valuation (P/E)
                </p>
                <p className="numeric text-2xl font-semibold text-[color:var(--text)]">{point.peRatio.toFixed(2)}</p>
              </div>

              <div className="rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] p-3">
                <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                  <Shield className="h-3.5 w-3.5" /> Moat / Weight
                </p>
                <p className="numeric text-2xl font-semibold text-[color:var(--text)]">{point.moatRating}</p>
                <p className="numeric text-xs text-[color:var(--muted)]">{point.portfolioWeight.toFixed(2)}% weight</p>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] p-3 text-sm text-[color:var(--text)]">
              <p className="mb-1 flex items-center gap-1 text-[11px] uppercase tracking-[0.14em] text-[color:var(--muted)]">
                <TrendingUp className="h-3.5 w-3.5" /> Position Interpretation
              </p>
              <p>
                {point.qualityScore >= 80
                  ? 'High-conviction quality profile.'
                  : point.qualityScore >= 50
                    ? 'Balanced quality profile requiring active monitoring.'
                    : 'Low-quality profile; consider risk control and position sizing.'}
              </p>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Target quadrant advantage: {formatSignedPoints(point.qualityScore - point.peRatio)} quality-minus-valuation spread.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-end">
              <Button onClick={() => onOpenStock(point.symbol)}>Open Full Stock Workspace</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default DealRoomDrawer;
