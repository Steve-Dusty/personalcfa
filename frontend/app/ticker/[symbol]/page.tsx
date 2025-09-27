'use client'

import { useEffect } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { StockChart } from '@/components/chart/StockChart'
import { StockDetails } from '@/components/stock/StockDetails'
import { HeadlineList } from '@/components/news/HeadlineList'
import { AgentPanel } from '@/components/agent/AgentPanel'
import { useAppStore } from '@/store/useAppStore'

function TickerDetailContent({ symbol }: { symbol: string }) {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-mono">{symbol.toUpperCase()}</h1>
            <Badge variant="outline">Detail View</Badge>
          </div>
        </div>
      </header>

      {/* Content Layout */}
      <ResizablePanelGroup direction="horizontal" className="min-h-[calc(100vh-4rem)]">
        {/* Left - Chart */}
        <ResizablePanel defaultSize={50} minSize={40}>
          <div className="h-full p-4">
            <StockChart symbol={symbol.toUpperCase()} className="h-full" />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Middle - Details & Metrics */}
        <ResizablePanel defaultSize={30} minSize={25}>
          <div className="h-full p-4 space-y-4 overflow-y-auto">
            <StockDetails />
            
            {/* Key Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Key Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Beta:</span>
                      <span className="font-medium">1.23</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">RSI:</span>
                      <span className="font-medium">67.5</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">EPS (TTM):</span>
                      <span className="font-medium">$6.16</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Revenue:</span>
                      <span className="font-medium">$394.3B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Margin:</span>
                      <span className="font-medium">25.31%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Dividend:</span>
                      <span className="font-medium">0.96%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Earnings */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">Q4 2023</div>
                      <div className="text-sm text-muted-foreground">Dec 31, 2023</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$2.18</div>
                      <div className="text-sm text-green-600">+2.1%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <div>
                      <div className="font-medium">Q3 2023</div>
                      <div className="text-sm text-muted-foreground">Sep 30, 2023</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$1.46</div>
                      <div className="text-sm text-red-600">-1.4%</div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <div>
                      <div className="font-medium">Q2 2023</div>
                      <div className="text-sm text-muted-foreground">Jun 30, 2023</div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">$1.26</div>
                      <div className="text-sm text-green-600">+1.4%</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <HeadlineList />
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        {/* Right - AI Assistant */}
        <ResizablePanel defaultSize={20} minSize={20} maxSize={30}>
          <div className="h-full p-4">
            <AgentPanel />
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export default function TickerDetailPage() {
  const params = useParams()
  const symbol = params.symbol as string
  const { setSelectedSymbol } = useAppStore()

  useEffect(() => {
    if (symbol) {
      setSelectedSymbol(symbol.toUpperCase())
    }
  }, [symbol, setSelectedSymbol])

  return <TickerDetailContent symbol={symbol} />
}
