// Real Polygon API implementation

import type {
  TickerSearchResponse,
  AggregatesResponse,
  SnapshotResponse,
  NewsResponse
} from '@/types/polygon'

const BASE_URL = 'https://api.polygon.io'
const API_KEY = process.env.NEXT_PUBLIC_POLYGON_API_KEY || process.env.POLYGON_API_KEY

class PolygonAPIError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'PolygonAPIError'
  }
}

async function makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  console.log('Polygon API: Making request to', endpoint, 'with params:', params)
  
  if (!API_KEY) {
    console.error('Polygon API: No API key found')
    throw new PolygonAPIError('Polygon API key not configured. Please set POLYGON_API_KEY in your environment variables.')
  }

  const url = new URL(`${BASE_URL}${endpoint}`)
  url.searchParams.set('apikey', API_KEY)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  console.log('Polygon API: Full URL:', url.toString().replace(API_KEY, 'HIDDEN'))

  try {
    const response = await fetch(url.toString(), {
      headers: {
        'Accept': 'application/json',
      },
    })

    console.log('Polygon API: Response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Polygon API: Error response:', errorText)
      throw new PolygonAPIError(
        `Polygon API error: ${response.status} ${response.statusText} - ${errorText}`,
        response.status
      )
    }

    const data = await response.json()
    console.log('Polygon API: Response data:', data)
    
    if (data.status !== 'OK') {
      console.error('Polygon API: Status not OK:', data.status)
      throw new PolygonAPIError(`Polygon API error: ${data.status}`)
    }

    return data
  } catch (error) {
    console.error('Polygon API: Request failed:', error)
    if (error instanceof PolygonAPIError) {
      throw error
    }
    throw new PolygonAPIError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function searchTickers(query: string): Promise<TickerSearchResponse> {
  return makeRequest<TickerSearchResponse>('/v3/reference/tickers', {
    search: query,
    market: 'stocks',
    active: 'true',
    limit: '10'
  })
}

export async function getAggregates(
  symbol: string,
  multiplier: number = 1,
  timespan: string = 'day',
  from: string,
  to: string
): Promise<AggregatesResponse> {
  return makeRequest<AggregatesResponse>(
    `/v2/aggs/ticker/${symbol.toUpperCase()}/range/${multiplier}/${timespan}/${from}/${to}`,
    {
      adjusted: 'true',
      sort: 'asc',
      limit: '5000'
    }
  )
}

export async function getSnapshot(symbol: string): Promise<SnapshotResponse> {
  return makeRequest<SnapshotResponse>(`/v2/snapshot/locale/us/markets/stocks/tickers/${symbol.toUpperCase()}`)
}

export async function getNews(symbol: string, limit: number = 10): Promise<NewsResponse> {
  return makeRequest<NewsResponse>('/v2/reference/news', {
    ticker: symbol.toUpperCase(),
    limit: limit.toString(),
    sort: 'published_utc',
    order: 'desc'
  })
}

// Helper function to get multiple snapshots at once
export async function getMultipleSnapshots(symbols: string[]): Promise<SnapshotResponse> {
  const tickersParam = symbols.map(s => s.toUpperCase()).join(',')
  return makeRequest<SnapshotResponse>('/v2/snapshot/locale/us/markets/stocks/tickers', {
    tickers: tickersParam
  })
}
