'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatPrice, formatPercent } from '@/lib/format'
import { useAppStore } from '@/store/useAppStore'
import { useWatchlist } from '@/hooks/useWatchlist'
import { NoSSR } from '@/components/providers/NoSSR'
import { api } from '@/lib/api'
import type { TimeRange } from '@/types/polygon'

interface PortfolioChartProps {
  className?: string
}

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '1D', value: '1D' },
  { label: '5D', value: '5D' },
  { label: '1M', value: '1M' },
  { label: '6M', value: '6M' },
  { label: 'YTD', value: 'YTD' },
  { label: '1Y', value: '1Y' },
  { label: '5Y', value: '5Y' },
]

// Calculate portfolio performance using real data
async function calculatePortfolioData(watchlist: any[], timeRange: TimeRange) {
  if (watchlist.length === 0) return []

  console.log('Calculating portfolio data for:', watchlist.map(s => s.symbol), 'timeRange:', timeRange)
  
  try {
    // Get aggregates for all stocks in watchlist + SPY (S&P 500 ETF)
    const symbols = [...watchlist.map(s => s.symbol), 'SPY']
    const aggregatesPromises = symbols.map(symbol => 
      api.getAggregates(symbol, {
        timespan: timeRange === '1D' ? 'hour' : 'day',
        multiplier: 1,
        from: getFromDate(timeRange),
        to: new Date().toISOString().split('T')[0]
      }).catch(error => {
        console.error(`Failed to get aggregates for ${symbol}:`, error)
        return { results: [] }
      })
    )

    const aggregatesResults = await Promise.all(aggregatesPromises)
    console.log('Aggregates results:', aggregatesResults)

    // Process the data
    const stockData = aggregatesResults.slice(0, -1) // All except SPY
    const spyData = aggregatesResults[aggregatesResults.length - 1] // SPY data

    if (!spyData.results || spyData.results.length === 0) {
      console.warn('No SPY data available')
      return []
    }

    // Calculate portfolio performance vs SPY
    const chartData = []
    const maxLength = Math.min(30, spyData.results.length)

    for (let i = 0; i < maxLength; i++) {
      const spyBar = spyData.results[i]
      if (!spyBar) continue

      const date = new Date(spyBar.t)
      
      // Calculate portfolio weighted average performance
      let portfolioValue = 0
      let portfolioCount = 0

      stockData.forEach((stockResult, idx) => {
        if (stockResult.results && stockResult.results[i]) {
          const bar = stockResult.results[i]
          const basePrice = stockResult.results[0]?.c || bar.c
          const change = ((bar.c - basePrice) / basePrice) * 100
          portfolioValue += change
          portfolioCount++
        }
      })

      const portfolioAvg = portfolioCount > 0 ? portfolioValue / portfolioCount : 0
      
      // Calculate SPY performance
      const spyBasePrice = spyData.results[0]?.c || spyBar.c
      const spyChange = ((spyBar.c - spyBasePrice) / spyBasePrice) * 100

      chartData.push({
        date: timeRange === '1D' 
          ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
          : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        portfolio: portfolioAvg,
        sp500: spyChange,
        timestamp: date.getTime()
      })
    }

    console.log('Generated chart data:', chartData)
    return chartData.reverse() // Show chronologically

  } catch (error) {
    console.error('Error calculating portfolio data:', error)
    return []
  }
}

// Helper function to get from date based on time range
function getFromDate(timeRange: TimeRange): string {
  const now = new Date()
  const from = new Date(now)
  
  switch (timeRange) {
    case '1D':
      from.setDate(now.getDate() - 1)
      break
    case '5D':
      from.setDate(now.getDate() - 5)
      break
    case '1M':
      from.setMonth(now.getMonth() - 1)
      break
    case '6M':
      from.setMonth(now.getMonth() - 6)
      break
    case 'YTD':
      from.setMonth(0, 1) // January 1st
      break
    case '1Y':
      from.setFullYear(now.getFullYear() - 1)
      break
    case '5Y':
      from.setFullYear(now.getFullYear() - 5)
      break
    default:
      from.setMonth(now.getMonth() - 1)
  }
  
  return from.toISOString().split('T')[0]
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-sm">
            {entry.name}: {entry.value >= 0 ? '+' : ''}{entry.value.toFixed(2)}%
          </p>
        ))}
      </div>
    )
  }
  return null
}

export function PortfolioChart({ className }: PortfolioChartProps) {
  const { timeRange, setTimeRange } = useAppStore()
  const { watchlist, isLoading: watchlistLoading } = useWatchlist()
  const [loading, setLoading] = useState(false)
  const [chartData, setChartData] = useState<any[]>([])

  // Generate chart data when watchlist or time range changes
  useEffect(() => {
    if (watchlist.length === 0) {
      setChartData([])
      return
    }

    setLoading(true)
    
    calculatePortfolioData(watchlist, timeRange)
      .then(data => {
        setChartData(data)
        setLoading(false)
      })
      .catch(error => {
        console.error('Failed to calculate portfolio data:', error)
        setChartData([])
        setLoading(false)
      })
  }, [watchlist, timeRange])

  const isLoadingData = watchlistLoading || loading

  const portfolioChange = chartData.length > 0 ? chartData[chartData.length - 1]?.portfolio : 0
  const sp500Change = chartData.length > 0 ? chartData[chartData.length - 1]?.sp500 : 0
  
  // Calculate total portfolio value using real stock prices
  // Assume 1 share of each stock for simplicity (can be made configurable later)
  const totalValue = watchlist.reduce((sum, stock) => sum + (stock.price || 0), 0)
  const portfolioValue = totalValue * (1 + portfolioChange / 100)

  if (watchlist.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Portfolio Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No stocks in portfolio</h3>
            <p className="text-sm text-muted-foreground">
              Add stocks to your watchlist to see your portfolio performance
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Portfolio Overview
            </CardTitle>
            {portfolioValue > 0 && (
              <div className="flex items-center gap-4 mt-1">
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">{formatPrice(portfolioValue)}</p>
                  <div className={`flex items-center gap-1 ${portfolioChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {portfolioChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                    <span className="font-medium">{portfolioChange >= 0 ? '+' : ''}{portfolioChange.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  vs S&P 500: <span className={sp500Change >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {sp500Change >= 0 ? '+' : ''}{sp500Change.toFixed(2)}%
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="flex gap-1">
            {TIME_RANGES.map((range) => (
              <Button
                key={range.value}
                variant={timeRange === range.value ? 'default' : 'ghost'}
                size="sm"
                className="h-8 px-3 text-xs"
                onClick={() => setTimeRange(range.value)}
              >
                {range.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoadingData ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="space-y-4 w-full max-w-md">
              <Skeleton className="h-8 w-3/4 mx-auto" />
              <Skeleton className="h-64 w-full" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-16" />
              </div>
            </div>
          </div>
        ) : (
          <NoSSR fallback={<div className="h-[400px] bg-muted/20 rounded animate-pulse" />}>
            <div className="h-[400px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `${value >= 0 ? '+' : ''}${value.toFixed(0)}%`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  
                  {/* Portfolio performance line */}
                  <Line
                    type="monotone"
                    dataKey="portfolio"
                    stroke="#2563eb"
                    strokeWidth={3}
                    dot={false}
                    name="Portfolio"
                  />
                  
                  {/* S&P 500 benchmark line */}
                  <Line
                    type="monotone"
                    dataKey="sp500"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    dot={false}
                    name="S&P 500"
                    strokeDasharray="5 5"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </NoSSR>
        )}
      </CardContent>
    </Card>
  )
}
