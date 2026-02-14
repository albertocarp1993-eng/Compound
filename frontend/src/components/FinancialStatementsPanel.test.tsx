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
          financialMetricTable: [
            {
              key: 'revenue',
              category: 'Income Statement',
              metric: 'Revenue',
              unit: 'USD',
              latestValue: 383285,
              priorQuarterValue: 114000,
              sameQuarterLastYearValue: 350000,
              qoqChangePct: 4.2,
              yoyChangePct: 9.5,
            },
            {
              key: 'eps',
              category: 'Per Share',
              metric: 'EPS',
              unit: 'PER_SHARE',
              latestValue: 6.13,
              priorQuarterValue: 5.1,
              sameQuarterLastYearValue: 5.3,
              qoqChangePct: 20.2,
              yoyChangePct: 15.7,
            },
          ],
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
              operatingCashFlow: 110000,
              capitalExpenditures: 10400,
              freeCashFlow: 99600,
              stockBasedCompensation: 7600,
              dilutedSharesOutstanding: 15800000000,
              researchAndDevelopmentExpense: 29000,
              sellingGeneralAdministrativeExpense: 24000,
              totalAssets: 352583,
              currentAssets: 130000,
              cashAndEquivalents: 60000,
              totalLiabilities: 290437,
              currentLiabilities: 120000,
              longTermDebt: 95000,
              totalEquity: 62146,
              interestExpense: 3000,
              dividendsPerShare: 0.96,
              grossMarginPct: 44.1,
              operatingMarginPct: 29.8,
              netMarginPct: 25.3,
              debtToAssetsPct: 82.4,
              freeCashFlowMarginPct: 26,
              operatingCashFlowMarginPct: 28.7,
              debtToEquityRatio: 4.67,
              currentRatio: 1.08,
              returnOnAssetsPct: 27.5,
              returnOnEquityPct: 156.09,
              capexToRevenuePct: 2.71,
              sbcToRevenuePct: 1.98,
              assetTurnoverRatio: 1.09,
              fcfConversionPct: 102.68,
              interestCoverageRatio: 38.1,
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('Company Financials')).toBeInTheDocument();
    expect(screen.getByText('Apple Inc. (AAPL)')).toBeInTheDocument();
    expect(screen.getByText('Latest Revenue')).toBeInTheDocument();
    expect(screen.getByText('2023')).toBeInTheDocument();
    expect(screen.getByText('Statement Explorer')).toBeInTheDocument();
    expect(screen.getByText('Income Statement')).toBeInTheDocument();
    expect(screen.getByText('Balance Sheet')).toBeInTheDocument();
    expect(screen.getByText('Cash Flow')).toBeInTheDocument();
    expect(screen.getByText('Ratios')).toBeInTheDocument();
    expect(screen.getByText('Metric')).toBeInTheDocument();
  });
});
