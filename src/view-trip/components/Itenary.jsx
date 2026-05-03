import React from 'react'
import PlaceCard from './PlaceCard'

function Itenary({trip, additionalCostBreakdown = {}, travelers = 1, expenseOnly = false}) {
    const itineraryRaw = trip?.tripData?.itinerary;
    const travelersCount = Number(travelers) || 1;
    
    // Merge additional costs with original costs
    const estimatedCost = {
      ...trip?.tripData?.estimatedCostInr,
      ...additionalCostBreakdown,
    };
    const dayColorPalette = [
        { bg: 'from-indigo-50 to-blue-50', border: 'border-indigo-200', text: 'text-indigo-900', light: 'bg-indigo-100/50', accent: 'bg-indigo-500', emoji: '🗺️' },
        { bg: 'from-blue-50 to-slate-50', border: 'border-blue-200', text: 'text-blue-900', light: 'bg-blue-100/50', accent: 'bg-blue-500', emoji: '🗺️' },
        { bg: 'from-slate-50 to-indigo-50', border: 'border-slate-200', text: 'text-slate-900', light: 'bg-slate-100/50', accent: 'bg-slate-500', emoji: '🗺️' },
    ];

    // Simplified meal color palette - subtle colors
    const mealColorPalette = {
        breakfast: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-900', badge: 'border-slate-200 bg-slate-50 text-slate-700', light: 'bg-slate-100/50' },
        lunch: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-900', badge: 'border-slate-200 bg-slate-50 text-slate-700', light: 'bg-slate-100/50' },
        dinner: { bg: 'from-slate-50 to-slate-100', border: 'border-slate-200', text: 'text-slate-900', badge: 'border-slate-200 bg-slate-50 text-slate-700', light: 'bg-slate-100/50' },
    };

    const itineraryItems = Array.isArray(itineraryRaw)
        ? itineraryRaw
        : itineraryRaw && typeof itineraryRaw === 'object'
            ? Object.entries(itineraryRaw).map(([day, value]) => ({ day, ...value }))
            : [];

    const normalizeDayPlans = (item) => {
        const directPlans = item?.plan ?? item?.plans ?? item?.places ?? item?.activities;

        if (Array.isArray(directPlans)) {
            return directPlans;
        }

        if (directPlans && typeof directPlans === 'object') {
            return Object.values(directPlans).flatMap((value) => (Array.isArray(value) ? value : [value]));
        }

        if (Array.isArray(item)) {
            return item;
        }

        if (item && typeof item === 'object') {
            const nestedArrays = Object.values(item).filter(Array.isArray);
            if (nestedArrays.length > 0) {
                return nestedArrays.flat();
            }
        }

        return [];
    };

    const inr = (value) => {
        if (!value) return '₹N/A';
        const text = String(value).trim();
        return text.toUpperCase().includes('₹') || text.toUpperCase().includes('INR') ? text.replace(/INR/gi, '₹') : `₹${text.replaceAll('$', '').trim()}`;
    };

    const calculateTotal = () => {
        let total = 0;
        
        // Add additional costs (flights, hotel selections)
        total += additionalCostBreakdown?.travelFlightInr || 0;
        total += additionalCostBreakdown?.hotelCostInr || 0;
        
        // Add original estimated costs
        const extractNumeric = (val) => {
            if (!val) return 0;
            return Number.parseInt(String(val).replaceAll(/\D/g, '')) || 0;
        };
        
        // Only add accommodation if no hotel has been selected
        if (!additionalCostBreakdown?.hotelCostInr || additionalCostBreakdown?.hotelCostInr <= 0) {
            total += extractNumeric(estimatedCost?.accommodationInr);
        }
        
        total += extractNumeric(estimatedCost?.foodInr);
        total += extractNumeric(estimatedCost?.transportInr);
        total += extractNumeric(estimatedCost?.activitiesInr);
        total += extractNumeric(estimatedCost?.miscInr);
        
        return total.toLocaleString('en-IN');
    };

    const calculateDailyAverage = () => {
        let total = 0;
        
        // Add additional costs (flights, hotel selections)
        total += additionalCostBreakdown?.travelFlightInr || 0;
        total += additionalCostBreakdown?.hotelCostInr || 0;
        
        // Add original estimated costs
        const extractNumeric = (val) => {
            if (!val) return 0;
            return Number.parseInt(String(val).replaceAll(/\D/g, '')) || 0;
        };
        
        // Only add accommodation if no hotel has been selected
        if (!additionalCostBreakdown?.hotelCostInr || additionalCostBreakdown?.hotelCostInr <= 0) {
            total += extractNumeric(estimatedCost?.accommodationInr);
        }
        
        total += extractNumeric(estimatedCost?.foodInr);
        total += extractNumeric(estimatedCost?.transportInr);
        total += extractNumeric(estimatedCost?.activitiesInr);
        total += extractNumeric(estimatedCost?.miscInr);
        
        const days = itineraryItems.length || 1;
        const dailyAvg = Math.round(total / days);
        return dailyAvg.toLocaleString('en-IN');
    };

        const foodKeywords = ['restaurant', 'cafe', 'coffee', 'food', 'eat', 'dining', 'bistro', 'diner', 'eatery', 'kitchen', 'grill', 'bakery', 'pizzeria', 'noodles', 'sushi', 'thai', 'indian', 'chinese', 'italian', 'mexican', 'seafood', 'bar', 'street food', 'dhaba'];

        const getPlanSearchText = (plan = {}) => `${plan?.placeName || ''} ${plan?.placeDetails || ''} ${plan?.time || ''} ${plan?.timeToVisit || ''} ${plan?.bestTimeToVisit || ''}`.toLowerCase();

        const isFoodPlan = (plan = {}) => {
            const combined = getPlanSearchText(plan);
            return foodKeywords.some((keyword) => combined.includes(keyword))
                || combined.includes('breakfast')
                || combined.includes('lunch')
                || combined.includes('dinner')
                || combined.includes('brunch')
                || combined.includes('supper');
        };

        const getMealType = (plan = {}) => {
                const combined = getPlanSearchText(plan);

                if (combined.includes('breakfast') || combined.includes('brunch')) return 'breakfast';
                if (combined.includes('lunch')) return 'lunch';
                if (combined.includes('dinner') || combined.includes('supper')) return 'dinner';

                if (!isFoodPlan(plan)) return null;

                const timeMatch = /(\d{1,2})(?::(\d{2}))?\s?(?:am|pm)?/i.exec(combined);
                if (timeMatch) {
                    let hour = Number(timeMatch[1]);
                    const isPm = combined.includes('pm') || (hour < 12 && (combined.includes('afternoon') || combined.includes('evening')));
                    const hour24 = isPm && hour !== 12 ? hour + 12 : hour;

                    if (hour24 >= 6 && hour24 < 11) return 'breakfast';
                    if (hour24 >= 11 && hour24 < 16) return 'lunch';
                    if (hour24 >= 16 && hour24 < 23) return 'dinner';
                }

                if (combined.includes('morning')) return 'breakfast';
                if (combined.includes('afternoon')) return 'lunch';
                if (combined.includes('evening') || combined.includes('night')) return 'dinner';

                return null;
        };

        const normalizePlaceName = (name = '') => String(name).toLowerCase().replaceAll(/[^a-z0-9]/g, ' ').replaceAll(/\s+/g, ' ').trim();

        const buildLocalFallbackMeal = ({ mealType, dayIndex, destinationLabel, activityPlans = [] }) => {
            const city = String(destinationLabel || 'Local').split(',')[0].trim() || 'Local';
            const nearby = activityPlans[dayIndex % Math.max(activityPlans.length, 1)]?.placeName || activityPlans[0]?.placeName || city;

            const namePool = {
                breakfast: ['Old Town Breakfast Cafe', 'Morning Tiffin House', 'Sunrise Bakery & Tea Room'],
                lunch: ['City Spice Lunch House', 'Heritage Thali Kitchen', 'Market Street Eatery'],
                dinner: ['Riverside Dinner Bistro', 'Local Flavors Restaurant', 'Night Bazaar Grill'],
            };

            const timePool = {
                breakfast: '8:00 AM',
                lunch: '1:00 PM',
                dinner: '8:00 PM',
            };

            const costPool = {
                breakfast: '₹150 - 350',
                lunch: '₹250 - 600',
                dinner: '₹350 - 900',
            };

            const choice = namePool[mealType][dayIndex % namePool[mealType].length];

            return {
                placeName: `${city} ${choice}`,
                placeDetails: `Popular local ${mealType} place near ${nearby}. Added to complete your daily meal plan.`,
                placeAddress: `${nearby} area, ${city}`,
                time: timePool[mealType],
                timeToVisit: mealType === 'breakfast' ? 'Morning' : mealType === 'lunch' ? 'Afternoon' : 'Evening',
                ticketPricing: costPool[mealType],
                timeToTravel: '10-25 mins',
                placeImageUrl: '',
                geoCoordinates: '',
            };
        };

        const buildLocalFallbackActivity = ({ dayIndex, destinationLabel, existingActivities = [] }) => {
            const city = String(destinationLabel || 'Local').split(',')[0].trim() || 'Local';

            // Popular tourist attractions pool - Must-visit & mostly visited places
            const activityPool = [
                // Morning activities
                {
                    placeName: `${city} Main Market & Shopping Hub`,
                    placeDetails: `Explore the vibrant main market with local crafts, souvenirs, and authentic shopping experience. A must-visit for authentic souvenirs.`,
                    time: '9:00 AM',
                    timeToVisit: 'Morning',
                    ticketPricing: '₹0 - 500',
                },
                {
                    placeName: `${city} Major Temple / Sacred Site`,
                    placeDetails: `Visit the iconic religious landmark. Spectacular architecture and spiritual significance. A must-see attraction.`,
                    time: '8:00 AM',
                    timeToVisit: 'Morning',
                    ticketPricing: '₹0 - 300',
                },
                {
                    placeName: `${city} Central Park / Garden`,
                    placeDetails: `Serene green space perfect for morning walks. Lush landscapes, photo opportunities, and peaceful ambiance.`,
                    time: '7:00 AM',
                    timeToVisit: 'Morning',
                    ticketPricing: '₹0 - 100',
                },
                // Afternoon activities
                {
                    placeName: `${city} Famous Museum / Heritage Site`,
                    placeDetails: `Explore fascinating collections and exhibits. Learn about history, art, and culture. Top-rated tourist attraction.`,
                    time: '12:00 PM',
                    timeToVisit: 'Afternoon',
                    ticketPricing: '₹150 - 500',
                },
                {
                    placeName: `${city} Central Square / Monument`,
                    placeDetails: `Iconic landmark and gathering place. Historical significance with bustling atmosphere. Essential photo spot.`,
                    time: '1:00 PM',
                    timeToVisit: 'Afternoon',
                    ticketPricing: '₹0 - 200',
                },
                {
                    placeName: `${city} Adventure Activity / Water Sports`,
                    placeDetails: `Thrilling outdoor activity perfect for adventure seekers. Popular experience that travelers love.`,
                    time: '2:30 PM',
                    timeToVisit: 'Afternoon',
                    ticketPricing: '₹300 - 1000',
                },
                // Evening activities
                {
                    placeName: `${city} Scenic Viewpoint / Hilltop`,
                    placeDetails: `Panoramic city views and stunning sunset. Most recommended spot for evening photography and sunset viewing.`,
                    time: '5:30 PM',
                    timeToVisit: 'Evening',
                    ticketPricing: '₹0 - 300',
                },
                {
                    placeName: `${city} River Walk / Waterfront Promenade`,
                    placeDetails: `Beautiful riverside walk with shops, cafes, and entertainment. Perfect evening destination for relaxation.`,
                    time: '6:00 PM',
                    timeToVisit: 'Evening',
                    ticketPricing: '₹0 - 200',
                },
                {
                    placeName: `${city} Evening Market / Bazaar`,
                    placeDetails: `Bustling evening market with street food, shopping, and entertainment. Authentic local experience.`,
                    time: '6:30 PM',
                    timeToVisit: 'Evening',
                    ticketPricing: '₹100 - 600',
                },
            ];

            const picked = activityPool[dayIndex % activityPool.length];
            return {
                ...picked,
                placeAddress: `${city}, Popular Tourist Area`,
                timeToTravel: '15-40 mins',
                placeImageUrl: '',
                geoCoordinates: '',
            };
        };

        const ensureMinimumActivities = (plans = [], context = {}) => {
            const minActivitiesPerDay = 3;
            const existing = [...plans];
            const usedNames = new Set(existing.map((plan) => normalizePlaceName(plan?.placeName || '')));

            while (existing.length < minActivitiesPerDay) {
                const fallback = buildLocalFallbackActivity({
                    dayIndex: context?.dayIndex || 0,
                    destinationLabel: context?.destinationLabel,
                    existingActivities: existing,
                });

                let name = fallback.placeName;
                let suffix = 2;
                while (usedNames.has(normalizePlaceName(name))) {
                    name = `${fallback.placeName} ${suffix}`;
                    suffix += 1;
                }

                existing.push({
                    ...fallback,
                    placeName: name,
                });
                usedNames.add(normalizePlaceName(name));
            }

            return existing;
        };

        const mealEmoji = {
                breakfast: '🍳',
                lunch: '🍱',
                dinner: '🍽️',
        };

        // Helper function to get place type (Hotel or Place N)
        const getPlaceType = (placeName, index) => {
          const name = (placeName || '').toLowerCase();
          if (name.includes('hotel') || index === 0) return '🏨 Hotel';
          const placeNum = index; // Use index as place number
          return `🎯 Place ${placeNum}`;
        };

        const sectionEmoji = {
                visit: '🗺️',
                food: '🍴',
                cost: '💸',
        };

        const buildMeals = (plans = [], context = {}) => {
                const mealMap = {
                        breakfast: null,
                        lunch: null,
                        dinner: null,
                };
            const usedNames = new Set();

            const assignMeal = (mealType, plan) => {
                if (!plan || mealMap[mealType]) return false;
                const normalizedName = normalizePlaceName(plan?.placeName || `${mealType}-${Math.random()}`);
                if (usedNames.has(normalizedName)) return false;
                mealMap[mealType] = plan;
                usedNames.add(normalizedName);
                return true;
            };

                // First pass: assign explicitly identified meals
                plans.forEach((plan) => {
                        const type = getMealType(plan);
                if (type) {
                    assignMeal(type, plan);
                        }
                });

            // Second pass: assign untyped food places without repeating names
            const foodPlaces = plans.filter((plan) => isFoodPlan(plan));
            const remainingFoodPlaces = foodPlaces.filter((plan) => !usedNames.has(normalizePlaceName(plan?.placeName || '')));

            ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
                if (!mealMap[mealType]) {
                const candidate = remainingFoodPlaces.find((plan) => !usedNames.has(normalizePlaceName(plan?.placeName || '')));
                if (candidate) {
                    assignMeal(mealType, candidate);
                }
                }
            });

            // Final pass: build local fallback meal places if still missing
            ['breakfast', 'lunch', 'dinner'].forEach((mealType) => {
                if (!mealMap[mealType]) {
                const fallbackPlan = buildLocalFallbackMeal({
                    mealType,
                    dayIndex: context?.dayIndex || 0,
                    destinationLabel: context?.destinationLabel,
                    activityPlans: context?.activityPlans || [],
                });

                if (!assignMeal(mealType, fallbackPlan)) {
                    const safePlan = {
                    ...fallbackPlan,
                    placeName: `${fallbackPlan.placeName} ${mealType === 'breakfast' ? 'Morning Spot' : mealType === 'lunch' ? 'Lunch Spot' : 'Dinner Spot'}`,
                    };
                    assignMeal(mealType, safePlan);
                }
                }
            });

                return mealMap;
        };

            const toDayPart = (hour24) => {
                if (hour24 < 12) return 'Morning';
                if (hour24 < 17) return 'Afternoon';
                if (hour24 < 21) return 'Evening';
                return 'Night';
            };

            const inferDayPartFromIndex = (index, total) => {
                if (!total || total <= 1) return 'Morning';
                const ratio = index / total;
                if (ratio < 0.34) return 'Morning';
                if (ratio < 0.67) return 'Afternoon';
                return 'Evening';
            };

            const getReadableVisitTime = (plan, planIndex, totalPlans) => {
                const rawTime = String(plan?.timeToVisit || plan?.time || plan?.bestTimeToVisit || '').trim();
                const lower = rawTime.toLowerCase();

                // Extract named day part (Morning, Afternoon, Evening, Night)
                const namedPart = lower.includes('morning')
                    ? 'Morning'
                    : lower.includes('afternoon')
                        ? 'Afternoon'
                        : lower.includes('evening')
                            ? 'Evening'
                            : lower.includes('night')
                                ? 'Night'
                                : null;

                // Extract clock time (e.g., "9:00 AM")
                const timeMatch = /(\d{1,2}(?::\d{2})?\s?(?:AM|PM|am|pm))/i.exec(rawTime);
                const clockTime = timeMatch ? timeMatch[1].toUpperCase() : null;

                // Case 1: Both named part and clock time extracted
                if (namedPart && clockTime) {
                    return `🕐 ${namedPart} • ${clockTime}`;
                }

                // Case 2: Clock time exists, infer day part from it
                if (clockTime) {
                    const hourMatch = /^(\d{1,2})/.exec(clockTime);
                    const hour = hourMatch ? Number(hourMatch[1]) : 9;
                    const isPm = clockTime.toUpperCase().includes('PM');
                    const hour24 = isPm ? (hour === 12 ? 12 : hour + 12) : (hour === 12 ? 0 : hour);
                    return `🕐 ${toDayPart(hour24)} • ${clockTime}`;
                }

                // Case 3: Named part exists but no clock time
                if (namedPart) {
                    return `🕐 ${namedPart}`;
                }

                // Case 4: No time info, infer from activity position in day
                return `🕐 ${inferDayPartFromIndex(planIndex, totalPlans)}`;
            };

  return (

        <section className='w-full rounded-3xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_45%),#ffffff] p-4 shadow-[0_26px_70px_-28px_rgba(15,23,42,0.42)] backdrop-blur sm:rounded-4xl sm:p-8'>
            <style>{`
              @keyframes float { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
              @keyframes shimmer { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
              @keyframes slideInDown { from { opacity: 0; transform: translateY(-20px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes slideInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
              @keyframes pulse3d { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.02); } }
              .day-card { perspective: 1000px; }
              .day-card:hover { transform: rotateX(2deg) rotateY(-2deg); }
              .float-animation { animation: float 3s ease-in-out infinite; }
              .shimmer-animation { animation: shimmer 2.5s ease-in-out infinite; }
              .slide-in-down { animation: slideInDown 0.6s ease-out; }
              .slide-in-up { animation: slideInUp 0.6s ease-out; }
              .pulse-3d { animation: pulse3d 2.5s ease-in-out infinite; }
            `}</style>

            {!expenseOnly && (
            <>
            <h2 className='text-2xl font-extrabold text-slate-900 sm:text-3xl'>{sectionEmoji.visit} Itinerary: Day by Day Adventure</h2>
            <p className='mt-2 text-sm text-slate-600 sm:text-base'>Beautifully sequenced daily plans with dedicated food stops and vivid destination cards.</p>

        <div className='mt-8 space-y-6'>
                {itineraryItems.map((item, index) => {
                                const dayPlans = normalizeDayPlans(item).filter((plan) => plan && typeof plan === 'object');
                                const dayLabel = item?.day || item?.title || `Day ${index + 1}`;
                                const dayColor = dayColorPalette[index % dayColorPalette.length];
                                const rawActivityPlans = dayPlans.filter((plan) => !isFoodPlan(plan));
                                const activityPlans = ensureMinimumActivities(rawActivityPlans, {
                                    dayIndex: index,
                                    destinationLabel: trip?.userSelection?.location?.label,
                                }).slice(0, 3);
                                const mealMap = buildMeals(dayPlans, {
                                    dayIndex: index,
                                    destinationLabel: trip?.userSelection?.location?.label,
                                    activityPlans: rawActivityPlans,
                                });
                                const routePlaces = activityPlans.slice(0, 5);
                                const routeStart = routePlaces[0]?.placeName || 'Start Point';
                                const routeEnd = routePlaces.at(-1)?.placeName || 'End Point';

                return (

                                <div key={`${dayLabel}-${index}`} className={`day-card rounded-3xl border-2 ${dayColor.border} bg-gradient-to-br ${dayColor.bg} p-6 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.35)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_40px_80px_-25px_rgba(79,70,229,0.35)] sm:p-7 slide-in-down`} style={{animationDelay: `${index * 0.1}s`}}>
                                        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                            <div className='flex items-center gap-3'>
                                                <span className='text-4xl float-animation'>{dayColor.emoji}</span>
                                                <div>
                                                    <h3 className={`text-2xl font-extrabold ${dayColor.text}`}>{dayLabel}</h3>
                                                    <p className={`text-xs font-semibold mt-1`}>Day {index + 1} of {itineraryItems.length}</p>
                                                </div>
                                            </div>
                                            <span className={`rounded-full border-2 ${dayColor.border} ${dayColor.light} px-4 py-2 text-xs font-bold ${dayColor.text} text-center`}>
                                                ✓ {activityPlans.length + 3} activities
                                            </span>
                                        </div>

                                        <div className={`mb-6 rounded-3xl bg-linear-to-br ${mealColorPalette.breakfast.bg} p-5 shadow-[0_8px_24px_-12px_rgba(251,191,36,0.25)]`}>
                                            <h4 className={`mb-1 flex items-center gap-2 text-sm font-extrabold uppercase tracking-wider ${mealColorPalette.breakfast.text}`}>{sectionEmoji.food} Culinary Experiences</h4>
                                            <p className={`mb-5 text-xs ${mealColorPalette.breakfast.text}`}>Handpicked breakfast, lunch & dinner with local flavors and authentic cuisines.</p>
                                            <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
                                                {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                                                    const mealItem = mealMap[mealType];
                                                    const mealColor = mealColorPalette[mealType];
                                                    return (
                                                        <div
                                                            key={`${dayLabel}-${mealType}`}
                                                            className={`rounded-2xl bg-gradient-to-br ${mealColor.bg} p-4 transition-all duration-500 transform-gpu hover:scale-105 hover:-translate-y-1 hover:shadow-[0_16px_32px_-12px] shadow-[0_8px_20px_-12px_rgba(0,0,0,0.08)] pulse-3d`}
                                                        >
                                                            <p className={`inline-flex rounded-full bg-white/70 border border-white/80 ${mealColor.text} px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide`}>
                                                                {mealEmoji[mealType]} {mealType}
                                                            </p>

                                                            {mealItem ? (
                                                                <div className='mt-4 slide-in-up'>
                                                                    <PlaceCard place={mealItem} themeColor={mealColor} />
                                                                </div>
                                                            ) : (
                                                                <div className={`mt-4 rounded-xl bg-white/40 backdrop-blur-sm p-4 text-sm font-medium ${mealColor.text}`}>
                                                                    {mealEmoji[mealType]} No {mealType} found
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className={`mb-6 rounded-3xl bg-linear-to-br from-white/70 to-white/50 p-5 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.06)]`}>
                                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                                <h4 className={`text-sm font-extrabold uppercase tracking-wider flex items-center gap-2 ${dayColor.text}`}>🧭 Route Flow & Connections</h4>
                                                <span className={`rounded-full ${dayColor.light} px-3 py-1 text-[11px] font-bold ${dayColor.text}`}>
                                                    {routePlaces.length} stops connected
                                                </span>
                                            </div>

                                            <div className={`mt-4 rounded-2xl bg-linear-to-b ${dayColor.bg} p-4 shadow-[0_4px_12px_-8px_rgba(0,0,0,0.05)]`}>
                                                <p className={`text-xs font-semibold ${dayColor.text}`}>🎯 Journey Start: <span className='font-bold'>{routeStart}</span></p>

                                                <div className='mt-4 flex items-center gap-2 overflow-x-auto pb-3 scroll-smooth'>
                                                    {routePlaces.map((plan, routeIndex) => (
                                                        <React.Fragment key={`${dayLabel}-route-${plan?.placeName || routeIndex}`}>
                                                            <div className={`shrink-0 max-w-48 truncate rounded-xl ${dayColor.light} px-3 py-2 text-xs font-bold ${dayColor.text} transition-all hover:scale-110 hover:-translate-y-1 transform-gpu pulse-3d shadow-[0_2px_8px_-4px_rgba(0,0,0,0.06)]`} style={{animationDelay: `${routeIndex * 0.15}s`}}>
                                                                <span className='mr-1.5 text-sm'>📍</span>
                                                                {plan?.placeName || `Stop ${routeIndex + 1}`}
                                                            </div>

                                                            {routeIndex < routePlaces.length - 1 ? (
                                                                <div className={`relative h-1.5 w-12 shrink-0 overflow-hidden rounded-full bg-linear-to-r ${dayColor.light}`}>
                                                                    <div className={`absolute inset-y-0 left-0 w-1/2 bg-linear-to-r ${dayColor.light} animate-pulse shimmer-animation`} />
                                                                </div>
                                                            ) : null}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                <p className={`mt-4 text-xs font-semibold ${dayColor.text}`}>🏁 Journey End: <span className='font-bold'>{routeEnd}</span></p>
                                            </div>
                                        </div>

                    <div className='mb-6'>
                      <div className='mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center'>
                        <h4 className={`text-lg font-extrabold ${dayColor.text} flex items-center gap-2`}>
                          🎯 Top Attractions & Sightseeing
                        </h4>
                        <span className={`rounded-full border-2 ${dayColor.border} ${dayColor.light} px-3 py-1 text-xs font-semibold ${dayColor.text}`}>
                          {activityPlans.length} places
                        </span>
                      </div>
                      <div className='grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2 lg:grid-cols-3'>
                                        {activityPlans.length ? activityPlans.map((plan, planIndex) => (
                                                <div key={`${plan?.placeName || plan?.place || 'place'}-${planIndex}`} className='slide-in-up' style={{animationDelay: `${planIndex * 0.12}s`}}>
                                                        <div className='mb-2 flex flex-wrap items-center gap-2'>
                                                          <h3 className={`inline-flex rounded-full ${dayColor.light} px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${dayColor.text}`}>
                                                              {getReadableVisitTime(plan, planIndex, activityPlans.length)}
                                                          </h3>
                                                        </div>
                            <PlaceCard place={plan} themeColor={dayColor} />
                        </div>
                                        )) : (
                                            <div className={`md:col-span-2 lg:col-span-3 rounded-2xl ${dayColor.light} p-6 text-center shadow-[0_4px_12px_-6px_rgba(0,0,0,0.04)]`}>
                                                <p className={`text-sm font-semibold ${dayColor.text}`}>✨ No sightseeing items for this day. Create custom activities to explore!</p>
                                            </div>
                                        )}
                      </div>
                    </div>

                    
                </div>
            )})}

        </div>

            </>
            )}

    </section>


  )
}

export default Itenary