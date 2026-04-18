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

    const apiKey = process.env.VITE_FLIGHTS_API_SERA;
    if (!apiKey) {
      return res.status(500).json({ 
        error: 'API key not configured on server' 
      });
    }

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

    // Make request to SerpAPI
    const response = await fetch(`https://serpapi.com/search?${params}`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SerpAPI returned status ${response.status}`);
    }

    const data = await response.json();

    return res.status(200).json({
      success: true,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Flight API Error:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch flights',
      timestamp: new Date().toISOString(),
    });
  }
}
