import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Moon, Search, Sun } from 'lucide-react';
import AssetSearchBar from '../AssetSearchBar';
import { Button } from '../ui/button';
import useTheme from '../../hooks/useTheme';

export function StockWorkspaceLayout(): JSX.Element {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen bg-[var(--bg)] px-4 py-5 md:px-6">
      <div className="mx-auto max-w-[1700px]">
        <header className="mb-4 rounded-xl border border-[var(--line)] bg-[color:var(--surface)] p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--muted)]">
                Stock Intelligence
              </p>
              <h1 className="text-2xl font-semibold text-[color:var(--text)]">
                Single-Asset Research Workspace
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" asChild>
                <Link to="/command-center">Command Center</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={toggleTheme}>
                {theme === 'light' ? (
                  <>
                    <Moon className="mr-1 h-4 w-4" /> Midnight
                  </>
                ) : (
                  <>
                    <Sun className="mr-1 h-4 w-4" /> Light
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-[color:var(--muted)]" />
            <AssetSearchBar onSelectSymbol={(symbol) => navigate(`/stocks/${symbol}`)} />
          </div>
        </header>

        <Outlet />
      </div>
    </div>
  );
}

export default StockWorkspaceLayout;
