import React from 'react'
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/service/GlobalAPI';
import image from '../../assets/image.png'
import { ArrowUpRight, MapPinned, Sparkles, Star, TimerReset, Wallet } from 'lucide-react'

function PlaceCard({place, themeColor: _themeColor = null, periodLabel, categoryLabel, ratingLabel}) {
  const [photoUrl, setPhotoUrl] = useState(place?.placeImageUrl || image);

  const formatInr = (value) => {
    if (!value) return 'INR N/A';
    const text = String(value).trim();
    if (text.toUpperCase().includes('INR')) return text;
    return `INR ${text.replaceAll('$', '').trim()}`;
  };

  const rating = ratingLabel || place?.rating || '4.8';
  const category = categoryLabel || place?.category || (place?.ticketPricing ? 'Sightseeing' : 'Experience');

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

  useEffect(() => {
    if (!place) {
      return;
    }

    setPhotoUrl(place?.placeImageUrl || image);
    GetPlacePhoto();
  }, [place]);

  return (
    <Link to={'https://www.google.com/maps/search/?api=1&query=' + place?.placeName + ' ' + place?.placeAddress} target="_blank" rel="noopener noreferrer">
    <article className='group flex h-full min-h-112 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_50px_-30px_rgba(15,23,42,0.35)]'>

        <div className='relative aspect-4/3 w-full shrink-0 overflow-hidden bg-slate-100 sm:aspect-16/10'>
          <div className='absolute inset-0 bg-linear-to-t from-slate-950/70 via-slate-950/18 to-transparent z-10'></div>
          <img
            src={photoUrl}
            alt={place?.placeName || 'Place'}
            className='h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-[1.08]'
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = image;
            }}
          />
          <div className='absolute left-4 top-4 z-20 flex flex-wrap gap-2'>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm'>
              <Sparkles className='h-3.5 w-3.5 text-indigo-600' />
              {periodLabel || place?.timeToVisit || 'Planned stop'}
            </span>
            <span className='inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/90 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm'>
              <Star className='h-3.5 w-3.5 text-amber-500' />
              {rating}
            </span>
          </div>
          <div className='absolute bottom-4 left-4 right-4 z-20'>
             <h2 className='line-clamp-2 text-xl font-semibold leading-tight text-white drop-shadow-sm'>
               {place?.placeName}
             </h2>
             <p className='mt-1 line-clamp-1 text-sm text-white/80'>
               {category}
             </p>
          </div>
        </div>

        <div className='flex flex-1 flex-col gap-4 p-4 sm:p-5'>
            <p className='line-clamp-3 text-sm leading-6 text-slate-600'>
              {place?.placeDetails}
            </p>
            
            <div className='grid grid-cols-2 gap-2'>
              <div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
                <TimerReset className='h-4 w-4 text-indigo-600' />
                <span>{place?.timeToTravel || place?.time || 'Flexible'}</span>
              </div>
              <div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
                <Wallet className='h-4 w-4 text-indigo-600' />
                <span>{place?.ticketPricing ? formatInr(place.ticketPricing) : 'INR N/A'}</span>
              </div>
              <div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
                <MapPinned className='h-4 w-4 text-indigo-600' />
                <span>{place?.timeToVisit || 'Day trip'}</span>
              </div>
              <div className='flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700'>
                <Star className='h-4 w-4 text-amber-500' />
                <span>{rating}</span>
              </div>
            </div>
            
            <div className='mt-auto inline-flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition-all duration-300 group-hover:bg-indigo-600'>
              <span className='inline-flex items-center gap-2'>
                View on Map
              </span>
              <ArrowUpRight className='h-4 w-4' />
            </div>
        </div>
    </article>
   </Link>
  )
}

export default PlaceCard