import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { searchAssets } from '../api/client';
import { AssetSearchResult } from '../types/assets';
import { getScoreColor } from '../utils/scoreColor';
import { Input } from './ui/input';

const formatCurrency = (value: number | null): string =>
  value === null
    ? 'N/A'
    : new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 2,
      }).format(value);

type AssetSearchBarProps = {
  onSelectSymbol: (symbol: string) => void;
};

export function AssetSearchBar({ onSelectSymbol }: AssetSearchBarProps): JSX.Element {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AssetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setResults([]);
      setError(null);
      return;
    }

    const timeout = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await searchAssets(trimmed);
        setResults(response.results);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Search failed';
        setError(message);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [query]);

  const hasDropdown = useMemo(
    () => query.trim().length > 0 && (loading || error || results.length > 0),
    [query, loading, error, results],
  );

  return (
    <div className="relative">
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
        Search Company (symbol or name)
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted)]" />
        <Input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && results.length > 0) {
              onSelectSymbol(results[0].symbol);
              setQuery('');
              setResults([]);
            }
          }}
          placeholder="Search AAPL, Microsoft, JNJ..."
          className="pl-10"
        />
      </div>

      {hasDropdown && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-md border border-[var(--line)] bg-[color:var(--surface)] shadow-2xl">
          {loading && <p className="px-4 py-3 text-sm text-[color:var(--muted)]">Searching...</p>}

          {error && <p className="px-4 py-3 text-sm text-rose-400">{error}</p>}

          {!loading && !error && results.length === 0 && (
            <p className="px-4 py-3 text-sm text-[color:var(--muted)]">No assets found.</p>
          )}

          {!loading &&
            !error &&
            results.map((result) => (
              <button
                type="button"
                key={result.symbol}
                onClick={() => {
                  onSelectSymbol(result.symbol);
                  setQuery('');
                  setResults([]);
                }}
                className="flex w-full items-center justify-between border-b border-[var(--line)] px-4 py-3 text-left hover:bg-[color:var(--surface-soft)]"
              >
                <span>
                  <span className="numeric font-semibold text-[color:var(--text)]">{result.symbol}</span>
                  <span className="ml-2 text-sm text-[color:var(--muted)]">{result.name}</span>
                </span>
                <span className="ml-2 flex items-center gap-3 text-xs text-[color:var(--muted)]">
                  <span className="numeric">{formatCurrency(result.currentPrice)}</span>
                  <span className="uppercase tracking-wide">{result.source}</span>
                  {result.snowballScore !== null && (
                    <span
                      className="rounded-full px-2 py-1 font-semibold"
                      style={{
                        color: getScoreColor(result.snowballScore),
                        backgroundColor: 'var(--surface-strong)',
                      }}
                    >
                      Q {result.snowballScore}
                    </span>
                  )}
                </span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}

export default AssetSearchBar;
