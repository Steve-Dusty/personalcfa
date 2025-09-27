// Yahoo Finance search API route
import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    
    if (!query) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      )
    }

    console.log('Yahoo Finance API: Searching for:', query)
    
    const searchResults = await yahooFinance.search(query, {
      quotesCount: 10,
      newsCount: 0
    })
    
    console.log('Yahoo Finance API: Search results:', searchResults.quotes?.length || 0, 'results')
    
    // Transform to match our expected format
    const results = (searchResults.quotes || []).map(quote => ({
      ticker: quote.symbol,
      name: quote.longname || quote.shortname || quote.symbol,
      market: 'stocks',
      locale: 'us',
      primary_exchange: quote.exchange || 'UNKNOWN',
      type: quote.quoteType || 'EQUITY',
      active: true,
      currency_name: 'usd',
      cik: '',
      composite_figi: '',
      share_class_figi: '',
      last_updated_utc: new Date().toISOString()
    }))

    return NextResponse.json({
      status: 'OK',
      results,
      count: results.length,
      next_url: null
    })
    
  } catch (error) {
    console.error('Yahoo Finance API: Search error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
