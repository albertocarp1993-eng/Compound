import { XMLParser } from 'fast-xml-parser';

export type ExternalQuote = {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  marketCap: number | null;
  currency: string | null;
  exchange: string | null;
  source: 'stooq';
};

export type ExternalNewsItem = {
  title: string;
  url: string;
  publishedAt: string | null;
  source: string;
  summary: string | null;
};

export type ExternalCompanyMatch = {
  symbol: string;
  name: string;
  cik: string;
};

export type ExternalFinancialRow = {
  period: 'ANNUAL' | 'QUARTERLY';
  fiscalYear: number;
  fiscalPeriod: string;
  revenue: number;
  grossProfit: number;
  operatingIncome: number;
  netIncome: number;
  eps: number;
  freeCashFlow: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  dividendsPerShare: number;
};

type RawFactEntry = {
  val?: number;
  end?: string;
  fy?: number;
  fp?: string;
  form?: string;
  filed?: string;
};

type SecTicker = {
  symbol: string;
  name: string;
  cik: string;
};

type CompanyFacts = {
  cik?: number;
  entityName?: string;
  facts?: {
    'us-gaap'?: Record<
      string,
      {
        units?: Record<string, RawFactEntry[]>;
      }
    >;
  };
};

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
});

const SEC_HEADERS = {
  'User-Agent': 'SnowballAnalytics/1.0 alberto@example.com',
  Accept: 'application/json',
};

const GOOGLE_NEWS_HEADERS = {
  'User-Agent': 'SnowballAnalytics/1.0',
};

const stripHtml = (value: string): string =>
  value.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

const toPaddedCik = (cik: number): string => String(cik).padStart(10, '0');

const toQuarterFromEnd = (end?: string): string => {
  if (!end) return 'Q4';
  const month = new Date(end).getUTCMonth() + 1;
  if (month <= 3) return 'Q1';
  if (month <= 6) return 'Q2';
  if (month <= 9) return 'Q3';
  return 'Q4';
};

const fetchWithTimeout = async (
  url: string,
  headers: Record<string, string>,
  timeoutMs = 8000,
): Promise<Response> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers,
    });
  } finally {
    clearTimeout(timeout);
  }
};

let tickerCache: { loadedAt: number; data: SecTicker[] } | null = null;

const loadSecTickers = async (): Promise<SecTicker[]> => {
  const now = Date.now();
  if (tickerCache && now - tickerCache.loadedAt < 12 * 60 * 60 * 1000) {
    return tickerCache.data;
  }

  const response = await fetchWithTimeout(
    'https://www.sec.gov/files/company_tickers.json',
    SEC_HEADERS,
  );

  if (!response.ok) {
    throw new Error(`Failed to load SEC ticker map (${response.status})`);
  }

  const payload = (await response.json()) as Record<
    string,
    {
      cik_str: number;
      ticker: string;
      title: string;
    }
  >;

  const data = Object.values(payload).map((item) => ({
    symbol: item.ticker.toUpperCase(),
    name: item.title,
    cik: toPaddedCik(item.cik_str),
  }));

  tickerCache = {
    loadedAt: now,
    data,
  };

  return data;
};

const rankMatch = (queryUpper: string, item: SecTicker): number => {
  const symbol = item.symbol.toUpperCase();
  const name = item.name.toUpperCase();

  if (symbol === queryUpper) return 0;
  if (symbol.startsWith(queryUpper)) return 1;
  if (name.startsWith(queryUpper)) return 2;
  if (symbol.includes(queryUpper)) return 3;
  if (name.includes(queryUpper)) return 4;
  return 10;
};

