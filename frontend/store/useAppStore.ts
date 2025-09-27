// Global app state using Zustand

import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { WatchlistItem, ChatMessage, TimeRange } from '@/types/polygon'

interface AppState {
  // Selected stock
  selectedSymbol: string
  setSelectedSymbol: (symbol: string) => void
  
  // Watchlist
  watchlist: WatchlistItem[]
  addToWatchlist: (item: WatchlistItem) => void
  removeFromWatchlist: (symbol: string) => void
  updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => void
  setWatchlist: (watchlist: WatchlistItem[]) => void
  
  // Chart settings
  timeRange: TimeRange
  setTimeRange: (range: TimeRange) => void
  
  // UI preferences
  
  sidebarCollapsed: boolean
  setSidebarCollapsed: (collapsed: boolean) => void
  
  chatPanelOpen: boolean
  setChatPanelOpen: (open: boolean) => void
  
  // Agent chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  clearChatMessages: () => void
  
  // Search
  recentSearches: string[]
  addRecentSearch: (symbol: string) => void
  clearRecentSearches: () => void
  
  // Quick ticker switcher
  tickerSwitcherOpen: boolean
  setTickerSwitcherOpen: (open: boolean) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Selected stock
      selectedSymbol: 'AAPL',
      setSelectedSymbol: (symbol: string) => {
        set({ selectedSymbol: symbol })
        // Add to recent searches
        get().addRecentSearch(symbol)
      },
      
      // Watchlist - loaded dynamically from API
      watchlist: [],
      
      addToWatchlist: (item: WatchlistItem) => {
        const { watchlist } = get()
        if (!watchlist.find(w => w.symbol === item.symbol)) {
          set({ watchlist: [...watchlist, item] })
        }
      },
      
      removeFromWatchlist: (symbol: string) => {
        const { watchlist } = get()
        set({ watchlist: watchlist.filter(w => w.symbol !== symbol) })
      },
      
      setWatchlist: (watchlist: WatchlistItem[]) => set({ watchlist }),
      
      updateWatchlistItem: (symbol: string, updates: Partial<WatchlistItem>) => {
        const { watchlist } = get()
        set({
          watchlist: watchlist.map(item =>
            item.symbol === symbol ? { ...item, ...updates } : item
          )
        })
      },
      
      // Chart settings
      timeRange: '1M',
      setTimeRange: (range: TimeRange) => set({ timeRange: range }),
      
      // UI preferences
      
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed: boolean) => set({ sidebarCollapsed: collapsed }),
      
      chatPanelOpen: true,
      setChatPanelOpen: (open: boolean) => set({ chatPanelOpen: open }),
      
      // Agent chat
      chatMessages: [
        {
          id: 'welcome',
          role: 'assistant',
          content: "Hi! I'm your AI stock analysis assistant. Search for a ticker and ask me questions about trends, volatility, or any analysis you'd like.",
          timestamp: Date.now() - 60000
        }
      ],
      
      addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
        const { chatMessages } = get()
        const newMessage: ChatMessage = {
          ...message,
          id: Math.random().toString(36).substr(2, 9),
          timestamp: Date.now()
        }
        set({ chatMessages: [...chatMessages, newMessage] })
      },
      
      clearChatMessages: () => set({ chatMessages: [] }),
      
      // Search
      recentSearches: ['AAPL', 'MSFT', 'NVDA'],
      
      addRecentSearch: (symbol: string) => {
        const { recentSearches } = get()
        const filtered = recentSearches.filter(s => s !== symbol.toUpperCase())
        set({ recentSearches: [symbol.toUpperCase(), ...filtered].slice(0, 5) })
      },
      
      clearRecentSearches: () => set({ recentSearches: [] }),
      
      // Quick ticker switcher
      tickerSwitcherOpen: false,
      setTickerSwitcherOpen: (open: boolean) => set({ tickerSwitcherOpen: open }),
    }),
    {
      name: 'personal-cfa-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        watchlist: state.watchlist,
        sidebarCollapsed: state.sidebarCollapsed,
        chatPanelOpen: state.chatPanelOpen,
        recentSearches: state.recentSearches,
        timeRange: state.timeRange,
        selectedSymbol: state.selectedSymbol
      })
    }
  )
)
