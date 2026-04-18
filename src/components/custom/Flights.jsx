import React, { useEffect, useState } from 'react';
import { AiOutlineLoading3Quarters } from 'react-icons/ai';
import { toast } from 'sonner';
import { fetchFlights, parseFlightResults } from '@/service/FlightsAPI';
import FlightCard from './FlightCard';
import FlightDetailsPanel from './FlightDetailsPanel';
import { AlertCircle, Plane } from 'lucide-react';

/**
 * Parse a single flight item from SerpAPI response
 */
const parseSingleFlight = (flight) => {
  try {
    if (!flight) return null;

    const legs = flight?.flights || [];
    if (legs.length === 0) return null;

    const firstLeg = legs[0];
    const lastLeg = legs[legs.length - 1];

    return {
      id: flight?.id || Math.random().toString(36),
      price: flight?.price || 'N/A',
      duration: flight?.total_duration || 'N/A',
      airline: firstLeg?.airline || 'N/A',
      airlines: legs.map((leg) => ({
        name: leg?.airline || 'N/A',
        logo: leg?.airline_logo || '',
      })),
      departureTime: firstLeg?.departure_airport?.time || 'N/A',
      arrivalTime: lastLeg?.arrival_airport?.time || 'N/A',
      departureAirport: firstLeg?.departure_airport?.name || firstLeg?.departure_airport?.id || 'N/A',
      departureAirportCode: firstLeg?.departure_airport?.id || 'N/A',
      arrivalAirport: lastLeg?.arrival_airport?.name || lastLeg?.arrival_airport?.id || 'N/A',
      arrivalAirportCode: lastLeg?.arrival_airport?.id || 'N/A',
      stops: flight?.layovers?.length || 0,
      isRoundtrip: legs.length > 1,
      legs: legs.map((leg) => ({
        airline: leg?.airline || 'N/A',
        departure_time: leg?.departure_airport?.time || 'N/A',
        arrival_time: leg?.arrival_airport?.time || 'N/A',
        departure_airport: leg?.departure_airport?.id || 'N/A',
        arrival_airport: leg?.arrival_airport?.id || 'N/A',
        duration: leg?.duration || 'N/A',
        airplane: leg?.airplane || 'N/A',
      })),
      layovers: flight?.layovers || [],
      bookingToken: flight?.booking_token || null,
      rawData: flight,
    };
  } catch (error) {
    console.error('Error parsing flight item:', error, flight);
    return null;
  }
};

