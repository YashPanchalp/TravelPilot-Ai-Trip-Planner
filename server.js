import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

console.log('🔧 Environment Check:');
console.log(`✓ API Key configured: ${process.env.VITE_FLIGHTS_API_SERA ? 'Yes' : 'NO'}`);
console.log(`✓ .env.local path: ${path.resolve(__dirname, '.env.local')}`);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'Backend server is running',
    apiKeyConfigured: !!process.env.VITE_FLIGHTS_API_SERA,
  });
});

// Flights API endpoint
app.post('/api/flights', async (req, res) => {
  try {
    const {
      departure,
      arrival,
      outbound_date,
      return_date,
      currency = 'USD',
      adults = 1,
    } = req.body;

    console.log('📍 Flight search request:', {
      departure,
      arrival,
      outbound_date,
      return_date,
    });

    // Validate required parameters
    if (!departure || !arrival || !outbound_date) {
      return res.status(400).json({
        error: 'Missing required parameters: departure, arrival, outbound_date',
      });
    }

    const apiKey = process.env.VITE_FLIGHTS_API_SERA;
    if (!apiKey) {
      console.error('❌ VITE_FLIGHTS_API_SERA not found in .env.local');
      return res.status(500).json({
        error: 'API key not configured on server. Check .env.local file.',
      });
    }

    // Build SerpAPI request parameters (matching documented example)
    const params = new URLSearchParams({
      api_key: apiKey,
      engine: 'google_flights',
      departure_id: departure,
      arrival_id: arrival,
      outbound_date,
      currency,
      hl: 'en', // Language parameter (from SerpAPI docs)
      type: return_date ? '1' : '2',  // 1=round-trip (with return_date), 2=one-way
    });

    if (return_date) {
      params.append('return_date', return_date);
    }

    console.log('🛫 Calling SerpAPI...');

    // Make request to SerpAPI
    const response = await axios.get(`https://serpapi.com/search?${params}`, {
      timeout: 30000, // 30 second timeout
    });

    console.log('✅ SerpAPI response received');

    return res.status(200).json({
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Flight API Error:', error?.message);
    console.error('Error details:', error?.response?.data || error);

    // Return more detailed error for debugging
    const errorMessage =
      error?.response?.data?.error ||
      error?.message ||
      'Failed to fetch flights from SerpAPI';

    return res.status(error?.response?.status || 500).json({
      success: false,
      error: errorMessage,
      details: error?.response?.data || null,
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('🔥 Server Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`\n✅ Backend server running on http://localhost:${PORT}`);
  console.log(`📝 Flights endpoint: POST http://localhost:${PORT}/api/flights`);
  console.log(`🏥 Health check: GET http://localhost:${PORT}/health\n`);
});
