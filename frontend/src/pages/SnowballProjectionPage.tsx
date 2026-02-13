import SnowballChart from '../components/analytics/SnowballChart';
import TremorPerformancePanel from '../components/analytics/TremorPerformancePanel';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useDashboardLayoutContext } from '../components/layout/DashboardLayout';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

export function SnowballProjectionPage(): JSX.Element {
  const { dashboardData } = useDashboardLayoutContext();

  const summary = dashboardData.snowball?.summary;

  return (
    <>
      <TremorPerformancePanel
        points={dashboardData.snowball?.points ?? []}
        loading={dashboardData.loading}
      />

      <section className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="numeric text-xl font-semibold text-[color:var(--text)]">{formatCurrency(summary?.totalValue ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Invested Capital</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="numeric text-xl font-semibold text-[color:var(--text)]">{formatCurrency(summary?.investedCapital ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Compound Effect</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="numeric text-xl font-semibold text-emerald-300">{formatCurrency(summary?.compoundInterest ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Future Income</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="numeric text-xl font-semibold text-amber-300">{formatCurrency(summary?.futureIncome ?? 0)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-1">
            <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Total Dividends</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="numeric text-xl font-semibold text-sky-300">{formatCurrency(summary?.totalDividends ?? 0)}</p>
          </CardContent>
        </Card>
      </section>

      <section>
        <SnowballChart data={dashboardData.snowball?.points ?? []} loading={dashboardData.loading} />
      </section>
    </>
  );
}

export default SnowballProjectionPage;
