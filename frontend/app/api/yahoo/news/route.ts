// Yahoo Finance news API route
import { NextRequest, NextResponse } from 'next/server'
import yahooFinance from 'yahoo-finance2'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const limit = parseInt(searchParams.get('limit') || '10')
    
    if (!symbol) {
      return NextResponse.json(
        { error: 'Query parameter "symbol" is required' },
        { status: 400 }
      )
    }

    console.log('Yahoo Finance API: Getting news for:', symbol)
    
    const searchResults = await yahooFinance.search(symbol, {
      quotesCount: 1,
      newsCount: limit
    })
    
    console.log('Yahoo Finance API: News results:', searchResults.news?.length || 0, 'articles')
    
    // Transform to match our expected format
    const results = (searchResults.news || []).map(article => ({
      id: article.uuid || Math.random().toString(),
      publisher: {
        name: article.publisher || 'Yahoo Finance',
        homepage_url: 'https://finance.yahoo.com',
        logo_url: '',
        favicon_url: ''
      },
      title: article.title,
      author: '',
      published_utc: new Date(article.providerPublishTime * 1000).toISOString(),
      article_url: article.link,
      tickers: [symbol.toUpperCase()],
      image_url: article.thumbnail?.resolutions?.[0]?.url || '',
      description: article.summary || '',
      keywords: []
    }))

    return NextResponse.json({
      status: 'OK',
      results,
      count: results.length
    })
    
  } catch (error) {
    console.error('Yahoo Finance API: News error:', error)
    return NextResponse.json({
      status: 'OK',
      results: [],
      count: 0
    })
  }
}
