// Mock AI agent responder

export interface AgentResponse {
  content: string
  delay?: number
}

const responses = {
  greetings: [
    "Hello! I'm here to help you analyze stocks. What would you like to know?",
    "Hi there! Ready to dive into some stock analysis?",
    "Welcome! Ask me about any ticker in your watchlist or search for a new one."
  ],
  
  tickerAnalysis: {
    AAPL: "Apple (AAPL) is showing strong momentum with solid fundamentals. The stock has been trending upward with good volume. Key support around $190, resistance near $200. Consider the upcoming earnings call.",
    MSFT: "Microsoft (MSFT) demonstrates consistent growth with strong cloud revenue. The stock shows low volatility and steady upward trend. Good for long-term holdings with solid dividend yield.",
    NVDA: "NVIDIA (NVDA) is highly volatile but has strong AI/datacenter tailwinds. Watch for semiconductor cycle trends. High beta stock - great for growth but manage risk carefully.",
    TSLA: "Tesla (TSLA) remains volatile with high sentiment sensitivity. EV market competition increasing. Watch production numbers and Elon's tweets for sentiment shifts.",
    AMZN: "Amazon (AMZN) shows steady growth across multiple segments. AWS remains a key driver. E-commerce margins improving. Good diversification across cloud and retail."
  },
  
  generalAdvice: [
    "I'd recommend looking at the volume trends and recent news for better context.",
    "Consider checking the 6-month chart to see the broader trend before making decisions.",
    "Don't forget to check the recent earnings and analyst upgrades/downgrades.",
    "Volume analysis can give you insights into institutional interest.",
    "Always consider your risk tolerance and position sizing."
  ],
  
  timeRangeAnalysis: {
    "1D": "Looking at the daily chart, I can see intraday volatility patterns. Watch for support/resistance levels.",
    "5D": "The 5-day view shows short-term momentum. Good for swing trading analysis.",
    "1M": "Monthly view reveals the current trend direction. Look for pattern formations.",
    "6M": "6-month timeframe shows intermediate trends. Good for position trading decisions.",
    "YTD": "Year-to-date performance gives context vs broader market. Check sector rotation patterns.",
    "1Y": "Annual view shows major trend cycles. Consider seasonal patterns and earnings cycles.",
    "5Y": "Long-term view reveals major growth trends and market cycles. Good for investment thesis validation."
  }
}

export function generateResponse(message: string, watchlistTickers: string[] = []): AgentResponse {
  const lowerMessage = message.toLowerCase()
  
  // Check for greetings
  if (/(hi|hello|hey|good morning|good afternoon)/i.test(message)) {
    return {
      content: responses.greetings[Math.floor(Math.random() * responses.greetings.length)],
      delay: 500
    }
  }
  
  // Check for specific ticker mentions
  for (const ticker of Object.keys(responses.tickerAnalysis)) {
    if (lowerMessage.includes(ticker.toLowerCase())) {
      return {
        content: responses.tickerAnalysis[ticker as keyof typeof responses.tickerAnalysis],
        delay: 1000
      }
    }
  }
  
  // Check for watchlist ticker mentions
  for (const ticker of watchlistTickers) {
    if (lowerMessage.includes(ticker.toLowerCase())) {
      return {
        content: `Based on your watchlist, ${ticker} is one of your tracked stocks. ${responses.generalAdvice[Math.floor(Math.random() * responses.generalAdvice.length)]}`,
        delay: 800
      }
    }
  }
  
  // Check for time range questions
  for (const [range, analysis] of Object.entries(responses.timeRangeAnalysis)) {
    if (lowerMessage.includes(range.toLowerCase()) || lowerMessage.includes(range.replace(/[^a-zA-Z]/g, '').toLowerCase())) {
      return {
        content: analysis,
        delay: 600
      }
    }
  }
  
  // Check for analysis keywords
  if (/(analysis|analyze|trend|volatile|volatility|risk)/i.test(message)) {
    return {
      content: `For proper analysis, I'd need to see the specific ticker chart. ${responses.generalAdvice[Math.floor(Math.random() * responses.generalAdvice.length)]}`,
      delay: 700
    }
  }
  
  // Check for chart/technical questions
  if (/(chart|technical|support|resistance|pattern|breakout)/i.test(message)) {
    return {
      content: "Technical analysis requires looking at price action, volume, and support/resistance levels. Which specific ticker are you analyzing?",
      delay: 600
    }
  }
  
  // Check for news/fundamentals
  if (/(news|earnings|fundamental|revenue|profit)/i.test(message)) {
    return {
      content: "Fundamental analysis involves checking recent earnings, news catalysts, and financial metrics. Check the headlines section for the latest updates on your stocks.",
      delay: 800
    }
  }
  
  // Default responses for unmatched queries
  const defaultResponses = [
    "I can help analyze stocks in your watchlist. Try asking about specific tickers like 'How's AAPL looking?' or 'What do you think about NVDA's trend?'",
    "Search for a ticker first, then ask me about trends, volatility, or technical analysis. I'm here to help!",
    "I can provide insights on price movements, volume trends, and general market analysis. What stock are you interested in?",
    "Try asking about specific time ranges like '1M chart analysis' or mention a ticker symbol for targeted insights."
  ]
  
  return {
    content: defaultResponses[Math.floor(Math.random() * defaultResponses.length)],
    delay: 400
  }
}

export async function sendMessage(message: string, watchlistTickers: string[] = []): Promise<string> {
  const response = generateResponse(message, watchlistTickers)
  
  // Simulate typing delay
  if (response.delay) {
    await new Promise(resolve => setTimeout(resolve, response.delay))
  }
  
  return response.content
}
