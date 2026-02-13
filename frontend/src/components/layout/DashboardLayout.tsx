import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  Compass,
  ShieldCheck,
  Snowflake,
} from 'lucide-react';
import { createPortfolio, getPortfolios } from '../../api/client';
import useDashboardData from '../../hooks/useDashboardData';
import { PortfolioSummary } from '../../types/portfolio';
import AssetSearchBar from '../AssetSearchBar';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Skeleton } from '../ui/skeleton';

const formatCurrency = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value);

type DashboardLayoutContextShape = {
  portfolios: PortfolioSummary[];
  portfolioLoading: boolean;
  portfolioError: string | null;
  selectedPortfolioId: number | null;
  selectedPortfolio: PortfolioSummary | null;
  setSelectedPortfolioId: (value: number) => void;
  createPortfolioName: string;
  setCreatePortfolioName: (value: string) => void;
  creatingPortfolio: boolean;
  createPortfolioError: string | null;
  onCreatePortfolio: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  reloadPortfolios: () => Promise<void>;
  dashboardData: ReturnType<typeof useDashboardData>;
};

const sidebarLinks = [
  {
    section: 'command-center',
    label: 'Command Center',
    icon: Compass,
  },
  {
    section: 'snowball-projection',
    label: 'Snowball Projection',
    icon: Snowflake,
  },
  {
    section: 'dividends',
    label: 'Dividends',
    icon: CircleDollarSign,
  },
  {
    section: 'quality-audit',
    label: 'Quality Audit',
    icon: ShieldCheck,
  },
];

export function useDashboardLayoutContext(): DashboardLayoutContextShape {
  return useOutletContext<DashboardLayoutContextShape>();
}