const searchCompanies = async (query: string): Promise<ExternalCompanyMatch[]> => {
  const queryUpper = query.trim().toUpperCase();
  if (!queryUpper) return [];

  try {
    const tickers = await loadSecTickers();

    return tickers
      .filter((item) => {
        const symbol = item.symbol.toUpperCase();
        const name = item.name.toUpperCase();
        return symbol.includes(queryUpper) || name.includes(queryUpper);
      })
      .map((item) => ({ ...item, rank: rankMatch(queryUpper, item) }))
      .sort((a, b) => {
        if (a.rank !== b.rank) return a.rank - b.rank;
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 20)
      .map((item) => ({
        symbol: item.symbol,
        name: item.name,
        cik: item.cik,
      }));
  } catch {
    return [];
  }
};

const getCompanyProfile = async (symbol: string): Promise<ExternalCompanyMatch | null> => {
  try {
    const tickers = await loadSecTickers();
    const found = tickers.find((item) => item.symbol === symbol.toUpperCase());
    if (!found) return null;

    return {
      symbol: found.symbol,
      name: found.name,
      cik: found.cik,
    };
  } catch {
    return null;
  }
};

const findBestEntries = (
  usGaap:
    | Record<
        string,
        {
          units?: Record<string, RawFactEntry[]>;
        }
      >
    | undefined,
  tags: string[],
  preferredUnits: string[],
): RawFactEntry[] => {
  if (!usGaap) return [];

  let best: RawFactEntry[] = [];

  for (const tag of tags) {
    const node = usGaap[tag];
    if (!node?.units) continue;

    for (const unit of preferredUnits) {
      const entries = node.units[unit];
      if (Array.isArray(entries) && entries.length > best.length) {
        best = entries;
      }
    }

    if (best.length > 0) continue;

    for (const entries of Object.values(node.units)) {
      if (Array.isArray(entries) && entries.length > best.length) {
        best = entries;
      }
    }
  }

  return best;
};

const normalizeEntries = (
  entries: RawFactEntry[],
  period: 'ANNUAL' | 'QUARTERLY',
): Array<{
  key: string;
  fiscalYear: number;
  fiscalPeriod: string;
  value: number;
  filed: string;
  end: string;
}> => {
  const map = new Map<
    string,
    {
      key: string;
      fiscalYear: number;
      fiscalPeriod: string;
      value: number;
      filed: string;
      end: string;
    }
  >();

  for (const entry of entries) {
    if (typeof entry.val !== 'number' || !Number.isFinite(entry.val)) continue;

    const formUpper = String(entry.form ?? '').toUpperCase();
    const isAnnual = formUpper.startsWith('10-K') || formUpper.startsWith('20-F') || formUpper.startsWith('40-F');
    const isQuarterly = formUpper.startsWith('10-Q');

    if (period === 'ANNUAL' && !isAnnual) continue;
    if (period === 'QUARTERLY' && !isQuarterly) continue;

    const fiscalYear =
      typeof entry.fy === 'number'
        ? entry.fy
        : entry.end
          ? new Date(entry.end).getUTCFullYear()
          : NaN;

    if (!Number.isFinite(fiscalYear)) continue;

    let fiscalPeriod = String(entry.fp ?? '').toUpperCase();
    if (!fiscalPeriod || fiscalPeriod === 'FY') {
      fiscalPeriod = period === 'ANNUAL' ? 'FY' : toQuarterFromEnd(entry.end);
    }

    if (period === 'ANNUAL') fiscalPeriod = 'FY';

    const key = `${fiscalYear}-${fiscalPeriod}`;
    const filed = entry.filed ?? '';
    const end = entry.end ?? '';

    const current = map.get(key);
    if (!current || filed > current.filed || end > current.end) {
      map.set(key, {
        key,
        fiscalYear,
        fiscalPeriod,
        value: entry.val,
        filed,
        end,
      });
    }
  }

  const periodOrder: Record<string, number> = {
    FY: 5,
    Q4: 4,
    Q3: 3,
    Q2: 2,
    Q1: 1,
  };

  return [...map.values()].sort((a, b) => {
    if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
    return (periodOrder[b.fiscalPeriod] ?? 0) - (periodOrder[a.fiscalPeriod] ?? 0);
  });
};

const buildFinancialRows = (
  facts: CompanyFacts,
  period: 'ANNUAL' | 'QUARTERLY',
): ExternalFinancialRow[] => {
  const usGaap = facts.facts?.['us-gaap'];
  if (!usGaap) return [];

  const revenue = normalizeEntries(
    findBestEntries(
      usGaap,
      ['Revenues', 'SalesRevenueNet', 'RevenueFromContractWithCustomerExcludingAssessedTax'],
      ['USD'],
    ),
    period,
  );

  const grossProfit = normalizeEntries(
    findBestEntries(usGaap, ['GrossProfit'], ['USD']),
    period,
  );

  const operatingIncome = normalizeEntries(
    findBestEntries(usGaap, ['OperatingIncomeLoss'], ['USD']),
    period,
  );

  const netIncome = normalizeEntries(
    findBestEntries(usGaap, ['NetIncomeLoss', 'ProfitLoss'], ['USD']),
    period,
  );

  const eps = normalizeEntries(
    findBestEntries(usGaap, ['EarningsPerShareBasic', 'EarningsPerShareDiluted'], ['USD/shares']),
    period,
  );

  const cfo = normalizeEntries(
    findBestEntries(
      usGaap,
      [
        'NetCashProvidedByUsedInOperatingActivities',
        'NetCashProvidedByUsedInOperatingActivitiesContinuingOperations',
      ],
      ['USD'],
    ),
    period,
  );

  const capex = normalizeEntries(
    findBestEntries(usGaap, ['PaymentsToAcquirePropertyPlantAndEquipment'], ['USD']),
    period,
  );

  const totalAssets = normalizeEntries(
    findBestEntries(usGaap, ['Assets'], ['USD']),
    period,
  );

  const totalLiabilities = normalizeEntries(
    findBestEntries(usGaap, ['Liabilities'], ['USD']),
    period,
  );

  const totalEquity = normalizeEntries(
    findBestEntries(
      usGaap,
      [
        'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest',
        'StockholdersEquity',
      ],
      ['USD'],
    ),
    period,
  );

  const dividendsPerShare = normalizeEntries(
    findBestEntries(
      usGaap,
      [
        'CommonStockDividendsPerShareDeclared',
        'CommonStockDividendsPerShareCashPaid',
        'DividendsPerShare',
      ],
      ['USD/shares'],
    ),
    period,
  );

  type Row = ExternalFinancialRow & { cfo: number | null; capex: number | null };
  const rows = new Map<string, Row>();

  const ensureRow = (entry: { key: string; fiscalYear: number; fiscalPeriod: string }): Row => {
    const existing = rows.get(entry.key);
    if (existing) return existing;

    const created: Row = {
      period,
      fiscalYear: entry.fiscalYear,
      fiscalPeriod: entry.fiscalPeriod,
      revenue: 0,
      grossProfit: 0,
      operatingIncome: 0,
      netIncome: 0,
      eps: 0,
      freeCashFlow: 0,
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      dividendsPerShare: 0,
      cfo: null,
      capex: null,
    };

    rows.set(entry.key, created);
    return created;
  };

  type NumericRowField =
    | 'revenue'
    | 'grossProfit'
    | 'operatingIncome'
    | 'netIncome'
    | 'eps'
    | 'totalAssets'
    | 'totalLiabilities'
    | 'totalEquity'
    | 'dividendsPerShare'
    | 'cfo'
    | 'capex';

  const applySeries = (
    series: Array<{
      key: string;
      fiscalYear: number;
      fiscalPeriod: string;
      value: number;
    }>,
    field: NumericRowField,
  ) => {
    for (const item of series) {
      const row = ensureRow(item);
      row[field] = item.value;
    }
  };

  applySeries(revenue, 'revenue');
  applySeries(grossProfit, 'grossProfit');
  applySeries(operatingIncome, 'operatingIncome');
  applySeries(netIncome, 'netIncome');
  applySeries(eps, 'eps');
  applySeries(totalAssets, 'totalAssets');
  applySeries(totalLiabilities, 'totalLiabilities');
  applySeries(totalEquity, 'totalEquity');
  applySeries(dividendsPerShare, 'dividendsPerShare');
  applySeries(cfo, 'cfo');
  applySeries(capex, 'capex');

  const periodOrder: Record<string, number> = {
    FY: 5,
    Q4: 4,
    Q3: 3,
    Q2: 2,
    Q1: 1,
  };

  return [...rows.values()]
    .map((row) => {
      if (row.cfo !== null) {
        const capexValue = row.capex !== null ? Math.abs(row.capex) : 0;
        row.freeCashFlow = row.cfo - capexValue;
      }

      return {
        period: row.period,
        fiscalYear: row.fiscalYear,
        fiscalPeriod: row.fiscalPeriod,
        revenue: row.revenue,
        grossProfit: row.grossProfit,
        operatingIncome: row.operatingIncome,
        netIncome: row.netIncome,
        eps: row.eps,
        freeCashFlow: row.freeCashFlow,
        totalAssets: row.totalAssets,
        totalLiabilities: row.totalLiabilities,
        totalEquity: row.totalEquity,
        dividendsPerShare: row.dividendsPerShare,
      };
    })
    .filter((row) => row.revenue !== 0 || row.netIncome !== 0 || row.totalAssets !== 0)
    .sort((a, b) => {
      if (a.fiscalYear !== b.fiscalYear) return b.fiscalYear - a.fiscalYear;
      return (periodOrder[b.fiscalPeriod] ?? 0) - (periodOrder[a.fiscalPeriod] ?? 0);
    });
};

const getFinancialStatements = async (symbol: string): Promise<ExternalFinancialRow[]> => {
  const profile = await getCompanyProfile(symbol);
  if (!profile) return [];

  try {
    const response = await fetchWithTimeout(
      `https://data.sec.gov/api/xbrl/companyfacts/CIK${profile.cik}.json`,
      SEC_HEADERS,
    );

    if (!response.ok) return [];

    const facts = (await response.json()) as CompanyFacts;
    const annual = buildFinancialRows(facts, 'ANNUAL').slice(0, 8);

    if (annual.length > 0) return annual;
    return buildFinancialRows(facts, 'QUARTERLY').slice(0, 8);
  } catch {
    return [];
  }
};

const getQuote = async (symbol: string): Promise<ExternalQuote | null> => {
  try {
    const response = await fetchWithTimeout(
      `https://stooq.com/q/l/?s=${encodeURIComponent(symbol.toLowerCase())}.us&i=d`,
      GOOGLE_NEWS_HEADERS,
    );

    if (!response.ok) return null;
    const csv = (await response.text()).trim();
    if (!csv || csv.includes('N/D')) return null;

    const [resolvedSymbol, , , openRaw, , , closeRaw] = csv.split(',');
    const open = Number(openRaw);
    const close = Number(closeRaw);

    if (!Number.isFinite(close)) return null;

    const change = Number.isFinite(open) ? close - open : 0;
    const changePercent = Number.isFinite(open) && open !== 0 ? (change / open) * 100 : 0;

    return {
      symbol: resolvedSymbol?.replace('.US', '').toUpperCase() ?? symbol.toUpperCase(),
      price: close,
      change,
      changePercent,
      marketCap: null,
      currency: 'USD',
      exchange: 'US',
      source: 'stooq',
    };
  } catch {
    return null;
  }
};

const getNews = async (symbol: string): Promise<ExternalNewsItem[]> => {
  try {
    const response = await fetchWithTimeout(
      `https://news.google.com/rss/search?q=${encodeURIComponent(`${symbol} stock`)}&hl=en-US&gl=US&ceid=US:en`,
      GOOGLE_NEWS_HEADERS,
    );

    if (!response.ok) return [];

    const xml = await response.text();
    const parsed = parser.parse(xml) as {
      rss?: {
        channel?: {
          item?:
            | {
                title?: string;
                link?: string;
                pubDate?: string;
                source?: string | { '#text'?: string };
                description?: string;
              }
            | Array<{
                title?: string;
                link?: string;
                pubDate?: string;
                source?: string | { '#text'?: string };
                description?: string;
              }>;
        };
      };
    };

    const rawItems = parsed.rss?.channel?.item;
    const items = Array.isArray(rawItems) ? rawItems : rawItems ? [rawItems] : [];

    return items
      .filter((item) => item.title && item.link)
      .slice(0, 12)
      .map((item) => {
        const source =
          typeof item.source === 'string'
            ? item.source
            : item.source && typeof item.source === 'object'
              ? item.source['#text']
              : undefined;

        return {
          title: item.title ?? 'Untitled',
          url: item.link ?? '#',
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          source: source ?? 'Google News',
          summary: item.description ? stripHtml(item.description).slice(0, 240) : null,
        };
      });
  } catch {
    return [];
  }
};

export const externalDataService = {
  searchCompanies,
  getCompanyProfile,
  getFinancialStatements,
  getQuote,
  getNews,
};
