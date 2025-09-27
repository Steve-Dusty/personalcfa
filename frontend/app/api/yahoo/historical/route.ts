// Yahoo Finance historical data API route
import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const timespan = searchParams.get('timespan') || 'day'
    
    if (!symbol || !from || !to) {
      return NextResponse.json(
        { error: 'Query parameters "symbol", "from", and "to" are required' },
        { status: 400 }
      )
    }

    console.log('Yahoo Finance API: Getting historical data for:', symbol, 'from:', from, 'to:', to)
    
    // Convert timespan to Yahoo Finance interval
    let interval = '1d'
    switch (timespan) {
      case 'minute':
        interval = '1m'
        break
      case 'hour':
        interval = '1h'
        break
      case 'day':
        interval = '1d'
        break
      case 'week':
        interval = '1wk'
        break
      case 'month':
        interval = '1mo'
        break
    }
    
    const period1 = new Date(from)
    const period2 = new Date(to)
    
    const historicalData = await yahooFinance.historical(symbol, {
      period1,
      period2,
      interval: interval as any
    })
    
    console.log('Yahoo Finance API: Historical data received:', historicalData.length, 'bars')
    
    // Transform to match our expected format
    const results = historicalData.map(bar => ({
      c: bar.close,
      h: bar.high,
      l: bar.low,
      n: 1,
      o: bar.open,
      t: bar.date.getTime(),
      v: bar.volume || 0,
      vw: bar.close
    }))

    return NextResponse.json({
      status: 'OK',
      results,
      ticker: symbol.toUpperCase(),
      queryCount: 1,
      resultsCount: results.length
    })
    
  } catch (error) {
    console.error('Yahoo Finance API: Historical data error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
