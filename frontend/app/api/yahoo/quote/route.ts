// Yahoo Finance quote API route
import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Query parameter "symbol" is required' },
        { status: 400 }
      )
    }

    console.log('Yahoo Finance API: Getting quote for:', symbol)
    
    const quote = await yahooFinance.quote(symbol)
    
    console.log('Yahoo Finance API: Quote received for:', symbol, quote)
    
    // Check if quote is valid
    if (!quote || typeof quote !== 'object') {
      console.error('Yahoo Finance API: Invalid quote response:', quote)
      throw new Error(`Invalid quote response for ${symbol}`)
    }
    
    // Transform to match our expected format
    const result = {
      ticker: symbol.toUpperCase(),
      todaysChangePerc: quote.regularMarketChangePercent || 0,
      todaysChange: quote.regularMarketChange || 0,
      updated: Date.now(),
      timeframe: 'REAL-TIME',
      market_status: quote.marketState || 'REGULAR',
      fmv: quote.regularMarketPrice || 0,
      value: quote.regularMarketPrice || 0,
      last_quote: {
        c: quote.regularMarketPrice || 0,
        h: quote.regularMarketDayHigh || 0,
        l: quote.regularMarketDayLow || 0,
        o: quote.regularMarketOpen || 0,
        v: quote.regularMarketVolume || 0,
        t: Date.now()
      },
      last_trade: {
        c: quote.regularMarketPrice || 0,
        h: quote.regularMarketDayHigh || 0,
        l: quote.regularMarketDayLow || 0,
        o: quote.regularMarketOpen || 0,
        v: quote.regularMarketVolume || 0,
        t: Date.now()
      },
      name: quote.longName || quote.shortName || symbol,
      market_cap: quote.marketCap || 0
    }

    return NextResponse.json({
      status: 'OK',
      results: [result]
    })
    
  } catch (error) {
    console.error('Yahoo Finance API: Quote error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
