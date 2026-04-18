import React from 'react'
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/service/GlobalAPI';
import image from '../../assets/image.png'

function PlaceCard({place}) {
  const [photoUrl, setPhotoUrl] = useState(place?.placeImageUrl || image);

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
    <div className='group overflow-hidden rounded-xl bg-white shadow-[0_8px_24px_-12px_rgba(15,23,42,0.15)] transition-all duration-500 transform-gpu hover:-translate-y-1 hover:rotate-[0.25deg] hover:shadow-[0_16px_40px_-16px_rgba(79,70,229,0.2)] sm:rounded-2xl'>

        <div className='relative aspect-4/3 w-full overflow-hidden bg-slate-100 sm:aspect-video'>
          <img
            src={photoUrl}
            alt={place?.placeName || 'Place'}
            className='h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.04]'
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = image;
            }}
          />
        </div>
        <div className='min-w-0 space-y-3 p-3.5 sm:p-4'>
            <h2 className='line-clamp-2 wrap-break-word text-base font-extrabold text-slate-900 sm:text-lg'>📍 {place?.placeName}</h2>
            <h3 className='line-clamp-3 text-sm text-slate-600'>📝 {place?.placeDetails}</h3>
            <div className='flex flex-wrap gap-2'>
              <h3 className='rounded-full bg-orange-100/70 px-3 py-1 text-xs font-semibold text-orange-700 shadow-[0_2px_6px_-3px_rgba(251,146,60,0.15)]'>
                🚕 Travel: {place?.timeToTravel || 'N/A'}
              </h3>
              <h3 className='rounded-full bg-rose-100/70 px-3 py-1 text-xs font-semibold text-rose-700 shadow-[0_2px_6px_-3px_rgba(244,63,94,0.15)]'>
                🎟️ Ticket: {formatInr(place?.ticketPricing)}
              </h3>
            </div>
            <button className='w-full rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 transition-all duration-300 hover:bg-slate-100 hover:shadow-[0_4px_12px_-6px_rgba(0,0,0,0.08)] sm:w-auto'>
              View Location Details ↗
            </button>
        </div>
    </div>
   </Link>
  )
}

export default PlaceCard