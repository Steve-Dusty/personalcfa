'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { api, getDateRange } from '@/lib/api'
import { formatPrice, formatPercent } from '@/lib/format'
import type { TimeRange } from '@/types/polygon'
import { useAppStore } from '@/store/useAppStore'
import { NoSSR } from '@/components/providers/NoSSR'

interface StockChartProps {
  className?: string
  symbol?: string // Optional override for symbol
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

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-background border rounded-lg p-3 shadow-lg">
        <p className="font-medium">{label}</p>
        <div className="space-y-1 text-sm">
          <p>Open: {formatPrice(data.open)}</p>
          <p>High: {formatPrice(data.high)}</p>
          <p>Low: {formatPrice(data.low)}</p>
          <p>Close: {formatPrice(data.close)}</p>
          {data.volume && <p>Volume: {(data.volume / 1000000).toFixed(1)}M</p>}
        </div>
      </div>
    )
  }
  return null
}

export function StockChart({ className, symbol: propSymbol }: StockChartProps) {
  const { selectedSymbol, timeRange, setTimeRange } = useAppStore()
  const symbol = propSymbol || selectedSymbol
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [chartData, setChartData] = useState<any[]>([])

  // Fetch chart data when symbol or time range changes
  useEffect(() => {
    if (!symbol) return

    const fetchChartData = async () => {
      setLoading(true)
      setError(null)

      try {
        const { from, to } = getDateRange(timeRange)
        const timespan = timeRange === '1D' ? 'minute' : 'day'
        const multiplier = timeRange === '1D' ? 15 : 1

        const response = await api.getAggregates(symbol, {
          multiplier,
          timespan,
          from,
          to
        })
        
        if (response.results && response.results.length > 0) {
          const formattedData = response.results.map((item: any) => {
            const date = new Date(item.t)
            return {
              date: timeRange === '1D' 
                ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
              open: item.o,
              high: item.h,
              low: item.l,
              close: item.c,
              volume: item.v,
              timestamp: item.t
            }
          })
          setChartData(formattedData)
        } else {
          setError('No chart data available')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch chart data')
      } finally {
        setLoading(false)
      }
    }

    fetchChartData()
  }, [symbol, timeRange])

  if (!symbol) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Price Chart
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center h-[400px] text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-2">No stock selected</h3>
            <p className="text-sm text-muted-foreground">
              Choose a stock from your watchlist to view the chart
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1]?.close : 0
  const firstPrice = chartData.length > 0 ? chartData[0]?.open : 0
  const priceChange = currentPrice - firstPrice
  const priceChangePercent = firstPrice > 0 ? (priceChange / firstPrice) * 100 : 0

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {symbol}
            </CardTitle>
            {currentPrice > 0 && (
              <div className="flex items-center gap-2 mt-1">
                <p className="text-lg font-semibold">{formatPrice(currentPrice)}</p>
                <div className={`flex items-center gap-1 ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {priceChange >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                  <span className="font-medium">{formatPercent(priceChangePercent)}</span>
                  <span className="text-sm">({priceChange >= 0 ? '+' : ''}{formatPrice(priceChange)})</span>
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
        {loading ? (
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
        ) : error ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="rounded-full bg-destructive/10 p-3 mb-4 inline-flex">
                <BarChart3 className="h-6 w-6 text-destructive" />
              </div>
              <h3 className="font-medium mb-2">Failed to load chart</h3>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          </div>
        ) : (
          <NoSSR fallback={<div className="h-[400px] bg-muted/20 rounded animate-pulse" />}>
            <div className="h-[400px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={priceChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={priceChange >= 0 ? "#10b981" : "#ef4444"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    domain={['dataMin - 5', 'dataMax + 5']}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12 }}
                    tickFormatter={(value) => `$${value.toFixed(0)}`}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="close"
                    stroke={priceChange >= 0 ? "#10b981" : "#ef4444"}
                    fillOpacity={1}
                    fill="url(#colorClose)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </NoSSR>
        )}
      </CardContent>
    </Card>
  )
}

