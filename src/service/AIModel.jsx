
// // To run this code you need to install the following dependencies:
// // npm install @google/genai mime
// // npm install -D @types/node

// import {
//   GoogleGenAI,
// } from '@google/genai';

// async function main() {
//   const ai = new GoogleGenAI({
//     apiKey: import.meta.env.VITE_GOOGLE_GENAI_API_KEY,
//   });
//   const config = {
//     thinkingConfig: {
//       thinkingLevel: ThinkingLevel.MINIMAL,
//     },
//   };
//   const model = 'gemini-3.1-flash-lite-preview';
//   const contents = [
//     {
//       role: 'user',
//       parts: [
//         {
//           text: `INSERT_INPUT_HERE`,
//         },
//       ],
//     },
//   ];

//   const response = await ai.models.generateContentStream({
//     model,
//     config,
//     contents,
//   });
//   let fileIndex = 0;
//   for await (const chunk of response) {
//     console.log(chunk.text);
//   }
// }

// main();

import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY;

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-3.1-flash-lite-preview",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 64,
  maxOutputTokens: 8192,
  responseMimeType: "application/json",
};

export const chatSession = model.startChat({
  generationConfig,
  history: [
    {
      role: "user",
      parts: [
        {text: "Generate a detailed travel plan for Location: Las Vegas, for 3 days, for Couple. Return only valid JSON (no markdown). Include a basic weatherOverview object with condition, tempRange, rainChance. Include a hotels array with 8 to 12 options, and for each hotel include: hotelName, hotelAddress, price, hotelImageUrl, geoCoordinates, rating, description. All prices must be in INR only and realistic for budget travelers unless Luxury budget is explicitly requested. Include an itinerary array for 3 days where each day has a day label and a plan array from morning to night. In each day include 4 to 5 sightseeing/activity places plus explicit breakfast, lunch, and dinner entries at famous local places. For every plan item include: time, timeToVisit, placeName, placeDetails, placeImageUrl, geoCoordinates, placeAddress, ticketPricing, timeToTravel. All ticket and meal costs must be in INR only and should avoid overpricing. Add estimatedCostInr with accommodationInr, foodInr, transportInr, activitiesInr, miscInr, totalEstimatedCostInr and perDayEstimatedCostInr. Keep total costs conservative and practical with affordable assumptions."},
      ],
    },

    {
      role: "model",
      parts: [
        {text: "```json\n{\n  \"hotels\": [\n    {\n      \"hotelName\": \"The D Las Vegas\",\n      \"hotelAddress\": \"301 Fremont Street, Las Vegas, NV 89101\",\n      \"price\": \"$50-$100 per night\",\n      \"hotelImageUrl\": \"https://www.theDcasino.com/images/hero/main-hero-02.jpg\",\n      \"geoCoordinates\": \"36.1695, -115.1438\",\n      \"rating\": \"3.5 stars\",\n      \"description\": \"A budget-friendly hotel located in downtown Las Vegas with a retro vibe. It features a casino, a pool, and several dining options.\"\n    }\n  ]\n}\n```"},
      ],
    },
  ],
});

/**
 * Get airport code for a location using Gemini AI
 * @param {string} location - City or location name
 * @returns {Promise<string>} Airport code (3-letter IATA code)
 */
