'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { formatPrice, formatPercent, getChangeColor } from '@/lib/format'
import { generateSparklinePath } from '@/lib/sparkline'
import { useAppStore } from '@/store/useAppStore'
import { useWatchlist } from '@/hooks/useWatchlist'
import type { WatchlistItem } from '@/types/polygon'

interface WatchlistProps {
  className?: string
}

function SparklineChart({ data, change }: { data: number[], change: number }) {
  if (!data || data.length < 2) return null
  
  const path = generateSparklinePath(data, 60, 20)
  const color = change >= 0 ? '#10b981' : '#ef4444'
  
  return (
    <svg width="60" height="20" className="opacity-60">
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  )
}

function WatchlistItemComponent({ 
  item, 
  isSelected, 
  onSelect, 
  onRemove 
}: { 
  item: WatchlistItem
  isSelected: boolean
  onSelect: () => void
  onRemove: () => void
}) {
  const changeColor = getChangeColor(item.change)
  const TrendIcon = item.change >= 0 ? TrendingUp : TrendingDown

  return (
    <div
      className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors hover:bg-accent/50 ${
        isSelected ? 'bg-accent' : ''
      }`}
      onClick={onSelect}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-mono font-medium text-sm">{item.symbol}</span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground truncate">
          {item.name}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="font-medium text-sm">{formatPrice(item.price)}</span>
          <div className="flex items-center gap-1">
            <SparklineChart data={item.sparklineData || []} change={item.change} />
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs ${changeColor}`}>
          <TrendIcon className="h-3 w-3" />
          <span>{formatPercent(item.changePercent)}</span>
          <span>({formatPrice(Math.abs(item.change))})</span>
        </div>
      </div>
    </div>
  )
}

export function Watchlist({ className }: WatchlistProps) {
  const router = useRouter()
  const { selectedSymbol, setSelectedSymbol } = useAppStore()
  const { watchlist, isLoading, removeStock, addStock } = useWatchlist()
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newTicker, setNewTicker] = useState('')

  const handleSelectStock = (symbol: string) => {
    setSelectedSymbol(symbol)
    router.push(`/ticker/${symbol.toLowerCase()}`)
  }

  const handleRemoveStock = (symbol: string) => {
    removeStock(symbol)
    // If we removed the currently selected stock, select the first one in the list
    if (symbol === selectedSymbol && watchlist.length > 1) {
      const remaining = watchlist.filter(item => item.symbol !== symbol)
      if (remaining.length > 0) {
        setSelectedSymbol(remaining[0].symbol)
      }
    }
  }

  const handleAddStock = () => {
    if (newTicker.trim()) {
      const ticker = newTicker.trim().toUpperCase()
      console.log('Adding stock manually:', ticker)
      addStock(ticker, ticker) // Use ticker as name for now
      setNewTicker('')
      setShowAddDialog(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleAddStock()
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          Watchlist
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Stock to Watchlist</DialogTitle>
              </DialogHeader>
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Enter ticker symbol (e.g., AAPL)"
                  value={newTicker}
                  onChange={(e) => setNewTicker(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button onClick={handleAddStock} disabled={!newTicker.trim()}>
                  Add
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Enter a stock ticker symbol like AAPL, MSFT, TSLA, etc.
              </p>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Loading watchlist...</p>
            </div>
          ) : watchlist.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="rounded-full bg-muted p-3 mb-4">
                <TrendingUp className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="font-medium mb-2">No stocks in watchlist</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Search for stocks to add them to your watchlist
              </p>
            </div>
          ) : (
            <div className="px-3 pb-3 space-y-1">
              {watchlist.map((item, index) => (
                <div key={item.symbol}>
                  <WatchlistItemComponent
                    item={item}
                    isSelected={item.symbol === selectedSymbol}
                    onSelect={() => handleSelectStock(item.symbol)}
                    onRemove={() => handleRemoveStock(item.symbol)}
                  />
                  {index < watchlist.length - 1 && (
                    <Separator className="my-1" />
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
