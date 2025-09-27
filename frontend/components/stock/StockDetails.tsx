'use client'

import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Volume2, DollarSign, BarChart3, Activity } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatPrice, formatPercent, formatVolume, formatMarketCap, getChangeColor } from '@/lib/format'
import type { StockDetails as StockDetailsType } from '@/types/polygon'
import { useAppStore } from '@/store/useAppStore'

interface StockDetailsProps {
  className?: string
}

export function StockDetails({ className }: StockDetailsProps) {
  const { selectedSymbol } = useAppStore()
  const [details, setDetails] = useState<StockDetailsType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedSymbol) return

    const fetchDetails = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await api.getSnapshot(selectedSymbol)
        const result = response.results?.[0]
        
        if (result) {
          // Convert polygon response to our StockDetails type
          const stockDetails: StockDetailsType = {
            symbol: result.ticker,
            name: getCompanyName(result.ticker), // Helper function
            price: result.day.c,
            change: result.todaysChange,
            changePercent: result.todaysChangePerc,
            marketCap: calculateMarketCap(result.ticker, result.day.c), // Mock calculation
            pe: getMockPE(result.ticker), // Mock PE ratio
            week52High: result.day.h * 1.2, // Mock 52w high
            week52Low: result.day.l * 0.8, // Mock 52w low
            volume: result.day.v,
            avgVolume: result.day.v * 0.85, // Mock average volume
            marketStatus: getMarketStatus(result.market_status)
          }
          
          setDetails(stockDetails)
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stock details')
      } finally {
        setLoading(false)
      }
    }

    fetchDetails()
  }, [selectedSymbol])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg text-destructive">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    )
  }

  if (!details) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg">Select a Stock</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Choose a stock from your watchlist to view details
          </p>
        </CardContent>
      </Card>
    )
  }

  const changeColor = getChangeColor(details.change)
  const TrendIcon = details.change >= 0 ? TrendingUp : TrendingDown

  const metrics = [
    {
      label: 'Market Cap',
      value: details.marketCap ? formatMarketCap(details.marketCap) : 'N/A',
      icon: DollarSign
    },
    {
      label: 'P/E Ratio',
      value: details.pe ? details.pe.toFixed(2) : 'N/A',
      icon: BarChart3
    },
    {
      label: '52W High',
      value: details.week52High ? formatPrice(details.week52High) : 'N/A',
      icon: TrendingUp
    },
    {
      label: '52W Low',
      value: details.week52Low ? formatPrice(details.week52Low) : 'N/A',
      icon: TrendingDown
    },
    {
      label: 'Volume',
      value: details.volume ? formatVolume(details.volume) : 'N/A',
      icon: Volume2
    },
    {
      label: 'Avg Volume',
      value: details.avgVolume ? formatVolume(details.avgVolume) : 'N/A',
      icon: Activity
    }
  ]

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-mono">{details.symbol}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{details.name}</p>
          </div>
          <Badge variant={details.marketStatus === 'open' ? 'default' : 'secondary'}>
            {details.marketStatus.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Information */}
        <div className="space-y-2">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{formatPrice(details.price)}</span>
            <div className={`flex items-center gap-1 ${changeColor}`}>
              <TrendIcon className="h-4 w-4" />
              <span className="font-medium">{formatPercent(details.changePercent)}</span>
            </div>
          </div>
          <div className={`text-sm ${changeColor}`}>
            {details.change >= 0 ? '+' : ''}{formatPrice(details.change)} today
          </div>
        </div>

        {/* Key Metrics */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm">Key Metrics</h4>
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((metric) => {
              const Icon = metric.icon
              return (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon className="h-3 w-3" />
                    <span>{metric.label}</span>
                  </div>
                  <div className="text-sm font-medium">{metric.value}</div>
                </div>
              )
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Helper functions for mock data
function getCompanyName(symbol: string): string {
  const names: Record<string, string> = {
    'AAPL': 'Apple Inc.',
    'MSFT': 'Microsoft Corporation',
    'NVDA': 'NVIDIA Corporation',
    'TSLA': 'Tesla, Inc.',
    'AMZN': 'Amazon.com, Inc.',
    'GOOGL': 'Alphabet Inc.',
    'META': 'Meta Platforms, Inc.',
    'NFLX': 'Netflix, Inc.'
  }
  
  return names[symbol] || `${symbol} Corporation`
}

function calculateMarketCap(symbol: string, price: number): number {
  // Mock market cap calculation - in real app this would come from API
  const mockShares: Record<string, number> = {
    'AAPL': 15500000000,
    'MSFT': 7440000000,
    'NVDA': 2470000000,
    'TSLA': 3160000000,
    'AMZN': 10700000000
  }
  
  const shares = mockShares[symbol] || 1000000000
  return price * shares
}

function getMockPE(symbol: string): number {
  const mockPEs: Record<string, number> = {
    'AAPL': 29.5,
    'MSFT': 34.2,
    'NVDA': 65.8,
    'TSLA': 45.3,
    'AMZN': 52.1
  }
  
  return mockPEs[symbol] || 25.0
}

function getMarketStatus(status: string): 'open' | 'closed' | 'pre' | 'after' {
  switch (status.toLowerCase()) {
    case 'open':
      return 'open'
    case 'closed':
      return 'closed'
    case 'pre':
      return 'pre'
    case 'after':
      return 'after'
    default:
      return 'closed'
  }
}
