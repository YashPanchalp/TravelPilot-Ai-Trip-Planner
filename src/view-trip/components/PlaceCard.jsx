import React from 'react'
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/service/GlobalAPI';
import image from '../../assets/image.png'

function PlaceCard({place, themeColor = null}) {
  const [photoUrl, setPhotoUrl] = useState(place?.placeImageUrl || image);

  // Default theme if none provided
  const theme = themeColor || {
    bg: 'from-slate-50 to-slate-100',
    text: 'text-slate-900',
    light: 'bg-slate-100/40',
    accent: 'bg-slate-500'
  };

  const formatInr = (value) => {
    if (!value) return 'INR N/A';
    const text = String(value).trim();
    if (text.toUpperCase().includes('INR')) return text;
    return `INR ${text.replaceAll('$', '').trim()}`;
  };

  useEffect(() => {
    if (!place) {
      return;
    }

    setPhotoUrl(place?.placeImageUrl || image);
    GetPlacePhoto();
  }, [place]);

  const GetPlacePhoto = async () => {
    const locationLabel = place?.placeName;

    if (!locationLabel) {
      return;
    }

    try {
      const res = await GetPlaceDetails({ textQuery: locationLabel });
      const photoRef = res?.data?.places?.[0]?.photos?.[0]?.name;

      if (!photoRef) {
        return;
      }

      const placePhotoUrl = PHOTO_REF_URL.replace('{NAME}', photoRef);
      setPhotoUrl(placePhotoUrl);
    } catch (err) {
      console.error('GetPlacePhoto failed:', err?.response?.data || err.message || err);
    }
  };

  return (
    <Link to={'https://www.google.com/maps/search/?api=1&query=' + place?.placeName + ' ' + place?.placeAddress} target="_blank" rel="noopener noreferrer">
    <div className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-gradient-to-br ${theme.bg} shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] sm:rounded-3xl`}>

        <div className='relative aspect-[4/3] w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-[16/10]'>
          <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent z-10'></div>
          <img
            src={photoUrl}
            alt={place?.placeName || 'Place'}
            className='h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.07]'
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = image;
            }}
          />
          <div className='absolute bottom-3 left-3 right-3 z-20'>
             <h2 className='line-clamp-2 text-lg font-bold leading-tight text-white drop-shadow-md sm:text-xl'>
               {place?.placeName}
             </h2>
          </div>
        </div>

        <div className='flex flex-1 flex-col justify-between space-y-2 p-3 sm:p-4'>
            <p className={`line-clamp-2 text-xs font-semibold leading-snug ${theme.text}`}>
              {place?.placeDetails}
            </p>
            
            <div className='flex flex-wrap items-center gap-2'>
              {place?.timeToTravel && (
                <div className={`flex items-center gap-1.5 rounded-lg ${theme.light} px-2.5 py-1.5 text-xs font-semibold ${theme.text} transition-colors group-hover:opacity-80`}>
                  <span>🚕</span>
                  <span>{place.timeToTravel}</span>
                </div>
              )}
              {place?.ticketPricing && (
                <div className={`flex items-center gap-1.5 rounded-lg ${theme.light} px-2.5 py-1.5 text-xs font-semibold ${theme.text} transition-colors group-hover:opacity-80`}>
                  <span>🎟️</span>
                  <span>{formatInr(place.ticketPricing)}</span>
                </div>
              )}
            </div>
            
            <div className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl ${theme.light} py-2.5 text-sm font-semibold ${theme.text} transition-all duration-300 hover:opacity-70`}>
              View on Map
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </div>
        </div>
    </div>
   </Link>
  )
}

export default PlaceCard