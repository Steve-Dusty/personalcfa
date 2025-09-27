'use client'

import { useEffect, useState } from 'react'
import { ExternalLink, Newspaper, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { formatTimeAgo } from '@/lib/format'
import type { NewsItem } from '@/types/polygon'
import { useAppStore } from '@/store/useAppStore'

interface HeadlineListProps {
  className?: string
}

function NewsItemComponent({ item }: { item: NewsItem }) {
  const handleClick = () => {
    window.open(item.article_url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      className="group p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
      onClick={handleClick}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
            <Newspaper className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {item.title}
          </h4>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span className="font-medium">{item.publisher.name}</span>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{formatTimeAgo(item.published_utc)}</span>
            </div>
          </div>
          {item.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {item.description}
            </p>
          )}
        </div>
        <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-start gap-3 p-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export function HeadlineList({ className }: HeadlineListProps) {
  const { selectedSymbol } = useAppStore()
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedSymbol) return

    const fetchNews = async () => {
      setLoading(true)
      setError(null)
      
      try {
        const response = await api.getNews(selectedSymbol, 10)
        setNews(response.results || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch news')
        setNews([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [selectedSymbol])

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Newspaper className="h-5 w-5" />
          Recent Headlines
        </CardTitle>
        {selectedSymbol && (
          <p className="text-sm text-muted-foreground">
            Latest news for {selectedSymbol}
          </p>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {loading ? (
            <div className="px-3 pb-3">
              <LoadingSkeleton />
            </div>
          ) : error ? (
            <div className="px-3 pb-3">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-destructive/10 p-3 mb-4">
                  <Newspaper className="h-6 w-6 text-destructive" />
                </div>
                <h3 className="font-medium mb-2">Failed to load news</h3>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
            </div>
          ) : news.length === 0 ? (
            <div className="px-3 pb-3">
              <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="rounded-full bg-muted p-3 mb-4">
                  <Newspaper className="h-6 w-6 text-muted-foreground" />
                </div>
                <h3 className="font-medium mb-2">No news available</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedSymbol ? `No recent news found for ${selectedSymbol}` : 'Select a stock to view news'}
                </p>
              </div>
            </div>
          ) : (
            <div className="px-3 pb-3 space-y-1">
              {news.map((item, index) => (
                <NewsItemComponent key={item.id || index} item={item} />
              ))}
            </div>
          )}
        </ScrollArea>
        {news.length > 0 && !loading && !error && (
          <div className="px-3 pb-3 pt-2 border-t">
            <Button variant="ghost" size="sm" className="w-full text-xs">
              View More News
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
