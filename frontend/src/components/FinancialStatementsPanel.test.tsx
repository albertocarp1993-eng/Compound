import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FinancialStatementsPanel from './FinancialStatementsPanel';

describe('FinancialStatementsPanel', () => {
  it('renders company financials table for selected company', () => {
    render(
      <FinancialStatementsPanel
        loading={false}
        error={null}
        data={{
          symbol: 'AAPL',
          name: 'Apple Inc.',
          currentPrice: 189.5,
          fundamentals: {
            peRatio: 28,
            roe: 150,
            debtToEquity: 1.7,
            payoutRatio: 18,
            dividendGrowthStreak: 12,
            dividendSafetyScore: 86,
            moatRating: 'WIDE',
            historicalVolatility: 0.26,
            healthRating: 95,
            verdict: 'BUY',
            snowballScore: 100,
          },
          metrics: {
            qoq: null,
            yoy: null,
            annualTrend: null,
          },
          scoreModel: null,
          financials: [
            {
              fiscalYear: 2023,
              fiscalPeriod: 'FY',
              period: 'ANNUAL',
              revenue: 383285,
              grossProfit: 169148,
              operatingIncome: 114301,
              netIncome: 97000,
              eps: 6.13,
              freeCashFlow: 99600,
              totalAssets: 352583,
              totalLiabilities: 290437,
              totalEquity: 62146,
              dividendsPerShare: 0.96,
              grossMarginPct: 44.1,
              operatingMarginPct: 29.8,
              netMarginPct: 25.3,
              debtToAssetsPct: 82.4,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Company Financials')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
    expect(screen.getByText('Latest Revenue')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
  });
});
