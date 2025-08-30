# Deployment Guide

This guide covers how to deploy the LinkedIn Sourcing Agent with real-time processing and caching features.

## 🚀 Quick Start

### Local Development

1. **Clone the repository**:
   ```bash
   git clone https://github.com/guptashrey458/LinkedIn-Sourcing-Agent.git
   cd LinkedIn-Sourcing-Agent
   git checkout feature/realtime-processing-and-caching
   ```

2. **Backend Setup**:
   ```bash
   cd LinkedIn-Sourcing-Agent
   pip install -r requirements.txt
   
   # Create .env file
   cp .env.example .env
   # Add your API keys to .env
   
   # Start the server
   python start_server.py
   ```

3. **Frontend Setup**:
   ```bash
   # In the root directory
   npm install
   
   # Create environment file
   cp .env.example .env.local
   # Update API URLs if needed
   
   # Start development server
   npm run dev
   ```

4. **Access the application**:
   - Frontend: http://localhost:3000 (or the port shown in terminal)
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🌐 Production Deployment

### Backend Deployment Options

#### Option 1: Railway (Recommended)
1. Fork the repository to your GitHub account
2. Connect Railway to your GitHub account
3. Create a new project from the `LinkedIn-Sourcing-Agent` folder
4. Set environment variables:
   ```
   OPENAI_API_KEY=your_openai_api_key
   CORESIGNAL_API_KEY=your_coresignal_api_key
   PORT=8000
   HOST=0.0.0.0
   ```
5. Deploy automatically

#### Option 2: Render
1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python start_server.py`
5. Add environment variables
6. Deploy

#### Option 3: Heroku
1. Create a new Heroku app
2. Add Python buildpack
3. Set environment variables
4. Create `Procfile`:
   ```
   web: python LinkedIn-Sourcing-Agent/start_server.py
   ```
5. Deploy via Git

### Frontend Deployment Options

#### Option 1: Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `dist`
4. Add environment variables:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com
   VITE_WS_URL=wss://your-backend-url.com/ws
   ```
5. Deploy automatically

#### Option 2: Netlify
1. Connect your GitHub repository
2. Set build command: `npm run build`
3. Set publish directory: `dist`
4. Add environment variables
5. Deploy

## 🔧 Environment Variables

### Backend (.env)
```env
# Required
OPENAI_API_KEY=sk-your-openai-api-key
CORESIGNAL_API_KEY=your-coresignal-api-key

# Optional
HOST=0.0.0.0
PORT=8000
LOG_LEVEL=info
ENVIRONMENT=production
CORESIGNAL_USE_MOCK=false

# CORS Origins (for production)
CORS_ORIGINS=["https://your-frontend-domain.com"]
```

### Frontend (.env.local)
```env
# API Configuration
VITE_API_BASE_URL=https://your-backend-url.com
VITE_WS_URL=wss://your-backend-url.com/ws
VITE_ENVIRONMENT=production

# Optional Features
VITE_ENABLE_REAL_TIME=true
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG=false

# Optional: Analytics
VITE_GOOGLE_ANALYTICS_ID=your_ga_id
VITE_SENTRY_DSN=your_sentry_dsn
```

## 🔍 Health Checks

### Backend Health Check
```bash
curl https://your-backend-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "version": "2.0.0",
  "timestamp": "2025-08-30T17:00:00.000000"
}
```

### Cache Status Check
```bash
curl https://your-backend-url.com/cache/status
```

### WebSocket Test
```javascript
const ws = new WebSocket('wss://your-backend-url.com/ws/test-pipeline');
ws.onopen = () => console.log('WebSocket connected');
ws.onmessage = (event) => console.log('Message:', JSON.parse(event.data));
```

## 📊 Monitoring

### Performance Metrics
- Monitor cache hit rates via `/cache/status`
- Track API response times
- Monitor WebSocket connection counts
- Watch OpenAI API usage and costs

### Logging
- Backend logs are available in the application logs
- Frontend errors can be tracked with Sentry
- WebSocket connection logs for debugging

### Alerts
Set up alerts for:
- High API error rates
- Low cache hit rates
- WebSocket connection failures
- High OpenAI API costs

## 🐛 Troubleshooting

### Common Issues

#### CORS Errors
- Update `CORS_ORIGINS` in backend environment
- Ensure frontend URL is included in allowed origins

#### WebSocket Connection Failures
- Check if WebSocket URL uses `wss://` for HTTPS sites
- Verify firewall settings allow WebSocket connections
- Check proxy configurations

#### Cache Not Working
- Verify cache directory permissions
- Check disk space for file-based cache
- Monitor cache status endpoint

#### High API Costs
- Check cache hit rates
- Verify cache duration settings
- Monitor for duplicate requests

### Debug Mode
Enable debug mode for troubleshooting:

Backend:
```env
LOG_LEVEL=debug
```

Frontend:
```env
VITE_ENABLE_DEBUG=true
```

## 🔒 Security Considerations

### API Keys
- Never commit API keys to version control
- Use environment variables for all secrets
- Rotate API keys regularly
- Monitor API key usage

### CORS Configuration
- Restrict CORS origins to your domains only
- Don't use wildcard (*) in production
- Regularly review allowed origins

### WebSocket Security
- Use WSS (WebSocket Secure) in production
- Implement connection rate limiting if needed
- Monitor for unusual connection patterns

## 📈 Scaling

### Backend Scaling
- Use horizontal scaling for multiple instances
- Implement Redis for shared caching across instances
- Consider load balancing for high traffic

### Frontend Scaling
- Use CDN for static assets
- Implement service worker for offline functionality
- Consider server-side rendering for SEO

### Database Considerations
- If adding persistent storage, use PostgreSQL or MongoDB
- Implement proper indexing for performance
- Consider read replicas for scaling

## 🔄 Updates and Maintenance

### Updating the Application
1. Pull latest changes from the repository
2. Update dependencies: `npm install` and `pip install -r requirements.txt`
3. Run tests: `npm test`
4. Deploy to staging first
5. Deploy to production after testing

### Cache Maintenance
- Monitor cache size and performance
- Clear cache periodically if needed
- Update cache duration based on usage patterns

### Monitoring and Alerts
- Set up uptime monitoring
- Monitor API response times
- Track error rates and user feedback
- Monitor costs and usage patterns

---

For more detailed information, see the [README.md](README.md) file.