# Personal CFA - Stock Analysis Dashboard

A modern, responsive stock analysis dashboard built for hackathons and rapid prototyping. Features real-time stock data, interactive charts, AI-powered analysis, and a clean three-pane layout.

![Personal CFA Dashboard](https://via.placeholder.com/800x400/0f172a/ffffff?text=Personal+CFA+Dashboard)

## 🚀 Features

### Core Functionality
- **Real-time Stock Data** - Powered by Polygon API with comprehensive mock mode
- **Interactive Charts** - Professional candlestick charts with TradingView Lightweight Charts
- **Smart Watchlist** - Persistent watchlist with sparklines and real-time updates
- **AI Assistant** - ChatGPT-style interface with intelligent stock analysis
- **News Integration** - Latest headlines and market news for tracked stocks

### User Experience
- **Three-pane Layout** - Optimized for desktop with resizable panels
- **Mobile Responsive** - Adaptive design for tablets and mobile devices
- **Dark Mode Support** - System theme detection with manual toggle
- **Quick Search** - Debounced ticker search with autocomplete (⌘K shortcut)
- **Keyboard Navigation** - Full keyboard accessibility

### Technical Highlights
- **Next.js 15** with App Router and React 19
- **TypeScript** - Type-safe development with minimal overhead
- **Tailwind CSS + shadcn/ui** - Modern styling with consistent design system
- **Zustand** - Lightweight state management with persistence
- **TanStack Query** - Smart data caching and synchronization

## 🛠️ Tech Stack

### Frontend Framework
- **Next.js 15** - React framework with App Router
- **React 19** - Latest React with concurrent features
- **TypeScript** - Type-safe development

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality React components
- **Lucide React** - Beautiful SVG icons
- **Radix UI** - Accessible primitives

### Charts & Visualization
- **TradingView Lightweight Charts** - Professional financial charts
- **Custom Sparklines** - SVG-based mini charts

### State & Data
- **Zustand** - Global state management
- **TanStack Query** - Server state caching
- **LocalStorage** - Persistent user preferences

### API Integration
- **Polygon API** - Real stock market data
- **Mock Data Layer** - Complete offline development mode

## 📦 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- (Optional) Polygon API key for real data

### Setup Steps

1. **Clone and Install**
   ```bash
   cd frontend
   npm install
   ```

2. **Environment Configuration**
   ```bash
   # Copy environment template
   cp env-example.txt .env.local
   
   # Edit .env.local
   POLYGON_API_KEY=your_key_here # REQUIRED: Your Polygon API key
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Polygon API Integration

The app uses **only real Polygon API data** - no mock data:

```env
POLYGON_API_KEY=your_polygon_api_key
```
- Connects to live Polygon API for all data
- Real-time market data and search
- Requires valid Polygon API subscription
- Watchlist stored in local JSON file

### Customization

#### Adding New Mock Stocks
1. Add search data: `mock-data/polygon/search/[ticker].json`
2. Add quote data: `mock-data/polygon/quotes/[ticker].json`
3. Add chart data: `mock-data/polygon/aggregates/[ticker]_1d.json`
4. Add news data: `mock-data/polygon/news/[ticker].json`

#### Modifying UI Components
- Components are in `components/` organized by feature
- Use shadcn/ui CLI to add new components: `npx shadcn add [component]`
- Tailwind classes are used throughout for styling

## 🎯 Usage

### Basic Workflow
1. **Search Stocks** - Use the search bar or ⌘K shortcut
2. **Build Watchlist** - Add stocks to track in the left sidebar
3. **Analyze Charts** - View price action with different time ranges
4. **Read News** - Stay updated with latest headlines
5. **Ask AI** - Chat with the AI assistant for insights

### Keyboard Shortcuts
- `⌘K` (Mac) or `Ctrl+K` (PC) - Quick ticker search
- `Enter` - Send message in AI chat
- `Shift+Enter` - New line in AI chat

### Mobile Usage
- Responsive design adapts to smaller screens
- Touch-friendly interactions
- Sheet-based navigation for secondary panels

## 🏗️ Architecture

### Project Structure
```
frontend/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   └── ticker/[symbol]/   # Ticker detail pages
├── components/            # React components
│   ├── agent/            # AI chat interface
│   ├── chart/            # Price charts
│   ├── news/             # News headlines
│   ├── search/           # Ticker search
│   ├── shell/            # App layout
│   ├── stock/            # Stock details
│   ├── ui/               # shadcn/ui components
│   └── watchlist/        # Watchlist management
├── lib/                  # Utilities and logic
│   ├── agent/            # AI mock responder
│   ├── api/              # Data layer (mock + real)
│   ├── format.ts         # Number/date formatting
│   ├── sparkline.ts      # Mini chart generation
│   └── utils.ts          # shadcn/ui utilities
├── mock-data/            # Mock API responses
├── store/                # Zustand state management
└── types/                # TypeScript definitions
```

### Data Flow
1. **User Interaction** → Component
2. **Component** → Zustand Store (state) + TanStack Query (server data)
3. **API Layer** → Mock Data OR Polygon API
4. **Response** → Component Update

### State Management
- **Local State** - React useState for component-specific data
- **Global State** - Zustand for app-wide state (watchlist, selected stock, preferences)
- **Server State** - TanStack Query for API data with caching

## 🚢 Deployment

### Build for Production
```bash
npm run build
npm start
```

### Environment Variables
```env
# Production settings
USE_MOCK=0                    # Use real API in production
POLYGON_API_KEY=your_key_here # Your Polygon API key
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Platform Deployment
The app is ready to deploy on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **Heroku**
- Any Node.js hosting platform

## 🔍 API Reference

### Polygon API Endpoints Used
- `GET /v3/reference/tickers` - Ticker search
- `GET /v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{from}/{to}` - Historical data
- `GET /v2/snapshot/locale/us/markets/stocks/tickers/{ticker}` - Current quote
- `GET /v2/reference/news` - News headlines

### Mock Data Structure
Mock data follows the exact Polygon API response format for seamless switching:

```typescript
// Search Response
{
  "results": [{"ticker": "AAPL", "name": "Apple Inc.", ...}],
  "status": "OK"
}

// Quote Response  
{
  "results": [{
    "ticker": "AAPL",
    "day": {"c": 195.89, "h": 196.95, ...},
    "todaysChange": 2.5,
    "todaysChangePerc": 1.45
  }]
}
```

## 🤝 Contributing

### Development Setup
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Code Style
- Use TypeScript for all new code
- Follow the existing component patterns
- Use Tailwind CSS for styling
- Add proper error handling
- Include loading states

### Testing
```bash
npm run build    # Test production build
npm run lint     # Check code style
npm run type-check # Verify TypeScript
```

## 📄 License

MIT License - feel free to use this project for your hackathons, learning, or commercial projects.

## 🙏 Acknowledgments

- **Polygon API** for financial data
- **TradingView** for lightweight charts
- **shadcn/ui** for beautiful components
- **Vercel** for Next.js and hosting platform

---

Built with ❤️ for the developer community. Happy coding! 🚀