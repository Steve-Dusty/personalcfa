'use client'

import { useEffect } from 'react'
import { Moon, Sun, Search, Menu, X, Command } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { TickerSearch } from '@/components/search/TickerSearch'
import { Watchlist } from '@/components/watchlist/Watchlist'
import { StockDetails } from '@/components/stock/StockDetails'
import { PortfolioChart } from '@/components/chart/PortfolioChart'
import { HeadlineList } from '@/components/news/HeadlineList'
import { AgentPanel } from '@/components/agent/AgentPanel'
import { useAppStore } from '@/store/useAppStore'
import { useTheme } from '@/components/providers/ThemeProvider'
import { NoSSR } from '@/components/providers/NoSSR'

interface AppShellProps {
  children?: React.ReactNode
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark'
    setTheme(newTheme)
  }

  const getThemeIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-4 w-4" />
      case 'light':
        return <Sun className="h-4 w-4" />
      default:
        return <Command className="h-4 w-4" />
    }
  }

  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme}>
      {getThemeIcon()}
    </Button>
  )
}

function Header() {
  const { setSelectedSymbol, setTickerSwitcherOpen } = useAppStore()

  // Handle Cmd/Ctrl+K for quick ticker switcher
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setTickerSwitcherOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTickerSwitcherOpen])

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container flex h-16 items-center gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold">Personal CFA</h1>
        </div>
        
        <div className="flex-1 max-w-md">
          <NoSSR fallback={<div className="h-10 bg-muted/20 rounded-md animate-pulse" />}>
            <TickerSearch
              onSelect={setSelectedSymbol}
              placeholder="Search stocks... (⌘K)"
              className="w-full"
            />
          </NoSSR>
        </div>

        <div className="flex items-center gap-2">
          <NoSSR fallback={<div className="h-9 w-9 bg-muted/20 rounded animate-pulse" />}>
            <ThemeToggle />
          </NoSSR>
          
          {/* Mobile menu trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="md:hidden">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="flex flex-col gap-4 mt-4">
                <AgentPanel />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function DesktopLayout() {
  const { chatPanelOpen } = useAppStore()

  return (
    <ResizablePanelGroup direction="horizontal" className="min-h-screen">
      {/* Left Sidebar - Only Watchlist */}
      <ResizablePanel defaultSize={20} minSize={15} maxSize={25}>
        <div className="h-full p-4">
          <Watchlist />
        </div>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      {/* Main Content - Portfolio Overview Chart */}
      <ResizablePanel defaultSize={chatPanelOpen ? 55 : 80} minSize={40}>
        <div className="h-full p-4">
          <PortfolioChart className="h-full" />
        </div>
      </ResizablePanel>
      
      {/* Right Sidebar - Agent Panel */}
      {chatPanelOpen && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
            <div className="h-full p-4">
              <div className="h-full">
                <AgentPanel />
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

function MobileLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="p-4 space-y-4">
        <PortfolioChart />
        <Watchlist />
      </div>
    </div>
  )
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Header />
      
      <NoSSR fallback={<div className="min-h-screen bg-background" />}>
        {/* Desktop Layout */}
        <div className="hidden md:block">
          <DesktopLayout />
        </div>
        
        {/* Mobile Layout */}
        <div className="md:hidden">
          <MobileLayout />
        </div>
        
        {children}
      </NoSSR>
    </div>
  )
}
