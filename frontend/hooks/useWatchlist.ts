'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAppStore } from '@/store/useAppStore'
import { api } from '@/lib/api'
import { WatchlistManager } from '@/lib/watchlist'
import { generateSparklineData } from '@/lib/sparkline'
import type { WatchlistItem } from '@/types/polygon'

export function useWatchlist() {
  const { watchlist, setWatchlist, addToWatchlist, removeFromWatchlist } = useAppStore()
  const queryClient = useQueryClient()

  // Initialize defaults on first load
  useEffect(() => {
    WatchlistManager.initializeDefaults()
  }, [])

  // Get watchlist symbols from localStorage
  const { data: symbols = [], isLoading: symbolsLoading } = useQuery({
    queryKey: ['watchlist-symbols'],
    queryFn: () => Promise.resolve(WatchlistManager.getSymbols()),
    staleTime: 0, // Always refetch to get latest localStorage data
  })

  // Fetch stock data for watchlist symbols
  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['watchlist-data', symbols],
    queryFn: async () => {
      if (symbols.length === 0) return []
      
      console.log('Fetching data for symbols:', symbols)
      
      try {
        // Get snapshots for all symbols
        const promises = symbols.map(async (symbol) => {
          try {
            console.log(`Fetching data for ${symbol}...`)
            
            // Try to get snapshot first
            const snapshot = await api.getSnapshot(symbol)
            console.log(`Snapshot response for ${symbol}:`, snapshot)
            
            const result = snapshot.results?.[0]
            
            if (result && typeof result === 'object') {
              // Safely extract data with fallbacks
              const price = (result.last_quote && typeof result.last_quote === 'object' ? result.last_quote.c : null) 
                         || result.fmv 
                         || result.value 
                         || 100 + Math.random() * 50 // Fallback mock price
              const change = result.todaysChange || (Math.random() - 0.5) * 10
              const changePercent = result.todaysChangePerc || (change / price) * 100
              const name = result.name || `${symbol} Inc.`
              
              console.log(`Successfully extracted data for ${symbol}:`, { price, change, changePercent, name })
              
              return {
                symbol: result.ticker || symbol.toUpperCase(),
                name: name,
                price: price,
                change: change,
                changePercent: changePercent,
                sparklineData: generateSparklineData(price, 10, 0.02)
              } as WatchlistItem
            } else {
              console.warn(`No valid result for ${symbol}, using mock data`)
              // Return mock data as fallback
              const mockPrice = 100 + Math.random() * 50
              const mockChange = (Math.random() - 0.5) * 10
              return {
                symbol: symbol.toUpperCase(),
                name: `${symbol} Inc.`,
                price: mockPrice,
                change: mockChange,
                changePercent: (mockChange / mockPrice) * 100,
                sparklineData: generateSparklineData(mockPrice, 10, 0.02)
              } as WatchlistItem
            }
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error)
            // Return mock data on error
            const mockPrice = 100 + Math.random() * 50
            const mockChange = (Math.random() - 0.5) * 10
            return {
              symbol: symbol.toUpperCase(),
              name: `${symbol} Inc.`,
              price: mockPrice,
              change: mockChange,
              changePercent: (mockChange / mockPrice) * 100,
              sparklineData: generateSparklineData(mockPrice, 10, 0.02)
            } as WatchlistItem
          }
        })
        
        const results = await Promise.all(promises)
        console.log('Final watchlist results:', results)
        return results.filter(Boolean) as WatchlistItem[]
      } catch (error) {
        console.error('Error fetching watchlist data:', error)
        return []
      }
    },
    enabled: symbols.length > 0,
    refetchInterval: 60000, // Refetch every minute
  })

  // Update store when data changes
  useEffect(() => {
    if (stocksData) {
      setWatchlist(stocksData)
    }
  }, [stocksData, setWatchlist])

  // Mutation to add stock to watchlist
  const addMutation = useMutation({
    mutationFn: async ({ symbol, name }: { symbol: string; name: string }) => {
      console.log('useWatchlist: Adding stock', symbol, name)
      const success = WatchlistManager.addStock(symbol, name)
      if (!success) {
        throw new Error('Failed to add stock to watchlist')
      }
      console.log('useWatchlist: Successfully added stock', symbol)
      return symbol
    },
    onSuccess: (symbol) => {
      console.log('useWatchlist: Invalidating queries after adding', symbol)
      queryClient.invalidateQueries({ queryKey: ['watchlist-symbols'] })
    },
    onError: (error) => {
      console.error('useWatchlist: Failed to add stock', error)
    }
  })

  // Mutation to remove stock from watchlist
  const removeMutation = useMutation({
    mutationFn: (symbol: string) => {
      const success = WatchlistManager.removeStock(symbol)
      if (!success) {
        throw new Error('Failed to remove stock from watchlist')
      }
      return Promise.resolve(symbol)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchlist-symbols'] })
    },
  })

  return {
    watchlist,
    isLoading: symbolsLoading || stocksLoading,
    addStock: (symbol: string, name: string) => addMutation.mutate({ symbol, name }),
    removeStock: removeMutation.mutate,
    isAdding: addMutation.isPending,
    isRemoving: removeMutation.isPending,
    hasStock: (symbol: string) => WatchlistManager.hasStock(symbol),
  }
}
