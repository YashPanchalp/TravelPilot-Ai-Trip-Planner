export default async function handler(req, res) {
  // Add CORS headers for client requests
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('📨 Received flight request:', JSON.stringify(req.body, null, 2));

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
      console.error('❌ Missing required fields:', { departure, arrival, outbound_date });
      return res.status(400).json({ 
        error: 'Missing required parameters: departure, arrival, outbound_date',
        received: { departure, arrival, outbound_date }
      });
    }

    // Check for API key - support multiple env variable names
    const apiKey = process.env.FLIGHTS_API_SERPAPI || 
                   process.env.SERPAPI_KEY || 
                   process.env.VITE_FLIGHTS_API_SERPAPI;
    
    if (!apiKey) {
      console.error('❌ API key not found in environment variables');
      const availableKeys = Object.keys(process.env).filter(k => k.toUpperCase().includes('FLIGHT') || k.toUpperCase().includes('SERP'));
      console.error('Available environment keys:', availableKeys);
      return res.status(500).json({ 
        error: 'API key not configured on server',
        detail: 'Missing FLIGHTS_API_SERPAPI environment variable',
        availableKeys: availableKeys.length > 0 ? availableKeys : 'None found'
      });
    }

    // Validate API key format
    if (typeof apiKey !== 'string' || apiKey.length < 5) {
      console.error('❌ Invalid API key format');
      return res.status(500).json({ 
        error: 'Invalid API key format',
        keyLength: apiKey?.length || 0
      });
    }

    console.log(`✅ API key found (length: ${apiKey.length})`);

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

    const serpUrl = `https://serpapi.com/search?${params}`;
    console.log(`📡 Calling SerpAPI: ${departure} → ${arrival} on ${outbound_date}`);
    console.log(`🔗 Request URL (key masked): https://serpapi.com/search?api_key=***&engine=google_flights&...`);

    // Make request to SerpAPI with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(serpUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Vercel-Flights-API/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);
    console.log(`📊 SerpAPI Response Status: ${response.status}`);

    if (!response.ok) {
      const contentType = response.headers.get('content-type');
      let errorText = '';
      
      try {
        if (contentType?.includes('application/json')) {
          const errorJson = await response.json();
          errorText = JSON.stringify(errorJson);
        } else {
          errorText = await response.text();
        }
      } catch (e) {
        errorText = `Could not parse error response`;
      }

      console.error(`❌ SerpAPI Error ${response.status}:`, errorText);
      
      // Provide user-friendly error message based on status code
      let userMessage = 'Failed to fetch flights from SerpAPI';
      if (response.status === 401) userMessage = 'API key is invalid or unauthorized';
      if (response.status === 403) userMessage = 'API key does not have permission';
      if (response.status === 404) userMessage = 'Airport codes not found';
      if (response.status === 429) userMessage = 'Rate limited - too many requests';
      
      return res.status(response.status).json({ 
        error: userMessage,
        serpStatus: response.status,
        detail: errorText.substring(0, 500) // Limit error detail length
      });
    }

    const data = await response.json();
    console.log(`✅ Successfully fetched flight data`);

    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Flight API Error:', error?.message || error);
    
    let userMessage = 'Failed to fetch flights';
    if (error?.name === 'AbortError') {
      userMessage = 'Request timeout - SerpAPI took too long to respond';
    }
    
    return res.status(500).json({
      success: false,
      error: userMessage,
      detail: error?.message?.substring(0, 200) || 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
