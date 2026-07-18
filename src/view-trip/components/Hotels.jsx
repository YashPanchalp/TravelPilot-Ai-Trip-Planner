import React from 'react'
import HotelCardItem from './HotelCardItem';

function Hotels({trip, onHotelSelect, selectedHotel, noOfDays}) {
  const limitedHotels = (trip?.tripData?.hotels || []).slice(0, 6);

  return (
    <section className='rounded-2xl border border-slate-200 bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.12),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(99,102,241,0.12),transparent_45%),#ffffff] p-4 shadow-[0_26px_70px_-28px_rgba(15,23,42,0.42)] backdrop-blur sm:rounded-3xl sm:p-6'>
        <div className='mb-4 flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center'>
          <h2 className='text-xl font-extrabold text-slate-900 sm:text-2xl'>🏨 Premium Hotel Picks</h2>
          <span className='rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700'>
            {limitedHotels.length || 0} of {trip?.tripData?.hotels?.length || 0} stays
          </span>
        </div>

        <div className='grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3'>
            {limitedHotels.map((hotel, index) => (
            <HotelCardItem
              key={`${hotel?.hotelName || 'hotel'}-${hotel?.hotelAddress || 'address'}-${index}`}
              hotel={hotel}
              isSelected={selectedHotel?.hotelName === hotel?.hotelName}
              onSelect={() => onHotelSelect?.(hotel, noOfDays || 1)}
            />
            ))}
        </div>
    </section>
  )
}

export default Hotels