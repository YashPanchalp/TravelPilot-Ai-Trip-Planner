export const SelectTravelesList = [
    {
        id:1,
        title:'Just me',
        desc:'Perfect for solo travelers seeking personalized adventures.',
        icon:'👤',
        people:'1'
    },
    {
        id:2,
        title:'Couple',
        desc:'Two travellers looking for shared experiences.',
        icon:'🥂',
        people:'2 People'
    },
    {
        id:3,
        title:'Family',
        desc:'Ideal for families with children of all ages.',   
        icone:'🏠',
        people:'3-5 People' 
    },
    {
        id:4,
        title:'Group / Friends',
        desc:'Great for groups of friends or extended families.',
        icon:'👥',
        people:'5 TO 10 People'
    },
]

export const SelectBudgetoptions = [
    {
        id:0,
        title:'Pocket Friendly',
        desc:'Budget-conscious travel with affordable accommodations, local eateries, and free activities.',
        icon:'🪙',
    },
    {
        id:1,
        title:'Moderate',
        desc:'A balanced mix of comfort and savings with mid-range hotels and quality experiences.',
        icon:'💰',
    },
    {
        id:2,
        title:'Luxury',
        desc:'Premium experiences with five-star hotels, fine dining, and exclusive activities.',
        icon:'💎',
    }
]

export const SelectInterestOptions = [
    { id: 1, title: 'Adventure' },
    { id: 2, title: 'Beaches' },
    { id: 3, title: 'Culture' },
    { id: 4, title: 'Food & Dining' },
    { id: 5, title: 'Photography' },
    { id: 6, title: 'Nature' },
    { id: 7, title: 'Nightlife' },
    { id: 8, title: 'History' },
];

export const AI_PROMPT='Generate a detailed travel plan for Location: {location}, from {startDate} to {endDate}, for {totalDays} days, for {travelers}, with budget preference: {budget}. Traveler interests: {interests}. User preference notes (optional): {userPreference}. Weather context for these dates: {weatherSummary}. If userPreference is not empty, prioritize and reflect those preferences in hotels, food choices, pacing, and activities. Return only valid JSON (no markdown). Include a basic weatherOverview object in response with keys: condition, tempRange, rainChance. Keep weatherOverview short and user-friendly. Include a hotels array with 8 to 12 options, and for each hotel include: hotelName, hotelAddress, price, hotelImageUrl, geoCoordinates, rating, description. All hotel prices must be in INR only and should be realistic for the selected budget (avoid inflated luxury pricing unless budget is Luxury). Include an itinerary array for {totalDays} days where each day has a day label and a plan array from morning to night. In each day, include sightseeing/activity places with a strict minimum of 2 and target 3 to 5 places, PLUS explicit breakfast, lunch, and dinner entries at famous LOCAL places. Meal rules are strict: breakfast, lunch, and dinner must all be present for every day; each meal must use a different restaurant/placeName within the same day; do not repeat the same restaurant for multiple meals; prefer authentic local eateries and region-specific cuisine over generic chains. For every plan item include: time, timeToVisit, placeName, placeDetails, placeImageUrl, geoCoordinates, placeAddress, ticketPricing, timeToTravel. All ticketPricing and meal costs must be in INR only and budget-friendly according to {budget}. Adapt activity recommendations to the provided weather context and selected interests. Add an estimatedCostInr object after itinerary with these keys: accommodationInr, foodInr, transportInr, activitiesInr, miscInr, totalEstimatedCostInr, perDayEstimatedCostInr. Keep totalEstimatedCostInr realistic and conservative: do not overestimate, avoid premium assumptions, prioritize public transport and affordable local restaurants unless budget is Luxury. For Very Pocket Friendly budget keep costs ultra-low with hostels/guesthouses, street food, free or low-ticket places, and cheapest public transport. For Cheap budget keep per-day estimate low; for Moderate keep mid-range; for Luxury keep premium but still realistic. IMPORTANT: Include a travelAdvisory object after estimatedCostInr with these five essential categories: (1) alerts - brief safety warnings, security concerns, or travel warnings specific to {location} during {startDate} to {endDate}; (2) regulations - visa requirements, entry rules, and important local laws; (3) culturalTips - cultural do\'s and don\'ts, dress codes, religious sensitivities, and local etiquette; (4) localUpdates - recent important events, festivals, strikes, major closures, or disruptions affecting travelers; (5) practicalTips - weather-specific advice, health precautions, common scams to avoid, transportation tips, and other practical guidance. Keep each advisory point concise (1-2 sentences), actionable, and specific to the destination and travel dates. Avoid generic advice; provide real, destination-specific information.'