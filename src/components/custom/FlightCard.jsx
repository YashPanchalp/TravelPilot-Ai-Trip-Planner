import React from 'react';
import { Clock, MapPin, Plane, DollarSign, AlertCircle, Info } from 'lucide-react';

function FlightCard({ flight, type = 'outbound', onClick, isSelected = false, onSelect, onViewDetails }) {
  if (!flight) {
    return (
      <div className='flex items-center justify-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-700'>
        <AlertCircle size={20} />
        <span>Flight data not available</span>
      </div>
    );
  }

  const formatTime = (time) => {
    if (!time || time === 'N/A') return 'N/A';
    // Handle both "HH:MM" and timestamp formats
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    return time;
  };

  const formatDuration = (duration) => {
    if (!duration || duration === 'N/A') return 'N/A';
    if (typeof duration === 'number') {
      const hours = Math.floor(duration / 60);
      const minutes = duration % 60;
      return `${hours}h ${minutes}m`;
    }
    return duration;
  };

  const formatPrice = (price) => {
    if (!price || price === 'N/A') return 'Check price';
    if (typeof price === 'string') {
      return price;
    }
    return `₹${Number.parseInt(price || 0).toLocaleString('en-IN')}`;
  };

  const extractDate = (dateTime) => {
    if (!dateTime || dateTime === 'N/A') return 'N/A';
    return dateTime.split(' ')[0] || dateTime;
  };

  const extractTime = (dateTime) => {
    if (!dateTime || dateTime === 'N/A') return 'N/A';
    return dateTime.split(' ')[1] || dateTime;
  };

  const stops = flight?.stops || 0;
  const stopsText =
    stops === 0 ? 'Non-stop' : stops === 1 ? '1 stop' : `${stops} stops`;

  return (
    <div
      onClick={onClick}
      className={`group cursor-pointer rounded-xl p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
        isSelected
          ? 'bg-linear-to-br from-emerald-50 to-teal-50 shadow-[0_10px_28px_-14px_rgba(16,185,129,0.25)]'
          : 'bg-linear-to-br from-white to-slate-50 shadow-[0_4px_16px_-10px_rgba(0,0,0,0.08)]'
      }`}
    >
      <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
        {/* Left: Time & Duration */}
        <div className='flex flex-1 items-center gap-3'>
          <div className='flex flex-col'>
            <h4 className='text-lg font-bold text-slate-900'>
              {extractDate(flight?.departureTime)}
            </h4>
            <p className='text-lg font-bold text-emerald-600'>
              {extractTime(flight?.departureTime)}
            </p>
            <p className='text-xs text-slate-600 font-medium mt-1'>
              {flight?.departureAirport || 'Departure'}
            </p>
          </div>

          <div className='flex flex-1 flex-col items-center gap-1 px-2'>
            <p className='text-xs font-semibold text-slate-600 uppercase tracking-wide'>
              {stopsText}
            </p>
            <div className='flex w-full items-center gap-2'>
              <div className='h-1 flex-1 bg-linear-to-r from-slate-300 to-slate-200 rounded' />
              <Plane size={16} className='text-indigo-500 shrink-0' />
              <div className='h-1 flex-1 bg-linear-to-r from-slate-200 to-slate-300 rounded' />
            </div>
            <p className='text-xs font-semibold text-slate-700'>
              {formatDuration(flight?.duration)}
            </p>
          </div>

          <div className='flex flex-col text-right'>
            <h4 className='text-lg font-bold text-slate-900'>
              {extractDate(flight?.arrivalTime)}
            </h4>
            <p className='text-lg font-bold text-emerald-600'>
              {extractTime(flight?.arrivalTime)}
            </p>
            <p className='text-xs text-slate-600 font-medium mt-1'>
              {flight?.arrivalAirport || 'Arrival'}
            </p>
          </div>
        </div>

        {/* Middle: Airlines - Improved */}
        <div className='flex flex-col gap-2 border-l border-slate-200 pl-4 sm:pl-6 sm:border-l'>
          <p className='text-xs font-bold text-slate-600 uppercase tracking-wider'>Airline</p>
          <div className='flex gap-2 items-center'>
            {flight?.airlines && flight.airlines.length > 0 ? (
              flight.airlines.slice(0, 2).map((airline, i) => (
                <div
                  key={i}
                  className='flex items-center gap-1.5 rounded-lg bg-slate-100 px-3 py-2 shadow-[0_2px_6px_-3px_rgba(0,0,0,0.06)]'
                >
                  {airline?.logo ? (
                    <img
                      src={airline.logo}
                      alt={airline.name}
                      className='h-5 w-5 object-contain'
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : null}
                  <span className='text-xs font-bold text-slate-800'>
                    {airline?.name || flight?.airline}
                  </span>
                </div>
              ))
            ) : (
              <span className='text-xs font-bold text-slate-700'>
                {flight?.airline || 'N/A'}
              </span>
            )}
          </div>
        </div>

        {/* Right: Price - Highlighted */}
        <div className='flex flex-col items-end gap-3 border-l border-slate-200 pl-4 sm:pl-6'>
          <div className='flex items-center gap-1'>
            <p className='text-3xl font-extrabold text-emerald-600'>
              {formatPrice(flight?.price)}
            </p>
          </div>
          <div className='flex gap-2'>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.();
              }}
              className='rounded-lg bg-linear-to-r from-slate-400 to-slate-500 px-4 py-2 text-xs font-bold text-white shadow-md transition-all duration-200 hover:from-slate-500 hover:to-slate-600 hover:shadow-lg flex items-center gap-1'
            >
              <Info size={14} />
              Details
            </button>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onSelect?.();
              }}
              className={`rounded-lg px-5 py-2 text-xs font-bold shadow-md transition-all duration-200 ${
                isSelected
                  ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 hover:shadow-lg'
                  : 'bg-linear-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg'
              }`}
            >
              {isSelected ? '✓ Selected' : 'Select'}
            </button>
          </div>
        </div>
      </div>

      {/* Bottom info row */}
      <div className='mt-4 border-t border-slate-100 pt-3 flex justify-between items-center text-xs'>
        <span className='text-slate-600 font-medium'>
          {type === 'outbound' ? '🛫 Outbound Flight' : '🛬 Return Flight'}
        </span>
        <span className='text-slate-500'>
          {flight?.seats ? `${flight.seats} seats left` : 'Limited seats'}
        </span>
      </div>
    </div>
  );
}

export default FlightCard;


