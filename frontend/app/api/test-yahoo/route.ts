// Test Yahoo Finance API
import { NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET() {
  try {
    console.log('Testing Yahoo Finance API...')
    
    // Test with AAPL
    const quote = await yahooFinance.quote('AAPL')
    console.log('AAPL quote:', quote)
    
    // Test search
    const search = await yahooFinance.search('AAPL', { quotesCount: 1, newsCount: 0 })
    console.log('AAPL search:', search)
    
    return NextResponse.json({
      success: true,
      quote: quote,
      search: search,
      message: 'Yahoo Finance API is working!'
    })
    
  } catch (error) {
    console.error('Yahoo Finance test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Yahoo Finance API failed'
    }, { status: 500 })
  }
}
