// API layer - Yahoo Finance implementation

import * as yahooFinanceApi from './yahoo-finance'

// Use Yahoo Finance API - no API key required!
export const api = yahooFinanceApi

// Re-export types for convenience
export type {
  TickerSearchResponse,
  AggregatesResponse,
  SnapshotResponse,
  NewsResponse,
  TimeRange,
  ChartData,
  WatchlistItem,
  StockDetails,
  ChatMessage
} from '@/types/polygon'

// Utility function to convert aggregates to chart data
export function aggregatesToChartData(aggregates: import('@/types/polygon').Aggregate[]): import('@/types/polygon').ChartData[] {
  return aggregates.map(agg => ({
    time: agg.t / 1000, // Convert to seconds for TradingView
    open: agg.o,
    high: agg.h,
    low: agg.l,
    close: agg.c,
    volume: agg.v
  }))
}

// Utility function to get date range for time range
export function getDateRange(timeRange: import('@/types/polygon').TimeRange): { from: string; to: string } {
  const now = new Date()
  const to = now.toISOString().split('T')[0] // YYYY-MM-DD format
  let from: Date

  switch (timeRange) {
    case '1D':
      from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      break
    case '5D':
      from = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
      break
    case '1M':
      from = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      break
    case '6M':
      from = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate())
      break
    case 'YTD':
      from = new Date(now.getFullYear(), 0, 1)
      break
    case '1Y':
      from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      break
    case '5Y':
      from = new Date(now.getFullYear() - 5, now.getMonth(), now.getDate())
      break
    default:
      from = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // Default to 1 month
  }

  return {
    from: from.toISOString().split('T')[0],
    to
  }
}