export function DashboardLayout(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [portfolios, setPortfolios] = useState<PortfolioSummary[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState<string | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<number | null>(null);

  const [createPortfolioName, setCreatePortfolioName] = useState('');
  const [creatingPortfolio, setCreatingPortfolio] = useState(false);
  const [createPortfolioError, setCreatePortfolioError] = useState<string | null>(null);

  const dashboardData = useDashboardData(selectedPortfolioId);

  const reloadPortfolios = useCallback(async () => {
    setPortfolioLoading(true);
    setPortfolioError(null);

    try {
      const response = await getPortfolios();
      setPortfolios(response.portfolios);
      setSelectedPortfolioId((prev) => prev ?? response.portfolios[0]?.id ?? null);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load portfolios';
      setPortfolioError(message);
    } finally {
      setPortfolioLoading(false);
    }
  }, []);

  useEffect(() => {
    void reloadPortfolios();
  }, [reloadPortfolios]);

  const selectedPortfolio = useMemo(
    () => portfolios.find((portfolio) => portfolio.id === selectedPortfolioId) ?? null,
    [portfolios, selectedPortfolioId],
  );

  const handleCreatePortfolio = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const name = createPortfolioName.trim();
    if (!name) {
      setCreatePortfolioError('Portfolio name is required.');
      return;
    }

    setCreatingPortfolio(true);
    setCreatePortfolioError(null);

    try {
      const response = await createPortfolio({
        name,
      });

      setPortfolios((prev) => [...prev, response.portfolio]);
      setSelectedPortfolioId(response.portfolio.id);
      setCreatePortfolioName('');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create portfolio';
      setCreatePortfolioError(message);
    } finally {
      setCreatingPortfolio(false);
    }
  };

  const contextValue: DashboardLayoutContextShape = {
    portfolios,
    portfolioLoading,
    portfolioError,
    selectedPortfolioId,
    selectedPortfolio,
    setSelectedPortfolioId,
    createPortfolioName,
    setCreatePortfolioName,
    creatingPortfolio,
    createPortfolioError,
    onCreatePortfolio: handleCreatePortfolio,
    reloadPortfolios,
    dashboardData,
  };

  const activeSidebarSection = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('section');
  }, [location.search]);

  return (
    <div className="flex min-h-screen w-full">
      <aside
        className={`border-r border-zinc-800/80 bg-zinc-950/80 px-3 py-4 transition-all duration-300 ${collapsed ? 'w-16' : 'w-72'}`}
      >
        <div className="mb-5 flex items-center justify-between">
          {collapsed ? (
            <p className="text-sm font-semibold text-zinc-100">SE</p>
          ) : (
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-zinc-500">Snowball Elite</p>
              <p className="text-base font-semibold text-zinc-100">Portfolio CRM</p>
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={() => setCollapsed((prev) => !prev)}>
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        <nav className="space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.section}
              to={{
                pathname: '/',
                search: `?section=${encodeURIComponent(link.section)}`,
              }}
              onClick={(event) => {
                if (location.pathname === '/' && activeSidebarSection === link.section) {
                  event.preventDefault();
                  const target = document.getElementById(link.section);
                  if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }
              }}
              className={`flex items-center gap-2 rounded-md px-2 py-2 text-sm transition-colors ${
                activeSidebarSection === link.section && location.pathname === '/'
                  ? 'bg-zinc-800 text-zinc-100'
                  : 'text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
              }`}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{link.label}</span>}
            </Link>
          ))}
        </nav>

        {!collapsed && (
          <div className="mt-6 space-y-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3">
            <p className="text-[11px] uppercase tracking-[0.14em] text-zinc-500">Portfolio</p>
            <select
              className="h-9 w-full rounded-md border border-zinc-700 bg-zinc-900 px-2 text-sm text-zinc-200"
              value={selectedPortfolioId ?? ''}
              onChange={(event) => setSelectedPortfolioId(Number(event.target.value))}
              disabled={portfolioLoading || portfolios.length === 0}
            >
              {portfolios.map((portfolio) => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>

            <form onSubmit={(event) => void handleCreatePortfolio(event)} className="space-y-2">
              <Input
                value={createPortfolioName}
                onChange={(event) => setCreatePortfolioName(event.target.value)}
                placeholder="Create new portfolio"
              />
              <Button type="submit" size="sm" className="w-full" disabled={creatingPortfolio}>
                {creatingPortfolio ? 'Creating...' : 'Create Portfolio'}
              </Button>
            </form>
            {createPortfolioError && <p className="text-xs text-rose-400">{createPortfolioError}</p>}
          </div>
        )}
      </aside>

      <main className="min-w-0 flex-1 p-4 md:p-5">
        <header className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950/60 p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-zinc-500">Command Deck</p>
              <h1 className="text-2xl font-semibold text-zinc-100">Snowball Elite</h1>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="info">CRM Mode</Badge>
              <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
                <BarChart3 className="mr-1 h-4 w-4" /> Dashboard
              </Button>
            </div>
          </div>

          <div className="mb-3">
            <AssetSearchBar onSelectSymbol={(symbol) => navigate(`/stocks/${symbol}`)} />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
            {dashboardData.loading ? (
              <>
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </>
            ) : (
              <>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Net Worth</p>
                  <p className="numeric mt-1 text-xl font-semibold text-zinc-100">
                    {formatCurrency(dashboardData.kpis?.netWorth ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Day Change</p>
                  <p
                    className="numeric mt-1 text-xl font-semibold"
                    style={{ color: (dashboardData.kpis?.dayChangePct ?? 0) >= 0 ? '#22c55e' : '#ef4444' }}
                  >
                    {(dashboardData.kpis?.dayChangePct ?? 0).toFixed(2)}%
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">YTD Dividends</p>
                  <p className="numeric mt-1 text-xl font-semibold text-emerald-300">
                    {formatCurrency(dashboardData.kpis?.ytdDividends ?? 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/70 p-3">
                  <p className="text-[11px] uppercase tracking-[0.15em] text-zinc-500">Snowball Factor</p>
                  <p className="numeric mt-1 text-xl font-semibold text-sky-300">
                    {(dashboardData.kpis?.snowballFactor ?? 0).toFixed(2)}x
                  </p>
                </div>
              </>
            )}
          </div>
        </header>

        {portfolioError && (
          <div className="mb-3 rounded-md border border-rose-700/60 bg-rose-950/50 px-3 py-2 text-sm text-rose-300">
            {portfolioError}
          </div>
        )}

        {dashboardData.error && (
          <div className="mb-3 rounded-md border border-rose-700/60 bg-rose-950/50 px-3 py-2 text-sm text-rose-300">
            {dashboardData.error}
          </div>
        )}

        <Outlet context={contextValue} />
      </main>
    </div>
  );
}

export default DashboardLayout;
