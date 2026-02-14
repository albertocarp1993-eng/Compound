import { afterEach, describe, expect, it, vi } from 'vitest';
import { __testing, externalDataService } from '../services/externalDataService';

const buildJsonResponse = (body: unknown): Response =>
  new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });

describe('externalDataService.getFinancialStatements', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    __testing.resetTickerCache();
  });

  it('selects quarterly values and derives missing fields from SEC facts', async () => {
    const tickerPayload = {
      '0': {
        cik_str: 320193,
        ticker: 'AAPL',
        title: 'Apple Inc.',
      },
    };

    const companyFactsPayload = {
      facts: {
        'us-gaap': {
          RevenueFromContractWithCustomerExcludingAssessedTax: {
            units: {
              USD: [
                {
                  val: 500,
                  fy: 2025,
                  fp: 'Q3',
                  form: '10-Q',
                  filed: '2025-10-31',
                  end: '2025-09-30',
                },
                {
                  val: 180,
                  fy: 2025,
                  fp: 'Q3',
                  form: '10-Q',
                  frame: 'CY2025Q3',
                  filed: '2025-10-31',
                  end: '2025-09-30',
                },
                {
                  val: 160,
                  fy: 2025,
                  fp: 'Q2',
                  form: '10-Q',
                  frame: 'CY2025Q2',
                  filed: '2025-08-01',
                  end: '2025-06-30',
                },
              ],
            },
          },
          CostOfGoodsAndServicesSold: {
            units: {
              USD: [
                { val: 110, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: 100, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          OperatingIncomeLoss: {
            units: {
              USD: [
                { val: 50, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: 44, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          NetIncomeLoss: {
            units: {
              USD: [
                { val: 40, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: 36, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          EarningsPerShareDiluted: {
            units: {
              'USD/shares': [
                { val: 2.3, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: 2.1, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          NetCashProvidedByUsedInOperatingActivities: {
            units: {
              USD: [
                { val: 70, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: 62, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          PaymentsToAcquirePropertyPlantAndEquipmentAndIntangibleAssets: {
            units: {
              USD: [
                { val: -10, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: -8, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          ShareBasedCompensation: {
            units: {
              USD: [
                { val: 5, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          SellingAndMarketingExpense: {
            units: {
              USD: [
                { val: 3, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          GeneralAndAdministrativeExpense: {
            units: {
              USD: [
                { val: 7, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          WeightedAverageNumberOfDilutedSharesOutstanding: {
            units: {
              shares: [
                { val: 100, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          Assets: {
            units: {
              USD: [
                { val: 1000, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
                { val: 950, fy: 2025, fp: 'Q2', form: '10-Q', filed: '2025-08-01', end: '2025-06-30' },
              ],
            },
          },
          AssetsCurrent: {
            units: {
              USD: [
                { val: 400, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          CashAndCashEquivalentsAtCarryingValue: {
            units: {
              USD: [
                { val: 120, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          StockholdersEquity: {
            units: {
              USD: [
                { val: 300, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          LiabilitiesCurrent: {
            units: {
              USD: [
                { val: 200, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          LongTermDebtAndCapitalLeaseObligations: {
            units: {
              USD: [
                { val: 260, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          InterestExpenseDebt: {
            units: {
              USD: [
                { val: 4, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
          CommonStockDividendsPerShareDeclared: {
            units: {
              'USD/shares': [
                { val: 0.2, fy: 2025, fp: 'Q3', form: '10-Q', filed: '2025-10-31', end: '2025-09-30' },
              ],
            },
          },
        },
      },
    };

    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation((url) => {
      const resolved = String(url);
      if (resolved.includes('company_tickers.json')) {
        return Promise.resolve(buildJsonResponse(tickerPayload));
      }
      if (resolved.includes('companyfacts/CIK0000320193.json')) {
        return Promise.resolve(buildJsonResponse(companyFactsPayload));
      }
      return Promise.resolve(new Response('not found', { status: 404 }));
    });

    const rows = await externalDataService.getFinancialStatements('AAPL');
    expect(fetchMock).toHaveBeenCalled();
    expect(rows.length).toBeGreaterThanOrEqual(2);

    const latest = rows[0];
    expect(latest).toMatchObject({
      period: 'QUARTERLY',
      fiscalYear: 2025,
      fiscalPeriod: 'Q3',
      revenue: 180,
      grossProfit: 70,
      freeCashFlow: 60,
      capitalExpenditures: 10,
      stockBasedCompensation: 5,
      sellingGeneralAdministrativeExpense: 10,
      totalLiabilities: 700,
      longTermDebt: 260,
      interestExpense: 4,
    });
  });

  it('parses Google News RSS items for stock headlines', async () => {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
      <rss><channel>
        <item>
          <title>Apple boosts services growth</title>
          <link>https://example.com/apple-growth</link>
          <pubDate>Fri, 13 Feb 2026 12:00:00 GMT</pubDate>
          <source>Example Wire</source>
          <description><![CDATA[<p>Revenue and margin expanded in latest quarter.</p>]]></description>
        </item>
      </channel></rss>`;

    vi.spyOn(global, 'fetch').mockImplementation((url) => {
      if (String(url).includes('news.google.com/rss/search')) {
        return Promise.resolve(
          new Response(rss, {
            status: 200,
            headers: { 'Content-Type': 'application/xml' },
          }),
        );
      }

      return Promise.resolve(new Response('not found', { status: 404 }));
    });

    const items = await externalDataService.getNews('AAPL');
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      title: 'Apple boosts services growth',
      url: 'https://example.com/apple-growth',
      source: 'Example Wire',
    });
    expect(items[0].summary).toContain('Revenue and margin expanded');
  });
});
