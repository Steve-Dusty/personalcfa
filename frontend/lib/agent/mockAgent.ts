// AI agent using FastAPI backend with Swarms AdvancedResearch

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000'

export async function sendMessage(message: string, watchlistTickers: string[]): Promise<string> {
  try {
    console.log('🔗 Testing connection to backend:', BACKEND_URL)
    
    // Test basic connection first
    const healthResponse = await fetch(`${BACKEND_URL}/`, {
      method: 'GET'
    })
    
    if (!healthResponse.ok) {
      throw new Error(`Backend not responding. Status: ${healthResponse.status}`)
    }
    
    console.log('✅ Backend connection successful')
    console.log('📤 Sending message to backend:', message)
    
    // Prepare context with watchlist information
    const context = {
      watchlist: watchlistTickers.map(symbol => ({ symbol })),
      selectedSymbol: '',
      timestamp: new Date().toISOString()
    }
    
    // Make request to FastAPI backend
    const response = await fetch(`${BACKEND_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        context: context
      })
    })
    
    console.log('📥 Response status:', response.status, response.statusText)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }))
      throw new Error(`Backend error: ${response.status} - ${errorData.detail}`)
    }
    
    const data = await response.json()
    console.log('📄 Received response from backend:', data)
    
    return data.content || data.response || 'Sorry, I received an empty response from the research system.'
    
  } catch (error) {
    console.error('❌ Backend communication error:', error)
    
    if (error instanceof Error && error.message.includes('fetch')) {
      return `❌ **Backend Connection Failed**\n\nI can't connect to the research system at ${BACKEND_URL}.\n\n**To fix this:**\n1. Open a terminal\n2. Run: \`cd backend && python main.py\`\n3. Make sure you see "🚀 Starting Personal CFA Backend"\n4. Try your message again`
    }
    
    return `❌ **Error**: ${error instanceof Error ? error.message : 'Unknown error'}\n\nPlease check the backend connection and try again.`
  }
}

// Streaming version for real-time responses
export async function sendMessageStream(
  message: string, 
  watchlistTickers: string[],
  onToken: (token: string) => void,
  onComplete: (fullResponse: string) => void,
  onError: (error: string) => void
): Promise<void> {
  try {
    console.log('Starting streaming message to backend:', message)
    
    // Prepare context
    const context = {
      watchlist: watchlistTickers.map(symbol => ({ symbol })),
      selectedSymbol: '',
      timestamp: new Date().toISOString()
    }
    
    // Make streaming request
    const response = await fetch(`${BACKEND_URL}/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        context: context
      })
    })
    
    if (!response.ok) {
      throw new Error(`Backend error: ${response.status}`)
    }
    
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    let fullResponse = ''
    
    if (!reader) {
      throw new Error('No response body reader available')
    }
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      
      const chunk = decoder.decode(value)
      const lines = chunk.split('\n')
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6))
            console.log('Received SSE data:', data)
            
            if (data.type === 'token') {
              // Handle both regular content and questions
              if (data.need_info) {
                console.log('Questions detected:', data)
                onToken(data.content)
              } else {
                onToken(data.content)
              }
              fullResponse = data.content
            } else if (data.type === 'done') {
              // Handle completion - check if it's questions or regular response
              if (data.need_info && data.questions) {
                console.log('Questions completed:', data.questions)
                // For questions, show the formatted message with questions
                const questionText = data.content || `${data.message || 'I need some information:'}\n\n${data.questions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n')}`
                onComplete(questionText)
              } else {
                onComplete(data.content)
              }
              return
            } else if (data.type === 'error') {
              onError(data.content)
              return
            } else if (data.type === 'status') {
              // Handle status updates (optional)
              onToken(data.content)
            }
          } catch (parseError) {
            console.warn('Failed to parse SSE data:', line)
          }
        }
      }
    }
    
    // If we reach here without a 'done' signal, complete with what we have
    onComplete(fullResponse)
    
  } catch (error) {
    console.error('Streaming error:', error)
    onError(error instanceof Error ? error.message : 'Unknown streaming error')
  }
}

// Legacy interface for backward compatibility
export interface AgentResponse {
  content: string
  delay?: number
}

export function generateResponse(message: string, watchlistTickers: string[] = []): AgentResponse {
  // This is now just a fallback - the real logic is in sendMessage
  return {
    content: "Please use sendMessage() for AI responses. This function is deprecated.",
    delay: 0
  }
}