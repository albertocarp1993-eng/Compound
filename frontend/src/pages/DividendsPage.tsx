import { useMemo } from 'react';
import DividendPayoutHeatmap from '../components/analytics/DividendPayoutHeatmap';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useDashboardLayoutContext } from '../components/layout/DashboardLayout';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

export function DividendsPage(): JSX.Element {
  const { dashboardData } = useDashboardLayoutContext();

  const ranked = useMemo(
    () => [...dashboardData.holdings].sort((a, b) => b.annualDividendIncome - a.annualDividendIncome),
    [dashboardData.holdings],
  );

  const annualIncome = ranked.reduce((acc, item) => acc + item.annualDividendIncome, 0);

  return (
    <section className="grid grid-cols-12 gap-4">
      <div className="col-span-12 xl:col-span-8">
        <DividendPayoutHeatmap
          year={dashboardData.payoutCalendar?.year ?? new Date().getUTCFullYear()}
          data={dashboardData.payoutCalendar?.days ?? []}
          projectedAnnualDividends={dashboardData.payoutCalendar?.projectedAnnualDividends ?? annualIncome}
          loading={dashboardData.loading}
        />
      </div>

      <div className="col-span-12 xl:col-span-4">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Dividend Engine</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-3 rounded-lg border border-[var(--line)] bg-[color:var(--surface-soft)] p-3">
              <p className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Estimated Annual Income</p>
              <p className="numeric mt-1 text-2xl font-semibold text-emerald-300">{formatCurrency(annualIncome)}</p>
            </div>

            <div className="space-y-2">
              {ranked.slice(0, 8).map((holding) => (
                <div key={holding.assetId} className="flex items-center justify-between rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] px-3 py-2">
                  <div>
                    <p className="numeric text-sm font-semibold text-[color:var(--text)]">{holding.symbol}</p>
                    <p className="text-xs text-[color:var(--muted)]">{holding.name}</p>
                  </div>

                  <div className="text-right">
                    <p className="numeric text-sm font-semibold text-emerald-300">{formatCurrency(holding.annualDividendIncome)}</p>
                    <Badge variant={holding.dripEnabled ? 'success' : 'default'}>
                      {holding.dripEnabled ? 'DRIP On' : 'DRIP Off'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

export default DividendsPage;