export const getAirportCodeFromGemini = async (location) => {
  try {
    if (!location) return null;

    // Clean location string
    const cleanLocation = location
      .toLowerCase()
      .trim()
      .split(',')[0] // Take only first part (city name)
      .trim();

    console.log(`🤖 Asking Gemini for airport code of: "${cleanLocation}"`);

    // Create a simple model for just this task
    const airportModel = genAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    const prompt = `You are an expert in airport codes. Given a city or location name, return ONLY the 3-letter IATA airport code for the main international airport in that location. 
Return your response as a single airport code (e.g., "CDG", "LAX", "LHR", "NRT") with NO additional text, explanation, or formatting.

Location: ${cleanLocation}

Airport code:`;

    const result = await airportModel.generateContent(prompt);
    const responseText = result.response.text().trim().toUpperCase();

    // Extract only the 3-letter code (in case Gemini adds extra text)
    const codeMatch = responseText.match(/\b([A-Z]{3})\b/);
    const airportCode = codeMatch ? codeMatch[1] : responseText;

    if (/^[A-Z]{3}$/.test(airportCode)) {
      console.log(`✅ Got airport code from Gemini: ${airportCode}`);
      return airportCode;
    } else {
      console.warn(`⚠️ Invalid airport code from Gemini: ${responseText}`);
      return cleanLocation; // Fallback to city name
    }
  } catch (error) {
    console.error('❌ Error calling Gemini for airport code:', error?.message);
    return location; // Fallback to original location
  }
};

/**
 * Generate local transport guide for a day's itinerary
 * @param {Object} params - Parameters including city, date, startTime, dayItinerary, hotelName
 * @returns {Promise<Object>} Transport guide data with segments and summary
 */
export const getLocalTransportGuide = async ({ city, date, startTime, dayItinerary = [], hotelName = 'Hotel' }) => {
  try {
    if (!city || !dayItinerary?.length) {
      console.warn('⚠️ Missing city or itinerary data');
      return null;
    }

    // Create itinerary string
    const itineraryStr = `Hotel → ${dayItinerary
      .map((place) => place?.placeName || place?.place || 'Stop')
      .join(' → ')} → Hotel`;

    const travelApiKey = import.meta.env.VITE_GOOGLE_GENAI_API_KEY || import.meta.env.TRIP_LOCAL_TRAVEL_API_KEY;
    const transportGenAI = new GoogleGenerativeAI(travelApiKey);

    const transportModel = transportGenAI.getGenerativeModel({
      model: "gemini-3.1-flash-lite-preview",
    });

    const transportPrompt = `You are an intelligent Travel Route, Time & Cost Planner.

City: ${city}
Date: ${date}
Start Time: ${startTime}
Hotel Name: ${hotelName}

Day Itinerary:
${itineraryStr}

Task: For each segment (A → B), provide:
1. Distance & Travel Time (approx distance in km, travel duration)
2. Tentative Timing (departure → arrival times, sequential flow)
3. Local Transport Option (mode, cost per person in ₹, note)
4. Private Transport Option (cab/taxi, cost range in ₹)
5. Smart Suggestion (best option with reason)

Rules:
- If distance < 2 km → walking
- If 2-8 km → auto/cab
- If > 8 km → cab/metro
- Bus: low cost ₹10-₹50
- Auto: ₹80-₹200
- Cab: ₹12-₹18 per km + base fare
- Show realistic time flows
- Breakfast: 45-60 min, Lunch/Dinner: 60-90 min, Places: 60-120 min

Return as JSON with:
{
  "segments": [
    {
      "segment": "A → B",
      "distance": "X km",
      "travelTime": "X-Y min",
      "timing": "HH:MM AM/PM → HH:MM AM/PM",
      "localTransport": "Mode, ₹X-₹Y per person, note",
      "privateTransport": "Cab/Taxi, ₹X-₹Y total, note",
      "recommendation": "Best option & reason"
    }
  ],
  "summary": {
    "totalCostLocal": "₹X-₹Y per person",
    "totalCostPrivate": "₹X-₹Y total",
    "totalTravelTime": "X hours Y minutes",
    "dayTimeline": "HH:MM AM - HH:MM PM"
  }
}`;

    const result = await transportModel.generateContent(transportPrompt);
    const responseText = result.response.text();

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const transportData = JSON.parse(jsonMatch[0]);
      console.log('✅ Transport guide generated:', transportData);
      return transportData;
    } else {
      console.warn('⚠️ Could not parse transport data from response');
      return null;
    }
  } catch (error) {
    console.error('❌ Error generating transport guide:', error?.message || error);
    throw error;
  }
};

