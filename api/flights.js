export default async function handler(req, res) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      departure,
      arrival,
      outbound_date,
      return_date,
      currency = 'USD',
      adults = 1,
    } = req.body;

    // Validate required parameters
    if (!departure || !arrival || !outbound_date) {
      return res.status(400).json({ 
        error: 'Missing required parameters: departure, arrival, outbound_date' 
      });
    }

    // Check for API key - support multiple env variable names
    const apiKey = process.env.FLIGHTS_API_SERPAPI || 
                   process.env.SERPAPI_KEY || 
                   process.env.VITE_FLIGHTS_API_SERPAPI;
    
    if (!apiKey) {
      console.error('❌ API key not found in environment variables');
      console.error('Available env keys:', Object.keys(process.env).filter(k => k.includes('FLIGHT') || k.includes('SERP')));
      return res.status(500).json({ 
        error: 'API key not configured on server',
        detail: 'Missing FLIGHTS_API_SERPAPI environment variable'
      });
    }

    console.log(`✅ Using API key: ${apiKey.substring(0, 5)}...`);

    // Build SerpAPI request parameters
    const params = new URLSearchParams({
      api_key: apiKey,
      engine: 'google_flights',
      departure_id: departure,
      arrival_id: arrival,
      outbound_date,
      currency,
      adults: String(adults),
      type: return_date ? 'roundtrip' : 'oneWay',
    });

    if (return_date) {
      params.append('return_date', return_date);
    }

    console.log(`📡 Calling SerpAPI for: ${departure} → ${arrival} on ${outbound_date}`);

    // Make request to SerpAPI
    const response = await fetch(`https://serpapi.com/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    console.log(`SerpAPI Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ SerpAPI Error: ${response.status}`, errorText);
      throw new Error(`SerpAPI returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Flight API Error:', error?.message || error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch flights',
      timestamp: new Date().toISOString(),
    });
  }
}
