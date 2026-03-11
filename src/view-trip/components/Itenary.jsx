import React from 'react'
import PlaceCard from './PlaceCard'

function Itenary({trip}) {
    const itineraryRaw = trip?.tripData?.itinerary;

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

    const estimatedCost = trip?.tripData?.estimatedCostInr || trip?.tripData?.estimatedCost || {};

    const inr = (value) => {
        if (!value) return 'INR N/A';
        const text = String(value).trim();
        return text.toUpperCase().includes('INR') ? text : `INR ${text.replaceAll('$', '').trim()}`;
    };

        const getMealType = (plan = {}) => {
                const combined = `${plan?.placeName || ''} ${plan?.placeDetails || ''} ${plan?.time || ''} ${plan?.timeToVisit || ''} ${plan?.bestTimeToVisit || ''}`.toLowerCase();

                // Direct keyword matching for meals
                if (combined.includes('breakfast') || combined.includes('brunch')) return 'breakfast';
                if (combined.includes('lunch')) return 'lunch';
                if (combined.includes('dinner') || combined.includes('supper')) return 'dinner';

                // Food-related keywords that might indicate a restaurant/food place
                const foodKeywords = ['restaurant', 'cafe', 'coffee', 'food', 'eat', 'dining', 'bistro', 'diner', 'eatery', 'kitchen', 'grill', 'bakery', 'pizzeria', 'noodles', 'sushi', 'thai', 'indian', 'chinese', 'italian', 'mexican', 'seafood', 'bar & grill'];
                const isFoodPlace = foodKeywords.some(keyword => combined.includes(keyword));

                if (!isFoodPlace) return null;

                // If it's a food place, try to infer meal type from time
                const timeMatch = /(\d{1,2})(?::(\d{2}))?\s?(?:am|pm)?/i.exec(combined);
                if (timeMatch) {
                    let hour = Number(timeMatch[1]);
                    const isPm = combined.includes('pm') || (hour < 12 && combined.includes('afternoon')) || (hour < 12 && combined.includes('evening'));
                    const hour24 = isPm && hour !== 12 ? hour + 12 : hour;

                    if (hour24 >= 6 && hour24 < 11) return 'breakfast';
                    if (hour24 >= 11 && hour24 < 16) return 'lunch';
                    if (hour24 >= 16 && hour24 < 23) return 'dinner';
                }

                // Infer from day part context if mentioned
                if (combined.includes('morning')) return 'breakfast';
                if (combined.includes('afternoon')) return 'lunch';
                if (combined.includes('evening') || combined.includes('night')) return 'dinner';

                // Default: if no other hints, assume it's a lunch/dinner spot
                return null;
        };

        const mealEmoji = {
                breakfast: '🍳',
                lunch: '🍱',
                dinner: '🍽️',
        };

        const sectionEmoji = {
                visit: '🗺️',
                food: '🍴',
                cost: '💸',
        };

        const mealStyle = {
            breakfast: 'border-orange-200 bg-orange-50 text-orange-700',
            lunch: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            dinner: 'border-violet-200 bg-violet-50 text-violet-700',
        };

        const buildMeals = (plans = []) => {
                const mealMap = {
                        breakfast: null,
                        lunch: null,
                        dinner: null,
                };

                // First pass: assign explicitly identified meals
                plans.forEach((plan) => {
                        const type = getMealType(plan);
                        if (type && !mealMap[type]) {
                                mealMap[type] = plan;
                        }
                });

                // Second pass: try to fill empty meal slots with other food places
                const foodPlaces = plans.filter(plan => {
                        const combined = `${plan?.placeName || ''} ${plan?.placeDetails || ''} ${plan?.time || ''} ${plan?.timeToVisit || ''} ${plan?.bestTimeToVisit || ''}`.toLowerCase();
                        const foodKeywords = ['restaurant', 'cafe', 'coffee', 'food', 'eat', 'dining', 'bistro', 'diner', 'eatery', 'kitchen', 'grill', 'bakery', 'pizzeria', 'noodles', 'sushi', 'thai', 'indian', 'chinese', 'italian', 'mexican', 'seafood', 'bar & grill'];
                        return foodKeywords.some(keyword => combined.includes(keyword));
                });

                // Fill missing meal slots from available food places
                if (!mealMap.breakfast && foodPlaces.length > 0) {
                        const breakfast = foodPlaces.find(p => {
                                const combined = `${p?.placeName || ''} ${p?.placeDetails || ''} ${p?.timeToVisit || ''} ${p?.bestTimeToVisit || ''}`.toLowerCase();
                                return combined.includes('morning') || /^(6|7|8|9|10)(\s|:|am)/i.test(combined);
                        });
                        if (breakfast) mealMap.breakfast = breakfast;
                        else mealMap.breakfast = foodPlaces[0];
                }

                if (!mealMap.lunch && foodPlaces.length > 0) {
                        const lunch = foodPlaces.find(p => {
                                const combined = `${p?.placeName || ''} ${p?.placeDetails || ''} ${p?.timeToVisit || ''} ${p?.bestTimeToVisit || ''}`.toLowerCase();
                                return combined.includes('afternoon') || /^(11|12|13|14|15)(\s|:|pm)?/i.test(combined);
                        });
                        if (lunch) mealMap.lunch = lunch;
                        else if (foodPlaces.length > 1) mealMap.lunch = foodPlaces[1];
                }

                if (!mealMap.dinner && foodPlaces.length > 0) {
                        const dinner = foodPlaces.find(p => {
                                const combined = `${p?.placeName || ''} ${p?.placeDetails || ''} ${p?.timeToVisit || ''} ${p?.bestTimeToVisit || ''}`.toLowerCase();
                                return combined.includes('evening') || combined.includes('night') || /^(18|19|20|21|22)(\s|:|pm)?/i.test(combined);
                        });
                        if (dinner) mealMap.dinner = dinner;
                        else if (foodPlaces.length > 1) mealMap.dinner = foodPlaces[Math.min(foodPlaces.length - 1, 2)];
                }

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

        <section className='w-full rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.17),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.14),transparent_35%),#ffffff] p-4 shadow-[0_28px_74px_-30px_rgba(15,23,42,0.45)] backdrop-blur sm:rounded-3xl sm:p-6'>

            <h2 className='text-xl font-extrabold text-slate-900 sm:text-2xl'>{sectionEmoji.visit} Itinerary: Day by Day Plan</h2>
            <p className='mt-2 text-sm text-slate-600'>Beautifully sequenced daily plans with dedicated food stops and detailed destination cards.</p>

        <div className='mt-5 space-y-6'>
                        {itineraryItems.map((item, index) => {
                                const dayPlans = normalizeDayPlans(item).filter((plan) => plan && typeof plan === 'object');
                                const dayLabel = item?.day || item?.title || `Day ${index + 1}`;
                                                                const mealMap = buildMeals(dayPlans);
                                                                const activityPlans = dayPlans.filter((plan) => !getMealType(plan));
                                const routePlaces = activityPlans.slice(0, 5);
                                const routeStart = routePlaces[0]?.placeName || 'Start Point';
                                const routeEnd = routePlaces.at(-1)?.placeName || 'End Point';

                return (

                                <div key={`${dayLabel}-${index}`} className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_20px_50px_-28px_rgba(15,23,42,0.45)] transition-all duration-500 hover:-translate-y-1 hover:shadow-[0_32px_78px_-30px_rgba(79,70,229,0.45)] sm:p-5'>
                                        <div className='mb-4 flex flex-wrap items-start justify-between gap-3 sm:items-center'>
                                            <h3 className='text-xl font-extrabold text-slate-900'>{dayLabel}</h3>
                                            <span className='rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700'>
                                                🌤️ Smart weather-aware route
                                            </span>
                                        </div>

                                        <div className='mb-5 rounded-2xl border border-amber-200 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.16),transparent_40%),#fffaf0] p-4'>
                                            <h4 className='mb-1 text-sm font-extrabold uppercase tracking-wide text-amber-800'>{sectionEmoji.food} Food Plan</h4>
                                            <p className='mb-4 text-xs text-amber-700'>Breakfast, lunch, and dinner with visual previews and place details.</p>
                                            <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                                                {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                                                    const mealItem = mealMap[mealType];
                                                    return (
                                                        <div
                                                            key={`${dayLabel}-${mealType}`}
                                                            className='rounded-xl border border-amber-200 bg-white p-3 transition-all duration-500 transform-gpu hover:-translate-y-1 hover:rotate-[0.3deg] hover:shadow-[0_18px_38px_-24px_rgba(251,191,36,0.65)]'
                                                        >
                                                            <p className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${mealStyle[mealType]}`}>
                                                                {mealEmoji[mealType]} {mealType} Stop
                                                            </p>

                                                            {mealItem ? (
                                                                <div className='mt-3'>
                                                                    <PlaceCard place={mealItem} />
                                                                </div>
                                                            ) : (
                                                                <div className='mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600'>
                                                                    {mealEmoji[mealType]} No {mealType} place found. Add one manually for this day.
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className='mb-5 rounded-2xl border border-sky-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_45%),#f0f9ff] p-4'>
                                            <div className='flex flex-wrap items-center justify-between gap-2'>
                                                <h4 className='text-sm font-extrabold uppercase tracking-wide text-sky-800'>🧭 Route Flow Animation</h4>
                                                <span className='rounded-full border border-sky-200 bg-white px-2.5 py-1 text-[11px] font-bold text-sky-700'>
                                                    {routePlaces.length} places connected
                                                </span>
                                            </div>

                                            <div className='mt-3 rounded-xl border border-sky-200 bg-white/80 p-3'>
                                                <p className='text-xs font-semibold text-slate-600'>Start: <span className='font-bold text-slate-900'>{routeStart}</span></p>

                                                <div className='mt-3 flex items-center gap-2 overflow-x-auto pb-2'>
                                                    {routePlaces.map((plan, routeIndex) => (
                                                        <React.Fragment key={`${dayLabel}-route-${plan?.placeName || routeIndex}`}>
                                                            <div className='shrink-0 max-w-42.5 truncate rounded-lg border border-sky-200 bg-sky-50 px-2.5 py-1.5 text-xs font-semibold text-sky-800 sm:max-w-none sm:whitespace-normal'>
                                                                <span className='mr-1 animate-pulse'>📍</span>
                                                                {plan?.placeName || `Stop ${routeIndex + 1}`}
                                                            </div>

                                                            {routeIndex < routePlaces.length - 1 ? (
                                                                <div className='relative h-1 w-10 shrink-0 overflow-hidden rounded-full bg-sky-200'>
                                                                    <div className='absolute inset-y-0 left-0 w-1/2 bg-linear-to-r from-sky-500 to-indigo-500 animate-pulse' />
                                                                </div>
                                                            ) : null}
                                                        </React.Fragment>
                                                    ))}
                                                </div>

                                                <p className='mt-2 text-xs font-semibold text-slate-600'>End: <span className='font-bold text-slate-900'>{routeEnd}</span></p>
                                            </div>
                                        </div>

                    <div className='grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-2'>
                                        {activityPlans.length ? activityPlans.map((plan, planIndex) => (
                                                <div key={`${plan?.placeName || plan?.place || 'place'}-${planIndex}`} className='rounded-xl border border-slate-200 bg-white p-3 transition-transform duration-500 transform-gpu hover:-translate-y-1 hover:rotate-[0.35deg] hover:shadow-[0_14px_30px_-20px_rgba(79,70,229,0.45)]'>
                                                        <h3 className='mb-2 inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700'>
                                                            {getReadableVisitTime(plan, planIndex, activityPlans.length)}
                            </h3>
                            <PlaceCard place={plan}/>
                        </div>
                                        )) : (
                                            <div className='md:col-span-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm font-medium text-slate-600'>
                                                ✨ No sightseeing items detected for this day. Add custom activities if needed.
                                            </div>
                                        )}
                    </div>

                    
                </div>
            )})}

        </div>

                <div className='mt-8 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 sm:p-5'>
                                        <h3 className='text-lg font-extrabold text-slate-900'>{sectionEmoji.cost} Estimated Cost (INR)</h3>
                    <div className='mt-3 grid grid-cols-1 gap-2 text-sm text-slate-700 sm:grid-cols-2'>
                        <p>Accommodation: {inr(estimatedCost?.accommodationInr)}</p>
                        <p>Food: {inr(estimatedCost?.foodInr)}</p>
                        <p>Transport: {inr(estimatedCost?.transportInr)}</p>
                        <p>Activities: {inr(estimatedCost?.activitiesInr)}</p>
                        <p>Misc: {inr(estimatedCost?.miscInr)}</p>
                        <p>Per Day: {inr(estimatedCost?.perDayEstimatedCostInr)}</p>
                    </div>
                    <p className='mt-3 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-sm font-bold text-indigo-800'>
                        Total Estimated Cost: {inr(estimatedCost?.totalEstimatedCostInr || estimatedCost?.total)}
                    </p>
                </div>

    </section>


  )
}

export default Itenary