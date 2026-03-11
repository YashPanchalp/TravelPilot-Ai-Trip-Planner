import React, { useEffect } from 'react'
import image from '../../assets/image.png'
import { GetPlaceDetails } from '@/service/GlobalAPI';
import { useState } from 'react';


function InformationSection({trip}) {

  // Request a larger Places photo so hero images stay sharp on wide screens.
  const PHOTO_REF_URL = 'https://places.googleapis.com/v1/{NAME}/media?maxHeightPx=1600&maxWidthPx=2200&key='+import.meta.env.VITE_GOOGLE_PLACES_API_KEY;
  const [photoUrl, setPhotoUrl] = useState(image);
  //set real img when have trip info
  useEffect(() => {
    trip&&GetPlacePhoto();
  }, [trip])
  //func
  const GetPlacePhoto = async() => {
    const locationLabel = trip?.userSelection?.location?.label;

    if (!locationLabel) {
      return;
    }
    const data = {
      textQuery: locationLabel
    }

    try {
      const res = await GetPlaceDetails(data);
      const photoRef = res?.data?.places?.[0]?.photos?.[0]?.name;
      if (!photoRef) {
        return;
      }
      const photoUrl = PHOTO_REF_URL.replace('{NAME}', photoRef);
      setPhotoUrl(photoUrl);
    } catch (err) {
      console.error('GetPlacePhoto failed:', err?.response?.data || err.message || err);
    }
  }
  const estimatedCost =
    trip?.tripData?.estimatedCostInr?.totalEstimatedCostInr ||
    trip?.tripData?.estimatedCostInr?.total ||
    trip?.tripData?.estimatedCost?.totalEstimatedCostInr ||
    trip?.tripData?.estimatedCost?.total ||
    'N/A';

  const dateRange = trip?.userSelection?.startDate && trip?.userSelection?.endDate
    ? `${trip?.userSelection?.startDate} to ${trip?.userSelection?.endDate}`
    : 'Dates not provided';

  const weatherOverview = trip?.tripData?.weatherOverview || {};
  const weatherSummary = trip?.userSelection?.weatherSummary || trip?.tripData?.weatherSummary || 'Weather context unavailable';

  const weatherChips = [
    { label: 'Condition', value: weatherOverview?.condition || 'N/A' },
    { label: 'Temp Range', value: weatherOverview?.tempRange || 'N/A' },
    { label: 'Rain Chance', value: weatherOverview?.rainChance || 'N/A' },
  ];

  return (
    <div className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_24px_60px_-26px_rgba(15,23,42,0.4)] ring-1 ring-indigo-100/60 sm:rounded-3xl'>
      <div className='relative'>
        <img
          src={photoUrl}
          alt='Trip destination'
          className='h-65 w-full object-cover object-center transition-transform duration-700 hover:scale-[1.03] sm:h-85 lg:h-105'
          style={{ imageRendering: 'auto' }}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = image;
          }}
        />
        <div className='absolute inset-0 bg-linear-to-t from-slate-950/65 via-slate-900/25 to-transparent' />
        <div className='absolute bottom-3 left-3 right-3 sm:bottom-5 sm:left-5 sm:right-5'>
          <h2 className='line-clamp-2 text-xl font-extrabold text-white drop-shadow sm:text-3xl lg:text-4xl'>{trip?.userSelection?.location?.label || 'Your trip destination'}</h2>
          <div className='mt-2 flex flex-wrap gap-1.5 text-xs sm:mt-3 sm:gap-2 sm:text-sm'>
            <span className='rounded-full border border-white/40 bg-white/20 px-2.5 py-1 font-semibold text-white backdrop-blur-md sm:px-3'>
              {trip?.userSelection?.noOfDays || 'N/A'} Days
            </span>
            <span className='max-w-full truncate rounded-full border border-white/40 bg-white/20 px-2.5 py-1 font-semibold text-white backdrop-blur-md sm:px-3'>
              {dateRange}
            </span>
            <span className='rounded-full border border-white/40 bg-white/20 px-2.5 py-1 font-semibold text-white backdrop-blur-md sm:px-3'>
              Travelers: {trip?.userSelection?.travelers || 'N/A'}
            </span>
            <span className='rounded-full border border-white/40 bg-white/20 px-2.5 py-1 font-semibold text-white backdrop-blur-md sm:px-3'>
              Budget: {trip?.userSelection?.budget || 'N/A'}
            </span>
            <span className='rounded-full border border-white/40 bg-white/20 px-2.5 py-1 font-semibold text-white backdrop-blur-md sm:px-3'>
              Estimated: {estimatedCost === 'N/A' ? 'N/A' : `INR ${estimatedCost}`}
            </span>
          </div>
        </div>
      </div>
   
      <div className='space-y-4 p-4 sm:p-5'>
        <div className='flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center sm:gap-4'>
          <p className='text-sm text-slate-600'>Weather note: {weatherSummary}</p>
          <button className='w-full rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-100 hover:shadow-sm sm:w-auto'>
            Share Trip
          </button>
        </div>

        <div className='grid grid-cols-1 gap-2 sm:grid-cols-3'>
          {weatherChips.map((chip) => (
            <div key={chip.label} className='rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2'>
              <p className='text-[11px] font-semibold uppercase tracking-wide text-slate-500'>{chip.label}</p>
              <p className='mt-1 text-sm font-bold text-slate-800'>{chip.value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InformationSection