function Flights({ tripData, userSelection, onFlightSelect, selectedOutbound: externalSelectedOutbound, selectedReturn: externalSelectedReturn }) {
  const [loading, setLoading] = useState(false);
  const [outboundFlights, setOutboundFlights] = useState([]);
  const [returnFlights, setReturnFlights] = useState([]);
  const [selectedOutbound, setSelectedOutbound] = useState(externalSelectedOutbound || null);
  const [selectedReturn, setSelectedReturn] = useState(externalSelectedReturn || null);
  const [error, setError] = useState(null);
  const [viewingFlightDetails, setViewingFlightDetails] = useState(null);
  const [lastSearchKey, setLastSearchKey] = useState(null);
  const requestRef = React.useRef(null);
  const lastProcessedFlightsRef = React.useRef(null);

  useEffect(() => {
    // Create a search key to prevent duplicate requests
    if (tripData) {
      const searchKey = `${userSelection?.source?.label || userSelection?.source}-${userSelection?.location?.label || userSelection?.location}-${userSelection?.startDate}`;
      
      // Only fetch if this is a new search
      if (searchKey !== lastSearchKey && !loading) {
        setLastSearchKey(searchKey);
        // Cancel previous request if still pending
        if (requestRef.current) {
          requestRef.current.cancel = true;
        }
        fetchFlightData();
      }
    }
  }, [tripData, lastSearchKey, loading, userSelection]);

  // Automatically add flights to expenses when both are selected (only once per selection)
  useEffect(() => {
    if (selectedOutbound && selectedReturn) {
      // Create a key from flight IDs to track if this is a new selection
      const flightKey = `${selectedOutbound?.id}-${selectedReturn?.id}`;
      
      // Only call onFlightSelect if this is a new flight combination
      if (flightKey !== lastProcessedFlightsRef.current) {
        lastProcessedFlightsRef.current = flightKey;
        onFlightSelect?.(selectedOutbound, selectedReturn);
      }
    }
  }, [selectedOutbound, selectedReturn, onFlightSelect]);

  const fetchFlightData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Extract raw source and destination from userSelection
      const rawSource = userSelection?.source?.label || userSelection?.source;
      const rawDestination = userSelection?.location?.label || userSelection?.location;
      const startDate = userSelection?.startDate;
      const endDate = userSelection?.endDate;

      console.log('📍 Trip Selection Data:', {
        rawSource,
        rawDestination,
        startDate,
        endDate,
        travelers: userSelection?.travelers,
      });

      if (!rawSource) {
        const errorMsg = 'Source location not found. Please go back and select a source.';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      if (!rawDestination || !startDate || !endDate) {
        const errorMsg = 'Missing trip details. Please go back and ensure all fields are filled.';
        setError(errorMsg);
        toast.error(errorMsg);
        setLoading(false);
        return;
      }

      console.log('🛫 Fetching flights with separate outbound and return calls...');

      // SEPARATE API CALL 1: Outbound flights (source -> destination)
      console.log('📍 Call 1: Fetching outbound flights (', rawSource, '→', rawDestination, 'on', startDate, ')');
      const outboundResponse = await fetchFlights({
        departure: rawSource,
        arrival: rawDestination,
        outbound_date: startDate,
        currency: 'INR',
        adults: Number.parseInt(userSelection?.travelers) || 1,
      });

      if (!outboundResponse.success) {
        setError(outboundResponse.error || 'Failed to fetch outbound flights');
        toast.error(outboundResponse.error || 'Failed to fetch outbound flights');
        setLoading(false);
        return;
      }

      const outboundFlightsData = outboundResponse.data?.best_flights || [];
      console.log('✈️ Outbound Response - Found', outboundFlightsData.length, 'flights');

      // Add delay to prevent rate limiting (429 errors)
      console.log('⏳ Waiting 2 seconds before return flight request...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // SEPARATE API CALL 2: Return flights (destination -> source, REVERSED)
      console.log('📍 Call 2: Fetching return flights (', rawDestination, '→', rawSource, 'on', endDate, ')');
      const returnResponse = await fetchFlights({
        departure: rawDestination, // SWAPPED
        arrival: rawSource, // SWAPPED
        outbound_date: endDate,
        currency: 'INR',
        adults: Number.parseInt(userSelection?.travelers) || 1,
      });

      if (!returnResponse.success) {
        console.warn('⚠️ Return flights fetch failed, continuing with outbound only');
        // Don't fail completely, just proceed with outbound
      }

      const returnFlightsData = returnResponse.success ? (returnResponse.data?.best_flights || []) : [];
      console.log('✈️ Return Response - Found', returnFlightsData.length, 'flights');

      // Parse both responses separately
      console.log('🔄 Parsing flights...');
      const outboundParsed = (outboundFlightsData || [])
        .slice(0, 10)
        .map(flight => {
          try {
            return parseSingleFlight(flight);
          } catch (err) {
            console.error('Error parsing outbound flight:', err);
            return null;
          }
        })
        .filter(f => f !== null);

      const returnParsed = (returnFlightsData || [])
        .slice(0, 10)
        .map(flight => {
          try {
            return parseSingleFlight(flight);
          } catch (err) {
            console.error('Error parsing return flight:', err);
            return null;
          }
        })
        .filter(f => f !== null);

      console.log('✅ Parsing Complete:', {
        outboundParsed: outboundParsed.length,
        returnParsed: returnParsed.length,
      });

      setOutboundFlights(outboundParsed);
      setReturnFlights(returnParsed);

      if (outboundParsed.length > 0) {
        setSelectedOutbound(outboundParsed[0]);
      }

      if (returnParsed.length > 0) {
        setSelectedReturn(returnParsed[0]);
      }

      if (outboundParsed.length === 0 && returnParsed.length === 0) {
        toast.error('No flights found for your search');
      } else {
        toast.success(`Found ${outboundParsed.length} outbound & ${returnParsed.length} return flights!`);
      }
    } catch (err) {
      console.error('Error fetching flights:', err);
      setError(err?.message || 'An error occurred while fetching flights');
      toast.error(err?.message || 'Failed to fetch flights');
    } finally {
      setLoading(false);
    }
  };

  const source = userSelection?.source?.label || userSelection?.source || 'Source';
  const destination = userSelection?.location?.label || userSelection?.location || 'Destination';
  const startDate = userSelection?.startDate;
  const endDate = userSelection?.endDate;

  return (
    <div className='relative min-h-screen overflow-hidden bg-linear-to-b from-slate-50 via-white to-indigo-50/35 px-3 py-8 sm:px-6 md:px-8 lg:px-10 xl:px-12'>
      <div className='pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-48 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl' />
      <div className='pointer-events-none absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl' />

      <div className='relative space-y-8'>
        {/* Header Section */}
        <div className='rounded-3xl border border-slate-200 bg-linear-to-br from-white via-blue-50 to-indigo-50 p-6 shadow-lg backdrop-blur-sm'>
          <div className='mb-6 flex items-center gap-4'>
            <div className='flex h-14 w-14 items-center justify-center rounded-2xl bg-linear-to-br from-indigo-500 to-violet-500 shadow-lg'>
              <Plane className='text-white' size={28} />
            </div>
            <div>
              <h2 className='text-3xl font-extrabold text-slate-900'>
                Flight Booking
              </h2>
              <p className='text-sm text-slate-600 mt-1'>Select your perfect flights</p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-3 sm:grid-cols-4'>
            <div className='rounded-xl bg-linear-to-br from-indigo-50 to-blue-50 p-4 border border-indigo-100'>
              <p className='text-xs font-bold text-indigo-700 uppercase tracking-wider'>From</p>
              <p className='mt-2 text-lg font-bold text-slate-900'>{source}</p>
            </div>
            <div className='rounded-xl bg-linear-to-br from-purple-50 to-pink-50 p-4 border border-purple-100'>
              <p className='text-xs font-bold text-purple-700 uppercase tracking-wider'>To</p>
              <p className='mt-2 text-lg font-bold text-slate-900'>{destination}</p>
            </div>
            <div className='rounded-xl bg-linear-to-br from-emerald-50 to-teal-50 p-4 border border-emerald-100'>
              <p className='text-xs font-bold text-emerald-700 uppercase tracking-wider'>Departure</p>
              <p className='mt-2 text-lg font-bold text-slate-900'>{startDate}</p>
            </div>
            <div className='rounded-xl bg-linear-to-br from-orange-50 to-amber-50 p-4 border border-orange-100'>
              <p className='text-xs font-bold text-orange-700 uppercase tracking-wider'>Return</p>
              <p className='mt-2 text-lg font-bold text-slate-900'>{endDate}</p>
            </div>
          </div>
        </div>

        {/* Error or Loading State */}
        {loading ? (
          <div className='flex flex-col items-center justify-center gap-4 rounded-2xl border border-slate-200 bg-white p-12'>
            <AiOutlineLoading3Quarters className='animate-spin text-4xl text-indigo-500' />
            <p className='text-lg font-semibold text-slate-700'>
              Finding the best flights for you...
            </p>
            <p className='text-sm text-slate-500'>
              This may take a moment as we search across multiple airlines
            </p>
          </div>
        ) : error ? (
          <div className='flex flex-col items-start gap-3 rounded-2xl border border-red-300 bg-red-50 p-6'>
            <div className='flex items-center gap-2'>
              <AlertCircle className='text-red-600' size={24} />
              <h3 className='font-semibold text-red-900'>Failed to load flights</h3>
            </div>
            <p className='text-sm text-red-700'>{error}</p>
            <button
              onClick={fetchFlightData}
              className='mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700'
            >
              Retry
            </button>
          </div>
        ) : (
          <>
            {/* Outbound Flights Section */}
            {outboundFlights.length > 0 && (
              <div className='relative space-y-4 rounded-3xl border border-slate-200 bg-linear-to-br from-white to-blue-50 p-6 shadow-lg backdrop-blur-sm'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100'>
                    <span className='text-lg'>🛫</span>
                  </div>
                  <div>
                    <h3 className='text-2xl font-bold text-slate-900'>
                      Outbound Flights
                    </h3>
                    <p className='text-xs text-slate-600'>
                      {source} → {destination} on {startDate}
                    </p>
                  </div>
                  <div className='ml-auto text-sm font-bold text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full'>
                    {outboundFlights.length} options
                  </div>
                </div>

                <div className='space-y-3'>
                  {outboundFlights.map((flight) => (
                    <div
                      key={flight.id}
                      onClick={() => setSelectedOutbound(flight)}
                      className={`rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        selectedOutbound?.id === flight.id
                          ? 'border-indigo-500 bg-indigo-50 shadow-lg'
                          : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                      }`}
                    >
                      <FlightCard
                        flight={flight}
                        type='outbound'
                        onClick={() => setSelectedOutbound(flight)}
                        isSelected={selectedOutbound?.id === flight.id}
                        onSelect={() => setSelectedOutbound(flight)}
                        onViewDetails={() => setViewingFlightDetails(flight)}
                      />
                    </div>
                  ))}
                </div>

                {selectedOutbound && (
                  <div className='rounded-lg border-2 border-emerald-300 bg-linear-to-r from-emerald-50 to-green-50 p-4'>
                    <p className='text-sm font-bold text-emerald-900'>
                      ✓ Selected: {selectedOutbound?.airline} • {Number.parseInt(selectedOutbound?.price || 0).toLocaleString('en-IN')} ₹
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Return Flights Section */}
            {endDate && (
              <div className='relative space-y-4 rounded-3xl border border-slate-200 bg-linear-to-br from-white to-violet-50 p-6 shadow-lg backdrop-blur-sm'>
                <div className='flex items-center gap-3 mb-2'>
                  <div className='h-10 w-10 flex items-center justify-center rounded-lg bg-violet-100'>
                    <span className='text-lg'>🛬</span>
                  </div>
                  <div>
                    <h3 className='text-2xl font-bold text-slate-900'>
                      Return Flights
                    </h3>
                    <p className='text-xs text-slate-600'>
                      {destination} → {source} on {endDate}
                    </p>
                  </div>
                  {returnFlights.length > 0 && (
                    <div className='ml-auto text-sm font-bold text-violet-600 bg-violet-100 px-3 py-1 rounded-full'>
                      {returnFlights.length} options
                    </div>
                  )}
                </div>

                {returnFlights.length > 0 ? (
                  <>
                    <div className='space-y-3'>
                      {returnFlights.map((flight) => (
                        <div
                          key={flight.id}
                          onClick={() => setSelectedReturn(flight)}
                          className={`rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                            selectedReturn?.id === flight.id
                              ? 'border-violet-500 bg-violet-50 shadow-lg'
                              : 'border-slate-200 hover:border-violet-300 hover:shadow-md'
                          }`}
                        >
                          <FlightCard
                            flight={flight}
                            type='return'
                            onClick={() => setSelectedReturn(flight)}
                            isSelected={selectedReturn?.id === flight.id}
                            onSelect={() => setSelectedReturn(flight)}
                            onViewDetails={() => setViewingFlightDetails(flight)}
                          />
                        </div>
                      ))}
                    </div>

                    {selectedReturn && (
                      <div className='rounded-lg border-2 border-emerald-300 bg-linear-to-r from-emerald-50 to-green-50 p-4'>
                        <p className='text-sm font-bold text-emerald-900'>
                          ✓ Selected: {selectedReturn?.airline} • {Number.parseInt(selectedReturn?.price || 0).toLocaleString('en-IN')} ₹
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className='rounded-xl border border-amber-300 bg-amber-50 p-6 text-center'>
                    <p className='text-sm text-amber-800'>
                      <span className='text-2xl mb-2 block'>🔍</span>
                      No return flights found. Check the browser console for details.
                    </p>
                  </div>
                )}
              </div>
            )}

            {outboundFlights.length === 0 && returnFlights.length === 0 && (
              <div className='rounded-2xl border border-amber-300 bg-amber-50 p-8 text-center'>
                <AlertCircle className='mx-auto mb-3 text-amber-600' size={32} />
                <p className='text-lg font-semibold text-amber-900'>
                  No flights found
                </p>
                <p className='mt-2 text-sm text-amber-700'>
                  Try adjusting your search criteria or dates
                </p>
              </div>
            )}
          </>
        )}

        {/* Summary Section */}
        {!loading && !error && (selectedOutbound || selectedReturn) && (
          <div className='rounded-3xl border border-slate-200 bg-linear-to-br from-indigo-50 via-white to-violet-50 p-6 shadow-lg backdrop-blur-sm'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-600 text-white'>
                <span className='text-lg'>📋</span>
              </div>
              <h3 className='text-2xl font-bold text-slate-900'>
                Trip Summary
              </h3>
            </div>
            <div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3'>
              {selectedOutbound && selectedReturn && (
                <div className='rounded-xl border-2 border-emerald-300 bg-linear-to-br from-emerald-50 to-green-50 p-5'>
                  <p className='text-xs font-bold text-emerald-700 uppercase tracking-wider mb-3'>
                    💰 Cost Summary
                  </p>
                  
                  <div className='space-y-2'>
                    <div className='flex justify-between items-center text-xs'>
                      <span className='text-slate-600'>Outbound</span>
                      <span className='font-semibold text-slate-800'>₹ {Number.parseInt(selectedOutbound?.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className='flex justify-between items-center text-xs'>
                      <span className='text-slate-600'>Return</span>
                      <span className='font-semibold text-slate-800'>₹ {Number.parseInt(selectedReturn?.price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className='border-t border-emerald-300 pt-2 flex justify-between items-center'>
                      <span className='text-xs font-bold text-emerald-700'>Round Trip Total</span>
                      <span className='text-lg font-extrabold text-emerald-600'>₹ {(Number.parseInt(selectedOutbound?.price || 0) + Number.parseInt(selectedReturn?.price || 0)).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Flight Details Panels */}
        {!loading && !error && selectedOutbound && (
          <div className='rounded-3xl border border-slate-200 bg-linear-to-br from-white to-indigo-50 p-6 shadow-lg backdrop-blur-sm'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-100'>
                <span className='text-lg'>✈️</span>
              </div>
              <h3 className='text-2xl font-bold text-slate-900'>
                Outbound Flight Details
              </h3>
            </div>
            <FlightDetailsPanel
              flight={selectedOutbound}
              type='outbound'
            />
          </div>
        )}

        {!loading && !error && selectedReturn && (
          <div className='rounded-3xl border border-slate-200 bg-linear-to-br from-white to-violet-50 p-6 shadow-lg backdrop-blur-sm'>
            <div className='flex items-center gap-3 mb-6'>
              <div className='h-10 w-10 flex items-center justify-center rounded-lg bg-violet-100'>
                <span className='text-lg'>🛬</span>
              </div>
              <h3 className='text-2xl font-bold text-slate-900'>
                Return Flight Details
              </h3>
            </div>
            <FlightDetailsPanel
              flight={selectedReturn}
              type='return'
            />
          </div>
        )}



        {/* Flight Details Modal */}
        {viewingFlightDetails && (
          <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4'>
            <div className='relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-slate-200 bg-white shadow-2xl'>
              {/* Close Button */}
              <button
                onClick={() => setViewingFlightDetails(null)}
                className='sticky top-4 right-4 float-right z-10 rounded-full bg-slate-100 hover:bg-slate-200 p-2 transition-all duration-200'
              >
                <svg className='w-5 h-5 text-slate-600' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
                  <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M6 18L18 6M6 6l12 12' />
                </svg>
              </button>

              {/* Details Content */}
              <div className='p-6 sm:p-8'>
                <h2 className='text-2xl font-extrabold text-slate-900 mb-6'>Flight Details</h2>
                <FlightDetailsPanel 
                  flight={viewingFlightDetails} 
                  type={viewingFlightDetails?.type || 'outbound'}
                  isSelected={
                    (selectedOutbound && selectedOutbound?.departureTime === viewingFlightDetails?.departureTime && selectedOutbound?.price === viewingFlightDetails?.price) ||
                    (selectedReturn && selectedReturn?.departureTime === viewingFlightDetails?.departureTime && selectedReturn?.price === viewingFlightDetails?.price)
                  }
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Flights;


