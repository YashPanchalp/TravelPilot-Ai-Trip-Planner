import React from 'react';
import { Clock, MapPin, Users } from 'lucide-react';

function FlightDetailsPanel({ flight, type = 'outbound', isSelected = false }) {
  if (!flight) return null;

  const formatDuration = (minutes) => {
    if (!minutes) return 'N/A';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getStopsText = (stops) => {
    if (!stops) return 'Non-stop';
    if (stops === 1) return '1 Stop';
    return `${stops} Stops`;
  };

  return (
    <div className='rounded-xl bg-linear-to-br from-white to-slate-50 overflow-hidden hover:shadow-lg shadow-[0_8px_24px_-12px_rgba(0,0,0,0.1)] transition-shadow'>
      <div className='p-5 sm:p-6'>
        {/* Top Section - Airline & Price */}
        <div className='flex items-center justify-between mb-6'>
          <div className='flex items-center gap-4'>
            {flight.airlines?.[0]?.logo && (
              <img
                src={flight.airlines[0].logo}
                alt={flight.airlines[0]?.name}
                className='h-14 w-14 object-contain rounded-lg bg-slate-100 p-2'
              />
            )}
            <div>
              <p className='font-bold text-slate-900 text-lg'>
                {flight.airlines?.[0]?.name || 'Airline'}
              </p>
              <p className='text-sm text-slate-600'>
                {flight.duration ? formatDuration(flight.duration) : 'Duration N/A'}
              </p>
            </div>
          </div>
          <div className='text-right'>
            <p className='text-3xl font-extrabold text-emerald-600'>
              ₹ {Number.parseInt(flight.price || 0).toLocaleString('en-IN')}
            </p>
            <p className='text-xs text-slate-600 mt-1 font-semibold'>
              {getStopsText(flight.stops)}
            </p>
          </div>
        </div>

        {/* Main Flight Timeline */}
        <div className='flex items-center justify-between mb-6 py-4 bg-linear-to-r from-indigo-50 to-blue-50 rounded-lg px-4'>
          <div className='text-center'>
            <p className='text-2xl font-bold text-slate-900'>
              {flight.departureTime || 'N/A'}
            </p>
            <p className='text-xs font-bold text-indigo-700 mt-2'>
              {flight.departureAirportCode || 'CODE'}
            </p>
            <p className='text-xs text-slate-600 mt-0.5 font-semibold'>
              {flight.departureAirport?.split(',')[0] || 'Airport'}
            </p>
          </div>

          <div className='flex-1 px-6'>
            <div className='flex items-center gap-2 justify-center'>
              <div className='h-1 flex-1 bg-linear-to-r from-indigo-300 to-blue-300 rounded' />
              <Clock size={18} className='text-indigo-500' />
              <div className='h-1 flex-1 bg-linear-to-r from-blue-300 to-indigo-300 rounded' />
            </div>
            <p className='text-xs text-center text-slate-600 mt-2 font-semibold'>
              {flight.duration ? formatDuration(flight.duration) : 'N/A'}
            </p>
          </div>

          <div className='text-center'>
            <p className='text-2xl font-bold text-slate-900'>
              {flight.arrivalTime || 'N/A'}
            </p>
            <p className='text-xs font-bold text-indigo-700 mt-2'>
              {flight.arrivalAirportCode || 'CODE'}
            </p>
            <p className='text-xs text-slate-600 mt-0.5 font-semibold'>
              {flight.arrivalAirport?.split(',')[0] || 'Airport'}
            </p>
          </div>
        </div>

        {/* Flight Details - Quick Info */}
        <div className='border-t border-slate-200 pt-5 grid grid-cols-3 gap-3 mb-5'>
          <div className='text-center rounded-lg bg-blue-50 p-3'>
            <p className='text-xs text-slate-600 font-bold uppercase tracking-wider'>Stops</p>
            <p className='text-slate-900 font-bold mt-1 text-sm'>
              {getStopsText(flight.stops)}
            </p>
          </div>
          <div className='text-center rounded-lg bg-purple-50 p-3'>
            <p className='text-xs text-slate-600 font-bold uppercase tracking-wider'>Class</p>
            <p className='text-slate-900 font-bold mt-1 text-sm'>Economy</p>
          </div>
          <div className='text-center rounded-lg bg-emerald-50 p-3'>
            <p className='text-xs text-slate-600 font-bold uppercase tracking-wider'>Type</p>
            <p className='text-slate-900 font-bold mt-1 text-sm'>
              {type === 'outbound' ? 'Outbound' : 'Return'}
            </p>
          </div>
        </div>

        {/* Legs Display (if available) */}
        {flight.legs && flight.legs.length > 0 && (
          <div className='border-t border-slate-200 mt-5 pt-5'>
            <p className='text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider'>
              {flight.legs.length === 1 ? '✈️ Non-stop' : `${flight.legs.length} Stops`}
            </p>
            {flight.legs.map((leg, idx) => (
              <div key={idx} className='mb-3 last:mb-0 p-4 bg-linear-to-r from-slate-50 to-blue-50 rounded-lg shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]'>
                <div className='flex justify-between items-center'>
                  <div>
                    <p className='text-xs font-bold text-slate-900 mb-1'>
                      {leg.departure_time} → {leg.arrival_time}
                    </p>
                    <p className='text-xs text-slate-600 font-medium'>
                      {leg.departure_airport} → {leg.arrival_airport}
                    </p>
                  </div>
                  <p className='text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full'>
                    {leg.duration ? formatDuration(leg.duration) : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default FlightDetailsPanel;


