// Polygon API Types - minimal but accurate to real API responses

export interface TickerSearchResult {
  ticker: string
  name: string
  market: string
  locale: string
  primary_exchange?: string
  type: string
  active: boolean
  currency_name?: string
}

export interface TickerSearchResponse {
  results: TickerSearchResult[]
  status: string
  request_id: string
  count: number
  next_url?: string
}

export interface Aggregate {
  c: number // close
  h: number // high
  l: number // low
  n: number // number of transactions
  o: number // open
  t: number // timestamp
  v: number // volume
  vw: number // volume weighted average price
}

export interface AggregatesResponse {
  ticker: string
  status: string
  request_id: string
  results: Aggregate[]
  resultsCount: number
  adjusted: boolean
  next_url?: string
}

export interface LastQuote {
  P: number // bid price
  S: number // bid size
  p: number // ask price
  s: number // ask size
  t: number // timestamp
}

export interface LastTrade {
  c: number[] // conditions
  i: string // trade id
  p: number // price
  s: number // size
  t: number // timestamp
  x: number // exchange
}

export interface DailyBar {
  c: number // close
  h: number // high
  l: number // low
  o: number // open
  v: number // volume
  vw: number // volume weighted average price
}

export interface TickerSnapshot {
  ticker: string
  todaysChangePerc: number
  todaysChange: number
  updated: number
  day: DailyBar
  lastQuote: LastQuote
  lastTrade: LastTrade
  market_status: string
  fmv?: number
}

export interface SnapshotResponse {
  status: string
  request_id: string
  results: TickerSnapshot[]
}

export interface NewsItem {
  id: string
  publisher: {
    name: string
    homepage_url: string
    logo_url?: string
    favicon_url?: string
  }
  title: string
  author?: string
  published_utc: string
  article_url: string
  tickers?: string[]
  amp_url?: string
  image_url?: string
  description?: string
  keywords?: string[]
}

export interface NewsResponse {
  status: string
  request_id: string
  results: NewsItem[]
  next_url?: string
}

// Chart data types
export interface ChartData {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume?: number
}

// App-specific types
export interface WatchlistItem {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  sparklineData?: number[]
}

export interface StockDetails {
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
  marketCap?: number
  pe?: number
  week52High?: number
  week52Low?: number
  volume?: number
  avgVolume?: number
  marketStatus: 'open' | 'closed' | 'pre' | 'after'
}

export type TimeRange = '1D' | '5D' | '1M' | '6M' | 'YTD' | '1Y' | '5Y'

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}
