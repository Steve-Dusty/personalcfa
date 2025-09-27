'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, Bot, User, Loader2, MessageSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { formatTimeAgo } from '@/lib/format'
import { sendMessage } from '@/lib/agent/mockAgent'
import { useAppStore } from '@/store/useAppStore'
import type { ChatMessage } from '@/types/polygon'

interface AgentPanelProps {
  className?: string
}

function ChatMessageComponent({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === 'assistant'
  
  return (
    <div className={`flex gap-3 ${isAssistant ? 'flex-row' : 'flex-row-reverse'}`}>
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className={isAssistant ? 'bg-primary text-primary-foreground' : 'bg-muted'}>
          {isAssistant ? <Bot className="h-4 w-4" /> : <User className="h-4 w-4" />}
        </AvatarFallback>
      </Avatar>
      <div className={`flex-1 space-y-2 ${isAssistant ? '' : 'text-right'}`}>
        <div className="flex items-center gap-2">
          <Badge variant={isAssistant ? 'default' : 'secondary'} className="text-xs">
            {isAssistant ? 'AI Assistant' : 'You'}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTimeAgo(message.timestamp)}
          </span>
        </div>
        <div className={`rounded-lg px-3 py-2 text-sm max-w-[85%] ${
          isAssistant 
            ? 'bg-muted text-foreground' 
            : 'bg-primary text-primary-foreground ml-auto'
        }`}>
          <div className="whitespace-pre-wrap break-words overflow-wrap-anywhere max-h-[200px] overflow-y-auto">
            {message.content}
          </div>
        </div>
      </div>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <Avatar className="h-8 w-8 flex-shrink-0">
        <AvatarFallback className="bg-primary text-primary-foreground">
          <Bot className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="default" className="text-xs">AI Assistant</Badge>
        </div>
        <div className="rounded-lg px-3 py-2 bg-muted max-w-[85%]">
          <div className="flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span className="text-sm text-muted-foreground">Thinking...</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function AgentPanel({ className }: AgentPanelProps) {
  const { chatMessages, addChatMessage, watchlist } = useAppStore()
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight
      }
    }
  }, [chatMessages, isTyping])

  const handleSend = async () => {
    if (!input.trim() || isTyping) return

    const userMessage = input.trim()
    setInput('')
    
    // Add user message
    addChatMessage({
      role: 'user',
      content: userMessage
    })

    // Show typing indicator
    setIsTyping(true)

    try {
      // Get response from mock agent
      const watchlistTickers = watchlist.map(item => item.symbol)
      const response = await sendMessage(userMessage, watchlistTickers)
      
      // Add assistant response
      addChatMessage({
        role: 'assistant',
        content: response
      })
    } catch (error) {
      addChatMessage({
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.'
      })
    } finally {
      setIsTyping(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px'
  }

  return (
    <Card className={`${className} flex flex-col h-full overflow-hidden`}>
      <CardHeader className="pb-3 flex-shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          AI Assistant
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Ask me about stock analysis, trends, or market insights
        </p>
      </CardHeader>
      <CardContent className="p-0 flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Chat Messages */}
        <ScrollArea 
          ref={scrollAreaRef} 
          className="flex-1 px-4 min-h-0 overflow-y-auto"
          type="always"
        >
          <div className="space-y-4 pb-4">
            {chatMessages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-[200px] text-center">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Start a conversation about your stocks
                </p>
              </div>
            )}
            {chatMessages.map((message) => (
              <ChatMessageComponent key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </div>
        </ScrollArea>

        {/* Message Input */}
        <div className="border-t p-4 space-y-3 flex-shrink-0">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              placeholder="Ask about stocks, trends, or analysis..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 min-h-[40px] max-h-[120px] resize-none"
              disabled={isTyping}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              size="sm"
              className="h-10 w-10 p-0 flex-shrink-0"
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground">
            Press <kbd className="px-1 py-0.5 rounded bg-muted">Enter</kbd> to send, <kbd className="px-1 py-0.5 rounded bg-muted">Shift+Enter</kbd> for new line
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
