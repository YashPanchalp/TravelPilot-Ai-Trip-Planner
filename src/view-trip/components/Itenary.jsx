import React from 'react'
import PlaceCard from './PlaceCard'

function Itenary({trip, additionalCostBreakdown = {}, travelers = 1, expenseOnly = false}) {
    const itineraryRaw = trip?.tripData?.itinerary;
    
        // Merge additional costs with original costs
        const estimatedCost = {
            ...trip?.tripData?.estimatedCostInr,
            ...additionalCostBreakdown,
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

        const buildLocalFallbackActivity = ({ dayIndex, destinationLabel }) => {
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

        const buildMeals = (plans = [], context = {}) => {
                const mealMap = {
                        breakfast: null,
                        lunch: null,
                        dinner: null,
                };
            const usedNames = new Set();

            const assignMeal = (mealType, plan) => {
                if (!plan || mealMap[mealType]) return false;
                const normalizedName = normalizePlaceName(plan?.placeName || `${mealType}-${usedNames.size + 1}`);
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

            const inferDayPartFromIndex = (index, total) => {
                if (!total || total <= 1) return 'Morning';
                const ratio = index / total;
                if (ratio < 0.34) return 'Morning';
                if (ratio < 0.67) return 'Afternoon';
                return 'Evening';
            };

            const getPlanPeriod = (plan = {}, planIndex = 0, totalPlans = 1) => {
                const searchText = getPlanSearchText(plan);

                if (searchText.includes('breakfast') || searchText.includes('morning')) return 'Morning';
                if (searchText.includes('lunch') || searchText.includes('afternoon')) return 'Afternoon';
                if (searchText.includes('dinner') || searchText.includes('evening') || searchText.includes('night')) return 'Evening';

                return inferDayPartFromIndex(planIndex, totalPlans);
            };

            const getReadableVisitTime = (plan, planIndex, totalPlans) => {
                const rawTime = String(plan?.timeToVisit || plan?.time || plan?.bestTimeToVisit || '').trim();
                const lower = rawTime.toLowerCase();

                const namedPart = lower.includes('morning')
                    ? 'Morning'
                    : lower.includes('afternoon')
                        ? 'Afternoon'
                        : lower.includes('evening')
                            ? 'Evening'
                            : lower.includes('night')
                                ? 'Night'
                                : null;

                if (namedPart) {
                    return namedPart;
                }

                return inferDayPartFromIndex(planIndex, totalPlans);
            };

    return (
        <section className='w-full rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] sm:p-6 lg:p-8'>
            {!expenseOnly && (
                <>
                    <div className='flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between'>
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-indigo-600'>AI itinerary</p>
                            <h2 className='mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl'>Day-by-day travel plan</h2>
                            <p className='mt-2 max-w-2xl text-sm leading-7 text-slate-600'>Premium cards, clean period tabs, and a more structured visual hierarchy for each day of the trip.</p>
                        </div>
                        <div className='flex flex-wrap gap-2'>
                            <span className='rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700'>{itineraryItems.length} days</span>
                            <span className='rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700'>Morning / Afternoon / Evening</span>
                        </div>
                    </div>

                    <div className='mt-6 space-y-6'>
                        {itineraryItems.map((item, index) => {
                            const dayPlans = normalizeDayPlans(item).filter((plan) => plan && typeof plan === 'object');
                            const dayLabel = item?.day || item?.title || `Day ${index + 1}`;
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

                            const combinedPlans = [
                                { plan: mealMap.breakfast },
                                { plan: mealMap.lunch },
                                { plan: mealMap.dinner },
                                ...activityPlans.map((plan) => ({ plan })),
                            ].filter((entry) => entry.plan && typeof entry.plan === 'object');

                            const groupedPlans = combinedPlans.reduce((accumulator, entry, planIndex) => {
                                const period = getPlanPeriod(entry.plan, planIndex, combinedPlans.length);
                                accumulator[period].push(entry.plan);
                                return accumulator;
                            }, { Morning: [], Afternoon: [], Evening: [] });

                            return (
                                <article key={`${dayLabel}-${index}`} className='overflow-hidden rounded-[28px] border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6'>
                                    <div className='flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between'>
                                        <div>
                                            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'>Day {index + 1}</p>
                                            <h3 className='mt-2 text-2xl font-semibold tracking-tight text-slate-950'>{dayLabel}</h3>
                                            <p className='mt-2 max-w-2xl text-sm leading-7 text-slate-600'>A balanced route with breakfast, afternoon exploration, and evening moments grouped into a cleaner layout.</p>
                                        </div>

                                        <div className='flex flex-wrap gap-2'>
                                            <span className='rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700'>{combinedPlans.length} stops</span>
                                            <span className='rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700'>AI generated</span>
                                        </div>
                                    </div>

                                    <div className='mt-5 flex flex-wrap gap-2'>
                                        {['Morning', 'Afternoon', 'Evening'].map((period) => (
                                            <div key={period} className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700'>
                                                <span className='h-2 w-2 rounded-full bg-indigo-600' />
                                                {period}
                                                <span className='rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-500'>{groupedPlans[period].length}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className='mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3'>
                                        {combinedPlans.length ? combinedPlans.map((entry, planIndex) => {
                                            const period = getPlanPeriod(entry.plan, planIndex, combinedPlans.length);
                                            const category = isFoodPlan(entry.plan) ? 'Dining' : 'Sightseeing';

                                            return (
                                                <div key={`${dayLabel}-${entry.plan?.placeName || planIndex}`} className='flex h-full flex-col gap-3'>
                                                    <div className='flex items-center justify-between gap-3'>
                                                        <span className='inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700'>{period}</span>
                                                        <span className='inline-flex rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600'>{category}</span>
                                                    </div>
                                                    <PlaceCard
                                                        place={entry.plan}
                                                        periodLabel={period}
                                                        categoryLabel={category}
                                                        ratingLabel='4.8'
                                                    />
                                                </div>
                                            );
                                        }) : (
                                            <div className='md:col-span-2 xl:col-span-3 rounded-[1.75rem] border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500'>
                                                No itinerary items for this day yet.
                                            </div>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </>
            )}
        </section>
    )
}

export default Itenary