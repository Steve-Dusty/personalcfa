// Client-side watchlist management using localStorage as JSON storage

export interface WatchlistStock {
  symbol: string
  name: string
  addedAt: number
}

const WATCHLIST_KEY = 'personal-cfa-watchlist'

export class WatchlistManager {
  // Get all stocks from localStorage
  static getStocks(): WatchlistStock[] {
    try {
      if (typeof window === 'undefined') return []
      const stored = localStorage.getItem(WATCHLIST_KEY)
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error reading watchlist:', error)
      return []
    }
  }

  // Add stock to watchlist
  static addStock(symbol: string, name: string): boolean {
    try {
      if (typeof window === 'undefined') return false
      
      const stocks = this.getStocks()
      const upperSymbol = symbol.toUpperCase()
      
      // Check if already exists
      if (stocks.some(stock => stock.symbol === upperSymbol)) {
        console.log('Stock already in watchlist:', upperSymbol)
        return false
      }

      // Add new stock
      const newStock: WatchlistStock = {
        symbol: upperSymbol,
        name: name,
        addedAt: Date.now()
      }
      
      stocks.push(newStock)
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(stocks))
      console.log('Added to watchlist:', newStock)
      return true
    } catch (error) {
      console.error('Error adding to watchlist:', error)
      return false
    }
  }

  // Remove stock from watchlist
  static removeStock(symbol: string): boolean {
    try {
      if (typeof window === 'undefined') return false
      
      const stocks = this.getStocks()
      const upperSymbol = symbol.toUpperCase()
      const filtered = stocks.filter(stock => stock.symbol !== upperSymbol)
      
      if (filtered.length === stocks.length) {
        console.log('Stock not found in watchlist:', upperSymbol)
        return false
      }

      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(filtered))
      console.log('Removed from watchlist:', upperSymbol)
      return true
    } catch (error) {
      console.error('Error removing from watchlist:', error)
      return false
    }
  }

  // Get symbols only (for API calls)
  static getSymbols(): string[] {
    return this.getStocks().map(stock => stock.symbol)
  }

  // Check if stock is in watchlist
  static hasStock(symbol: string): boolean {
    return this.getStocks().some(stock => stock.symbol === symbol.toUpperCase())
  }

  // Clear all stocks
  static clear(): void {
    try {
      if (typeof window === 'undefined') return
      localStorage.removeItem(WATCHLIST_KEY)
      console.log('Cleared watchlist')
    } catch (error) {
      console.error('Error clearing watchlist:', error)
    }
  }

  // Initialize with default stocks if empty
  static initializeDefaults(): void {
    const stocks = this.getStocks()
    if (stocks.length === 0) {
      // Add some default stocks
      this.addStock('AAPL', 'Apple Inc.')
      this.addStock('MSFT', 'Microsoft Corporation')
      this.addStock('NVDA', 'NVIDIA Corporation')
      console.log('Initialized watchlist with default stocks')
    }
  }
}
