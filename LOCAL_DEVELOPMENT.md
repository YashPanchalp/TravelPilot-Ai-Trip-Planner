# Local Development Setup Guide

This guide explains how to run the AI Trip Planner with a local backend server for development.

## Prerequisites

- Node.js v18+ installed
- All dependencies installed (`npm install`)
- `VITE_FLIGHTS_API_SERA` configured in `.env.local`

## 📁 Project Structure

```
ai-tip-planner/
├── server.js              # Local Express backend (port 3001)
├── src/                   # React frontend
├── .env.local            # Environment variables
├── vite.config.js        # Vite config with proxy setup
└── package.json          # Scripts and dependencies
```

## 🚀 Running Local Development

### Option 1: Run Both Frontend & Backend Together (Recommended)

```bash
npm run dev:full
```

This command uses `concurrently` to run:
- **Backend**: Express server on `http://localhost:3001`
- **Frontend**: Vite dev server on `http://localhost:5173`

✅ Everything runs in one terminal!

### Option 2: Run Backend & Frontend Separately

**Terminal 1 - Start Backend:**
```bash
npm run server
```

You'll see:
```
✅ Backend server running on http://localhost:3001
📝 Flights endpoint: POST http://localhost:3001/api/flights
🏥 Health check: GET http://localhost:3001/health
```

**Terminal 2 - Start Frontend:**
```bash
npm run dev
```

## 🔧 How It Works

### Request Flow:
```
React App (localhost:5173)
    ↓
Vite Proxy (/api → localhost:3001)
    ↓
Express Backend (localhost:3001)
    ↓
SerpAPI (https://serpapi.com)
```

### Proxy Configuration:
- Vite automatically proxies `/api/*` requests to `http://localhost:3001`
- Configured in `vite.config.js`
- No CORS issues!

## 📝 Environment Variables

Create/Update `.env.local`:

```env
VITE_GOOGLE_PLACES_API_KEY=your_google_places_key
VITE_GOOGLE_GENAI_API_KEY=your_genai_key
VITE_GOOGLE_AUTH_CLIENT_ID=your_google_auth_client_id
VITE_FLIGHTS_API_SERA=your_serpapi_key

# Optional: Control backend port (default: 3001)
BACKEND_PORT=3001
```

## 🧪 Testing the Backend

### Health Check:
```bash
curl http://localhost:3001/health
```

### Test Flight Search:
```bash
curl -X POST http://localhost:3001/api/flights \
  -H "Content-Type: application/json" \
  -d '{
    "departure": "Mumbai, Maharashtra, India",
    "arrival": "Paris, France",
    "outbound_date": "2026-04-20",
    "return_date": "2026-04-27",
    "currency": "USD",
    "adults": 1
  }'
```

## 🐛 Troubleshooting

### "Cannot find module" errors
- Run `npm install` to install all dependencies
- Ensure Node v18+ is installed

### Backend on port 3001 not responding
- Check if port 3001 is in use: `netstat -ano | findstr :3001` (Windows)
- Change `BACKEND_PORT` in `.env.local` if needed
- Restart the backend: `npm run server`

### CORS errors in browser
- Ensure Vite proxy is configured (check `vite.config.js`)
- Backend should be running on port 3001
- Frontend should be on port 5173

### Flights API returns empty results
- Verify `VITE_FLIGHTS_API_SERA` is correct in `.env.local`
- Check SerpAPI account has quota remaining
- Test with: `curl http://localhost:3001/health`

## 📦 Production Deployment

### For Vercel:
1. The `api/flights.js` Vercel Function handles production requests
2. Environment variables are stored in Vercel dashboard
3. API endpoint: `https://your-vercel-url.vercel.app/api/flights`

### For Other Hosting:
- Deploy `server.js` as a backend service
- Update frontend to call your production API URL
- Set `VITE_FLIGHTS_API_SERA` in production environment

## 📚 Key Files

| File | Purpose |
|------|---------|
| `server.js` | Local Express backend server |
| `api/flights.js` | Vercel production API function |
| `src/service/FlightsAPI.jsx` | Frontend API client |
| `src/components/custom/Flights.jsx` | Flight UI component |
| `vite.config.js` | Vite dev proxy config |

## 🎯 Next Steps

1. ✅ Run `npm install` to install dependencies
2. ✅ Create `.env.local` with API keys
3. ✅ Run `npm run dev:full` to start development
4. ✅ Visit `http://localhost:5173` in your browser
5. ✅ Create a trip and test flight booking!

---

Happy coding! 🎉
