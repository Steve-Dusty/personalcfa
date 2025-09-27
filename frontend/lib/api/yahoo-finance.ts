// Yahoo Finance API implementation (client-side using API routes)
import type {
  TickerSearchResponse,
  AggregatesResponse,
  SnapshotResponse,
  NewsResponse
} from '@/types/polygon'

class YahooFinanceError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'YahooFinanceError'
  }
}

// Helper function to make API requests to our Next.js API routes
async function makeRequest<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`/api/yahoo${endpoint}`, window.location.origin)
  
  Object.entries(params).forEach(([key, value]) => {
    if (value) url.searchParams.set(key, value)
  })

  console.log('Yahoo Finance Client: Making request to:', url.pathname + url.search)

  try {
    const response = await fetch(url.toString())
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new YahooFinanceError(
        `API request failed: ${response.status} - ${errorData.error}`,
        response.status
      )
    }

    const data = await response.json()
    console.log('Yahoo Finance Client: Response received')
    return data
  } catch (error) {
    console.error('Yahoo Finance Client: Request failed:', error)
    if (error instanceof YahooFinanceError) {
      throw error
    }
    throw new YahooFinanceError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function searchTickers(query: string): Promise<TickerSearchResponse> {
  console.log('Yahoo Finance: Searching tickers for:', query)
  
  try {
    return await makeRequest<TickerSearchResponse>('/search', { q: query })
  } catch (error) {
    console.error('Yahoo Finance: Search error:', error)
    throw new YahooFinanceError(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getAggregates(
  symbol: string,
  params: {
    multiplier?: number
    timespan?: string
    from: string
    to: string
    adjusted?: boolean
    sort?: string
    limit?: number
  }
): Promise<AggregatesResponse> {
  console.log('Yahoo Finance: Getting historical data for:', symbol, params)
  
  try {
    const response = await makeRequest<AggregatesResponse>('/historical', {
      symbol,
      from: params.from,
      to: params.to,
      timespan: params.timespan || 'day'
    })
    
    // Apply sort if needed
    if (params.sort === 'desc' && response.results) {
      response.results = response.results.reverse()
    }
    
    return response
  } catch (error) {
    console.error('Yahoo Finance: Historical data error:', error)
    throw new YahooFinanceError(`Historical data failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getSnapshot(symbol: string): Promise<SnapshotResponse> {
  console.log('Yahoo Finance: Getting quote for:', symbol)
  
  try {
    return await makeRequest<SnapshotResponse>('/quote', { symbol })
  } catch (error) {
    console.error('Yahoo Finance: Quote error:', error)
    throw new YahooFinanceError(`Quote failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

export async function getNews(symbol: string, limit: number = 10): Promise<NewsResponse> {
  console.log('Yahoo Finance: Getting news for:', symbol)
  
  try {
    return await makeRequest<NewsResponse>('/news', { 
      symbol, 
      limit: limit.toString() 
    })
  } catch (error) {
    console.error('Yahoo Finance: News error:', error)
    // Return empty news if news fails (not critical)
    return {
      status: 'OK',
      results: [],
      count: 0
    }
  }
}

export async function getMultipleSnapshots(symbols: string[]): Promise<SnapshotResponse> {
  console.log('Yahoo Finance: Getting multiple quotes for:', symbols)
  
  try {
    // Get quotes for all symbols
    const quotes = await Promise.all(
      symbols.map(async (symbol) => {
        try {
          const snapshot = await getSnapshot(symbol)
          return snapshot.results?.[0] || null
        } catch (error) {
          console.warn(`Failed to get quote for ${symbol}:`, error)
          return null
        }
      })
    )
    
    // Filter out failed quotes
    const validQuotes = quotes.filter(quote => quote !== null)
    
    return {
      status: 'OK',
      results: validQuotes
    }
  } catch (error) {
    console.error('Yahoo Finance: Multiple quotes error:', error)
    throw new YahooFinanceError(`Multiple quotes failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

// Helper function removed - now handled server-side
