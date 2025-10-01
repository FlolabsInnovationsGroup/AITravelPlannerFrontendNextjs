# Deployment Guide - Production Environment Setup

## 🌍 Environment Configuration Strategy

This project uses a multi-environment configuration strategy to support both local development and production deployment:

### Environment Files

| File | Purpose | Git Tracked | Used When |
|------|---------|-------------|-----------|
| `.env.local` | Local development only | ❌ No | Always (highest priority) |
| `.env.development` | Development defaults | ✅ Yes | NODE_ENV=development |
| `.env.production` | Production defaults | ✅ Yes | NODE_ENV=production |
| `vercel.json` | Vercel deployment config | ✅ Yes | Vercel deployments |

### Environment Variable Priority (Next.js)
1. `.env.local` (highest priority, local development only)
2. `.env.production` or `.env.development` (based on NODE_ENV)
3. `.env` (fallback)

## 🚀 Deployment Process

### For Vercel Deployment

1. **Commit your changes:**
   ```bash
   git add .
   git commit -m "Add production environment configuration and fixes"
   git push origin main
   ```

2. **Automatic Deployment:**
   - Vercel will automatically detect the push and deploy
   - Uses `vercel.json` configuration for environment variables
   - Uses `.env.production` for production-specific settings

3. **Manual Deployment (if needed):**
   ```bash
   # If you have Vercel CLI installed
   vercel --prod
   ```

### Environment Variables in Production

**Current Production API Configuration:**
- `NEXT_PUBLIC_API_URL`: `https://api.flomadtravel.com`
- Google Maps API Key: Configured
- OpenWeather API Key: Configured

## 🛠️ Local Development

Your local development environment remains unchanged:
- `NEXT_PUBLIC_API_URL`: `http://localhost:8080`
- All API calls go to your local Spring Boot backend
- WebSocket connections use local backend

### Running Locally
```bash
# Development mode (uses .env.local + .env.development)
pnpm dev

# Production build locally (uses .env.local + .env.production)
pnpm build && pnpm start
```

## 🔧 Key Fixes Applied

### 1. Authentication Flow
- ✅ Fixed race condition in `AuthContext.tsx`
- ✅ Added proper error handling and retry logic
- ✅ Enhanced debugging for authentication issues

### 2. API Configuration
- ✅ Axios interceptors properly configured
- ✅ Guest token creation and management
- ✅ JWT authentication flow

### 3. WebSocket Configuration
- ✅ Environment-specific WebSocket URLs
- ✅ Proper CORS configuration
- ✅ Retry mechanism for failed connections

### 4. Environment Management
- ✅ Separate configurations for dev/prod
- ✅ Git tracking of production configs
- ✅ Local development protection

## 🚨 Important Notes

1. **Never commit `.env.local`** - It contains your local development settings
2. **Production API must be running** - Ensure `https://api.flomadtravel.com` is accessible
3. **CORS Configuration** - Backend must allow requests from your Vercel domain
4. **API Keys** - Verify all API keys work in production environment

## 🔍 Troubleshooting

### If deployment fails:
1. Check Vercel build logs
2. Verify environment variables in Vercel dashboard
3. Ensure production API is responding
4. Check CORS settings on backend

### If local development breaks:
1. Verify `.env.local` has `NEXT_PUBLIC_API_URL=http://localhost:8080`
2. Ensure Spring Boot backend is running on port 8080
3. Check MongoDB is running locally

## 📋 Pre-Deployment Checklist

- [ ] All fixes tested locally
- [ ] Production backend API is running and accessible
- [ ] Environment variables are properly configured
- [ ] CORS settings allow requests from production domain
- [ ] All required API keys are valid
- [ ] `.env.local` is not committed to Git
- [ ] Changes are committed and pushed to main branch

## 🔄 Next Steps

1. Commit and push the environment configuration changes
2. Verify Vercel deployment completes successfully
3. Test the production deployment thoroughly
4. Monitor for any production-specific issues
5. Update this documentation as needed