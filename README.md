# AI Travel Planner - Frontend

This is a [Next.js](https://nextjs.org/) project for the AI Travel Planner application, featuring AI-powered chat, real-time map integration, and comprehensive travel planning capabilities.

## 📚 Documentation

For complete documentation, please see:
- **[COMPREHENSIVE_DOCUMENTATION.md](./COMPREHENSIVE_DOCUMENTATION.md)** - Complete project documentation
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Architecture details
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment guide
- **[COMPREHENSIVE_ONBOARDING_GUIDE.md](./COMPREHENSIVE_ONBOARDING_GUIDE.md)** - Developer onboarding

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and pnpm
- API keys (OpenAI, Google Maps, etc.)

### Installation

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# Validate environment
pnpm run check-env

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment Variables

Required environment variables in `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_google_maps_key
```

## 🧪 Testing

### Unit Tests (Jest)
```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run map-specific tests with coverage
pnpm run test:map:coverage
```

### E2E Tests (Playwright)
```bash
# Run all E2E tests
pnpm test:e2e

# Run with UI mode
pnpm test:e2e:ui

# Run with debug mode
pnpm test:e2e:debug

# View test report
pnpm test:e2e:report
```

### Performance Tests (NEW)
```bash
# Run map performance benchmarks
pnpm test:performance

# Run with UI mode
pnpm test:performance:ui
```

### Advanced WebSocket Tests (NEW)
```bash
# Run network resilience tests
pnpm test:websocket:advanced

# Run with UI mode
pnpm test:websocket:advanced:ui
```

### Load Tests (NEW - Requires k6)
```bash
# Install k6 first:
# Windows: choco install k6
# macOS: brew install k6

# Run chat API load test (1,000 users)
pnpm test:load:chat

# Run WebSocket load test (1,000 connections)
pnpm test:load:websocket

# Quick smoke test (10 users, 30 seconds)
pnpm test:load:smoke
```

### Run All Tests
```bash
# Run unit + E2E + performance tests
pnpm test:all
```

**📖 Detailed Testing Documentation:**
- **Load Testing:** [tests/load/README.md](./tests/load/README.md)
- **Testing Gaps Analysis:** [TESTING_GAPS_ANALYSIS.md](./TESTING_GAPS_ANALYSIS.md)

## 🏗️ Tech Stack

- **Framework:** Next.js 15 with App Router
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS + shadcn/ui
- **Maps:** Google Maps JavaScript API
- **WebSocket:** STOMP over SockJS
- **Testing:** Jest + React Testing Library + Playwright

## 📖 Learn More

To learn more about Next.js, check out:
- [Next.js Documentation](https://nextjs.org/docs)
- [Learn Next.js](https://nextjs.org/learn)

## 🚢 Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

Check out the [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## 📄 License

Proprietary - FlomadLabsRD
