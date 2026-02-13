import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Newspaper, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { getAssetComprehensive } from '../api/client';
import FinancialStatementsPanel from '../components/FinancialStatementsPanel';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Skeleton } from '../components/ui/skeleton';
import { AssetComprehensiveResponse } from '../types/assets';
import { getScoreColor } from '../utils/scoreColor';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);

const formatLarge = (value: number | null): string => {
  if (value === null) return 'N/A';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value);
};

export function StockDetailPage(): JSX.Element {
  const params = useParams();
  const symbol = String(params.symbol ?? '').toUpperCase();

  const [data, setData] = useState<AssetComprehensiveResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!symbol) {
        setError('Symbol is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getAssetComprehensive(symbol);
        setData(response);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load stock page';
        setError(message);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [symbol]);

  const quoteColor = useMemo(() => {
    if (!data) return '#94a3b8';
    return data.quote.change >= 0 ? '#22c55e' : '#ef4444';
  }, [data]);

  if (loading) {
    return (
      <section className="space-y-3">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-[320px] w-full" />
      </section>
    );
  }

  if (error || !data) {
    return (
      <section className="rounded-xl border border-rose-700/50 bg-rose-950/30 p-6">
        <p className="text-sm text-rose-300">{error ?? 'Stock not found'}</p>
        <Link to="/" className="mt-3 inline-block text-sm font-semibold text-rose-200 underline underline-offset-2">
          Back to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <>
      <section className="mb-4 rounded-xl border border-[var(--line)] bg-[color:var(--surface)] p-5">
        <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted)]">Asset Workspace</p>
            <h2 className="text-3xl font-semibold text-[color:var(--text)]">
              {data.name} <span className="numeric text-[color:var(--muted)]">({data.symbol})</span>
            </h2>
            <p className="mt-1 text-sm text-[color:var(--muted)]">
              Comprehensive real-time page with valuation, quality, statements, and latest headlines.
            </p>
          </div>
          <Button asChild variant="secondary" size="sm">
            <Link to="/">Back to Dashboard</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Price</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="numeric text-xl font-semibold text-[color:var(--text)]">{formatCurrency(data.quote.price)}</p>
              <p className="text-[11px] text-[color:var(--muted)]">Source: {data.quote.source}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Daily Move</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="numeric text-xl font-semibold" style={{ color: quoteColor }}>
                {data.quote.change >= 0 ? '+' : ''}
                {data.quote.change.toFixed(2)} ({data.quote.changePercent.toFixed(2)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Market Cap</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="numeric text-xl font-semibold text-[color:var(--text)]">{formatLarge(data.quote.marketCap)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Health Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="numeric text-xl font-semibold" style={{ color: getScoreColor(data.fundamentals?.healthRating ?? 0) }}>
                {data.fundamentals?.healthRating ?? 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Verdict</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={data.fundamentals?.verdict === 'BUY' ? 'success' : data.fundamentals?.verdict === 'HOLD' ? 'warning' : 'danger'}>
                {data.fundamentals?.verdict ?? 'N/A'}
              </Badge>
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="mb-4 grid grid-cols-1 gap-3 xl:grid-cols-4">
        <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Moat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-[color:var(--text)]">{data.insights.moat}</p>
              <p className="numeric mt-1 text-xs text-[color:var(--muted)]">{data.fundamentals?.moatRating ?? 'N/A'}</p>
            </CardContent>
          </Card>

        <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Valuation</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1 text-sm text-[color:var(--text)]">
                <TrendingDown className="h-4 w-4 text-sky-300" /> {data.insights.valuation}
              </p>
              <p className="numeric mt-1 text-xs text-[color:var(--muted)]">P/E {data.fundamentals?.peRatio.toFixed(2) ?? 'N/A'}</p>
            </CardContent>
          </Card>

        <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1 text-sm text-[color:var(--text)]">
                <TrendingUp className="h-4 w-4 text-emerald-300" /> {data.insights.profitability}
              </p>
              <p className="numeric mt-1 text-xs text-[color:var(--muted)]">ROE {data.fundamentals?.roe.toFixed(1) ?? 'N/A'}%</p>
            </CardContent>
          </Card>

        <Card>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs uppercase tracking-[0.14em] text-[color:var(--muted)]">Balance Sheet</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="flex items-center gap-1 text-sm text-[color:var(--text)]">
                <ShieldCheck className="h-4 w-4 text-amber-300" /> {data.insights.balanceSheet}
              </p>
              <p className="numeric mt-1 text-xs text-[color:var(--muted)]">
                D/E {data.fundamentals?.debtToEquity.toFixed(2) ?? 'N/A'}
              </p>
            </CardContent>
          </Card>
      </section>

      <section className="mb-4">
        <FinancialStatementsPanel
          data={{
            symbol: data.symbol,
            name: data.name,
            currentPrice: data.currentPrice,
            fundamentals: data.fundamentals,
            financials: data.financials,
          }}
          loading={false}
          error={null}
        />
      </section>

      <section className="rounded-xl border border-[var(--line)] bg-[color:var(--surface)] p-5">
        <h3 className="mb-2 flex items-center gap-2 text-lg font-semibold text-[color:var(--text)]">
          <Newspaper className="h-5 w-5 text-sky-300" /> Latest News
        </h3>
        {data.news.length === 0 && <p className="text-sm text-[color:var(--muted)]">No news available right now.</p>}

        <div className="space-y-3">
          {data.news.map((item) => (
            <article key={`${item.url}-${item.publishedAt ?? ''}`} className="rounded-md border border-[var(--line)] bg-[color:var(--surface-soft)] p-3">
              <a href={item.url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-sky-300 hover:underline">
                {item.title}
              </a>
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                {item.source}
                {item.publishedAt ? ` • ${new Date(item.publishedAt).toLocaleString()}` : ''}
              </p>
              {item.summary && <p className="mt-2 text-sm text-[color:var(--text)]">{item.summary}</p>}
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

export default StockDetailPage;
