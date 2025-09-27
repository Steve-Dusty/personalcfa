'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { api } from '@/lib/api'
import type { TickerSearchResult } from '@/types/polygon'
import { useAppStore } from '@/store/useAppStore'
import { useWatchlist } from '@/hooks/useWatchlist'

interface TickerSearchProps {
  onSelect?: (ticker: string) => void
  placeholder?: string
  className?: string
}

export function TickerSearch({ onSelect, placeholder = "Search stocks...", className }: TickerSearchProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<TickerSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const { recentSearches, addRecentSearch } = useAppStore()
  const { addStock } = useWatchlist()

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    if (query.trim().length < 1) {
      setResults([])
      return
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await api.searchTickers(query)
        setResults(response.results || [])
      } catch (error) {
        console.error('Search error:', error)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [query])

  const handleSelect = async (ticker: string, name?: string) => {
    try {
      addRecentSearch(ticker)
      console.log('Adding stock to watchlist:', ticker, name)
      
      // Find the name from results if not provided
      const stockName = name || results.find(r => r.ticker === ticker)?.name || ticker
      
      addStock(ticker, stockName) // Add to watchlist with name
      console.log('Successfully added stock:', ticker, stockName)
      onSelect?.(ticker)
      setOpen(false)
      setQuery('')
    } catch (error) {
      console.error('Failed to add stock to watchlist:', error)
      // Still proceed with other actions even if watchlist add fails
      onSelect?.(ticker)
      setOpen(false)
      setQuery('')
    }
  }

  const displayResults = query.trim().length > 0 ? results : []
  const showRecentSearches = query.trim().length === 0 && recentSearches.length > 0

  return (
    <div className={className}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start text-left font-normal"
          >
            <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
            {placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Type a ticker or company name..."
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              {loading && (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2 text-sm text-muted-foreground">Searching...</span>
                </div>
              )}
              
              {!loading && query.trim().length > 0 && displayResults.length === 0 && (
                <CommandEmpty>No stocks found.</CommandEmpty>
              )}
              
              {showRecentSearches && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((ticker) => (
                    <CommandItem
                      key={ticker}
                      value={ticker}
                      onSelect={() => handleSelect(ticker)}
                      className="cursor-pointer"
                    >
                      <span className="font-mono font-medium">{ticker}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
              
              {displayResults.length > 0 && (
                <CommandGroup heading="Search Results">
                  {displayResults.map((result) => (
                    <CommandItem
                      key={result.ticker}
                      value={result.ticker}
                      onSelect={() => handleSelect(result.ticker, result.name)}
                      className="cursor-pointer"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-medium">{result.ticker}</span>
                        <span className="text-sm text-muted-foreground">{result.name}</span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
