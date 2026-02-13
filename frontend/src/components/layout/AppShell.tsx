import { Link, Outlet } from 'react-router-dom';
import AssetSearchBar from '../AssetSearchBar';

type AppShellProps = {
  onSelectSymbol: (symbol: string) => void;
};

export function AppShell({ onSelectSymbol }: AppShellProps): JSX.Element {
  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="mb-1 text-xs uppercase tracking-[0.22em] text-slate-500">
                Snowball Analytics
              </p>
              <h1 className="text-3xl font-bold text-slate-900">Portfolio Quality Tracker</h1>
              <p className="mt-1 text-sm text-slate-600">
                Search any company and open dedicated stock intelligence pages.
              </p>
            </div>

            <Link
              to="/"
              className="inline-flex items-center rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:border-sky-300 hover:text-sky-700"
            >
              Dashboard
            </Link>
          </div>

          <AssetSearchBar onSelectSymbol={onSelectSymbol} />
        </header>

        <Outlet />
      </div>
    </div>
  );
}

export default AppShell;
