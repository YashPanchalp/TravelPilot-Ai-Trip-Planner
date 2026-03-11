import React from 'react'
import { Link } from 'react-router-dom';
import { useEffect } from 'react';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/service/GlobalAPI';
import { useState } from 'react';
import image from '../../assets/image.png'



function HotelCardItem({hotel}) {

  const formatInr = (value) => {
    if (!value) return 'INR N/A';
    const text = String(value).trim();
    if (text.toUpperCase().includes('INR')) return text;
    return `INR ${text.replaceAll('$', '').trim()}`;
  };

  //same for fetch the photo of hotel
  const [photoUrl, setPhotoUrl] = useState(hotel?.hotelImageUrl || image);
    //set real img when have trip info
    useEffect(() => {
      if (!hotel) {
        return;
      }

      setPhotoUrl(hotel?.hotelImageUrl || image);
      GetPlacePhoto();
    }, [hotel])
    //func
    const GetPlacePhoto = async() => {
      const locationLabel = [hotel?.hotelName, hotel?.hotelAddress].filter(Boolean).join(' ');
  
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

          const placePhotoUrl = PHOTO_REF_URL.replace('{NAME}', photoRef);
          setPhotoUrl(placePhotoUrl);
      } catch (err) {
        console.error('GetPlacePhoto failed:', err?.response?.data || err.message || err);
      }
    }
  return (
    <article className='group h-full'>
        <Link
            to={'https://www.google.com/maps/search/?api=1&query=' + hotel?.hotelName}
            target="_blank"
            rel="noopener noreferrer"
        >
        <div className='flex h-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[0_20px_46px_-24px_rgba(15,23,42,0.36)] transition-all duration-500 transform-gpu hover:-translate-y-1 hover:rotate-[0.25deg] hover:shadow-[0_30px_70px_-28px_rgba(79,70,229,0.45)] sm:rounded-2xl'>
            <div className='relative'>
            <img
              src={photoUrl}
              alt={hotel?.hotelName || 'Hotel'}
              className='h-48 w-full object-cover transition-transform duration-700 group-hover:scale-[1.06] sm:h-56'
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = image;
              }}
            />
            <div className='absolute inset-0 bg-linear-to-t from-slate-900/60 via-slate-800/10 to-transparent' />
            <div className='absolute left-3 top-3 rounded-full border border-white/50 bg-white/20 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur sm:left-4 sm:top-4 sm:px-3 sm:text-xs'>✨ Top Stay Pick</div>
            </div>

            <div className='flex flex-1 min-w-0 flex-col gap-3 p-4 sm:p-5'>
            <h3 className='line-clamp-2 wrap-break-word text-lg font-extrabold text-slate-900 sm:text-xl'>🏨 {hotel?.hotelName}</h3>
            <h3 className='line-clamp-2 wrap-break-word text-sm text-slate-500'>📍 {hotel?.hotelAddress}</h3>
            <p className='line-clamp-3 text-sm leading-relaxed text-slate-600'>{hotel?.description}</p>

            <div className='flex flex-wrap gap-2'>
              <span className='rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>
                💰 Price: {formatInr(hotel?.price)}
              </span>
              <span className='rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700'>
                ⭐ Rating: {hotel?.rating || 'N/A'}
              </span>
            </div>

            <span className='mt-auto inline-flex w-fit rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors duration-300 group-hover:bg-indigo-50 group-hover:text-indigo-700'>
              View On Map ↗
            </span>
            </div>
        </div>
        </Link>

    </article>
  )
}

export default HotelCardItem