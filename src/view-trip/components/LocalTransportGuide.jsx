import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { getLocalTransportGuide } from '@/service/AIModel';
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { MapPin, Clock, DollarSign, Navigation2, ChevronRight, Zap } from 'lucide-react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig';

function LocalTransportGuide({ trip, selectedDay = 0, tripId }) {
  const [transportData, setTransportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState(selectedDay);
  const [selectedSegment, setSelectedSegment] = useState(0);
  const [expandedSegments, setExpandedSegments] = useState([]);
  const [animateRoute, setAnimateRoute] = useState(false);
  const [dayPlan, setDayPlan] = useState([]);
  const [isFromCache, setIsFromCache] = useState(false);

  useEffect(() => {
    if (trip?.tripData?.itinerary && trip?.userSelection?.location?.label) {
      const currentDayData = trip?.tripData?.itinerary?.[selectedDayIndex];
      setDayPlan(currentDayData?.plan || []);
      setExpandedSegments([]);
      loadOrGenerateTransportGuide();
    }
  }, [selectedDayIndex]);

  useEffect(() => {
    setAnimateRoute(true);
    const timer = setTimeout(() => setAnimateRoute(false), 100);
    return () => clearTimeout(timer);
  }, [selectedDayIndex, transportData]);

  // Save transport guide to Firebase
  const saveTransportGuideToDb = async (guideData) => {
    try {
      if (!tripId) return;

      // Initialize transportGuides array if it doesn't exist
      const transportGuides = trip?.transportGuides || {};
      transportGuides[`day_${selectedDayIndex}`] = {
        data: guideData,
        generatedAt: new Date().toISOString(),
      };

      // Update the trip document in Firebase
      const docRef = doc(db, 'AiTrips', tripId);
      await updateDoc(docRef, {
        transportGuides: transportGuides,
      });

      console.log(`✅ Transport guide for day ${selectedDayIndex + 1} saved to database`);
    } catch (error) {
      console.error('Failed to save transport guide to database:', error);
      // Don't show error toast to avoid annoying the user
    }
  };

  // Load or generate transport guide
  const loadOrGenerateTransportGuide = async () => {
    try {
      // Check if guide exists in cache
      const cachedGuide = trip?.transportGuides?.[`day_${selectedDayIndex}`];
      
      if (cachedGuide?.data) {
        // Load from cache
        console.log(`📦 Loading cached transport guide for day ${selectedDayIndex + 1}`);
        setTransportData(cachedGuide.data);
        setSelectedSegment(0);
        setIsFromCache(true);
        return;
      }

      // Generate new guide
      await generateTransportGuide();
    } catch (error) {
      console.error('Error loading transport guide:', error);
    }
  };

  const generateTransportGuide = async () => {
    setLoading(true);
    setIsFromCache(false);
    try {
      const dayData = trip?.tripData?.itinerary?.[selectedDayIndex];
      if (!dayData) {
        toast.error('No itinerary data for this day');
        setLoading(false);
        return;
      }

      const city = trip?.userSelection?.location?.label?.split(',')[0];
      const startTime = dayData?.plan?.[0]?.time || '08:00 AM';
      const date = trip?.userSelection?.startDate;

      console.log(`🔄 Generating new transport guide for day ${selectedDayIndex + 1}...`);

      const response = await getLocalTransportGuide({
        city,
        date,
        startTime,
        dayItinerary: dayData?.plan,
        hotelName: trip?.tripData?.hotels?.[0]?.hotelName || 'Hotel',
      });

      setTransportData(response);
      setSelectedSegment(0);

      // Save to database for future use
      await saveTransportGuideToDb(response);

      toast.success('Transport guide generated and saved!');
    } catch (error) {
      console.error('Failed to generate transport guide:', error);
      toast.error('Failed to generate transport guide');
      setTransportData(null);
    } finally {
      setLoading(false);
    }
  };

  const totalDays = trip?.tripData?.itinerary?.length || 1;

  // Get transport mode icon and color
  const getTransportIcon = (mode) => {
    if (!mode) return '🚗';
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes('walk') || lowerMode.includes('foot')) return '🚶';
    if (lowerMode.includes('bus') || lowerMode.includes('metro')) return '🚌';
    if (lowerMode.includes('auto') || lowerMode.includes('tuk')) return '🛺';
    if (lowerMode.includes('cab') || lowerMode.includes('taxi')) return '🚖';
    if (lowerMode.includes('bike') || lowerMode.includes('motorcycle')) return '🏍️';
    return '🚗';
  };

  const getTransportColor = (mode) => {
    if (!mode) return 'from-blue-50 to-blue-100';
    const lowerMode = mode.toLowerCase();
    if (lowerMode.includes('walk')) return 'from-green-50 to-emerald-100';
    if (lowerMode.includes('bus') || lowerMode.includes('metro')) return 'from-purple-50 to-purple-100';
    if (lowerMode.includes('auto') || lowerMode.includes('tuk')) return 'from-orange-50 to-orange-100';
    if (lowerMode.includes('cab') || lowerMode.includes('taxi')) return 'from-blue-50 to-cyan-100';
    return 'from-blue-50 to-blue-100';
  };

  const extractCost = (costStr) => {
    if (!costStr) return '₹0';
    const match = costStr.match(/₹([\d,-]+)/);
    return match ? `₹${match[1]}` : costStr;
  };

  // Toggle expansion of a segment's details
  const toggleSegmentExpansion = (idx) => {
    setExpandedSegments(prev => 
      prev.includes(idx) 
        ? prev.filter(i => i !== idx)
        : [...prev, idx]
    );
  };

  // Get the sequential place number for each item in dayPlan
  const getPlaceNumber = (index) => {
    // Count all non-meal, non-hotel places up to this index
    let placeCount = 0;
    for (let i = 0; i < dayPlan.length; i++) {
      const place = dayPlan[i];
      if (!place) continue;
      
      const name = (place?.placeName || '').toLowerCase();
      const time = place?.time || '';
      
      // Check if it's a meal or hotel
      const isMeal = name.includes('breakfast') || name.includes('lunch') || name.includes('dinner');
      const isHotel = name.includes('hotel');
      
      // Check time to determine meal
      let isMealByTime = false;
      const timeMatch = time.match(/(\d+):(\d+)/);
      if (timeMatch) {
        const hour = parseInt(timeMatch[1]);
        if ((hour >= 6 && hour < 11) || (hour >= 11 && hour < 16) || (hour >= 16 || hour < 6)) {
          isMealByTime = true;
        }
      }
      
      // If it's not a meal or hotel, count it
      if (!isMeal && !isHotel && !isMealByTime) {
        placeCount++;
      }
      
      if (i === index) break;
    }
    return placeCount;
  };

  // Determine place type from time or name
  const getPlaceType = (placeName, index) => {
    if (!placeName && !dayPlan[index]) return 'Stop';
    
    const name = (placeName || dayPlan[index]?.placeName || '').toLowerCase();
    
    // Check for meal types
    if (name.includes('breakfast')) return '🍳 Breakfast';
    if (name.includes('lunch')) return '🍽️ Lunch';
    if (name.includes('dinner')) return '🍴 Dinner';
    
    // Check time to determine meal type
    const time = dayPlan[index]?.time || '';
    const timeMatch = time.match(/(\d+):(\d+)/);
    if (timeMatch) {
      const hour = parseInt(timeMatch[1]);
      if (hour >= 6 && hour < 11) return '🍳 Breakfast';
      if (hour >= 11 && hour < 16) return '🍽️ Lunch';
      if (hour >= 16 || hour < 6) return '🍴 Dinner';
    }
    
    // Check if it's a hotel
    if (name.includes('hotel') || index === 0) return '🏨 Hotel';
    
    // Otherwise, it's a destination - get the place number
    const placeNum = getPlaceNumber(index);
    return `🎯 Place${placeNum}`;
  };

  // Get display name for a place in segment
  const getSegmentPlaceInfo = (placeName, segmentIndex) => {
    const placeType = getPlaceType(placeName, segmentIndex);
    const shortName = placeName?.split(' ').slice(0, 2).join(' ') || 'Stop';
    return { type: placeType, name: shortName };
  };

  return (
    <section className='w-full'>
      <div className='space-y-6 sm:space-y-8'>
        {/* Premium Header */}
        <div className='relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-700 to-teal-600 p-0 shadow-2xl'>
          {/* Background Pattern */}
          <div className='absolute inset-0 opacity-10'>
            <div className='absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -mr-48 -mt-48'></div>
            <div className='absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -ml-48 -mb-48'></div>
          </div>
          
          {/* Content */}
          <div className='relative p-6 sm:p-10 md:p-12 text-white'>
            <div className='max-w-2xl'>
              <div className='flex items-center gap-3 mb-3'>
                <div className='p-3 bg-white/20 backdrop-blur-md rounded-2xl'>
                  <Navigation2 className='w-6 h-6 sm:w-8 sm:h-8 text-white' />
                </div>
                <div className='flex flex-col gap-1'>
                  <span className='text-xs sm:text-sm font-bold uppercase tracking-widest text-white/80'>Smart Transportation</span>
                  {isFromCache && (
                    <span className='text-xs font-semibold text-green-200 flex items-center gap-1.5'>
                      <span className='inline-block w-2 h-2 bg-green-300 rounded-full animate-pulse'></span>
                      Loaded from cache
                    </span>
                  )}
                </div>
              </div>
              <h2 className='text-3xl sm:text-5xl md:text-6xl font-black mb-3 leading-tight'>
                Local Transport Guide
              </h2>
              <p className='text-base sm:text-lg text-blue-100/90 font-medium'>Optimized routes, real-time options & smart recommendations for every segment</p>
            </div>
          </div>
        </div>

        {/* Day Selector with Enhanced Styling */}
        <div className='flex flex-col gap-4'>
          <div className='flex items-center justify-between'>
            <label className='text-sm sm:text-base font-bold text-slate-900 uppercase tracking-widest'>📅 Select Day</label>
            <span className='text-xs sm:text-sm text-slate-500 font-semibold'>Day {selectedDayIndex + 1} of {totalDays}</span>
          </div>
          <div className='grid grid-cols-3 gap-2 sm:grid-cols-6 sm:gap-3'>
            {Array.from({ length: totalDays }, (_, i) => (
              <button
                key={i}
                onClick={() => {
                  setSelectedDayIndex(i);
                  setSelectedSegment(0);
                }}
                className={`group relative px-3 sm:px-4 py-3 rounded-2xl font-bold text-xs sm:text-sm transition-all duration-300 overflow-hidden ${
                  selectedDayIndex === i
                    ? 'bg-gradient-to-r from-blue-600 to-teal-600 text-white shadow-xl shadow-blue-500/30 scale-105 border border-white/30'
                    : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200 hover:border-blue-400 hover:shadow-lg'
                }`}
              >
                {selectedDayIndex === i && (
                  <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse'></div>
                )}
                <span className='relative block'>Day {i + 1}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className='flex flex-col items-center justify-center py-16 sm:py-24'>
            <div className='relative w-20 h-20 sm:w-28 sm:h-28 mb-6'>
              <div className='absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-teal-400 opacity-20 animate-pulse blur-xl'></div>
              <div className='absolute inset-2 rounded-full border-4 border-transparent border-t-blue-500 border-r-teal-400 animate-spin'></div>
              <AiOutlineLoading3Quarters className='absolute inset-0 w-full h-full text-blue-600 animate-spin opacity-50' />
            </div>
            <p className='text-base sm:text-lg text-slate-800 font-bold'>Generating transport guide...</p>
            <p className='text-sm text-slate-500 mt-2'>Finding best routes and options</p>
          </div>
        )}

        {/* Content */}
        {!loading && transportData && (
          <div className='space-y-6 sm:space-y-8'>
            {/* Route Visualization Card */}
            <div className='rounded-3xl bg-gradient-to-br from-white to-blue-50/40 border border-slate-200/50 shadow-lg overflow-hidden'>
              <div className='p-6 sm:p-8 border-b border-slate-200/50 bg-gradient-to-r from-blue-50/50 to-transparent'>
                <h3 className='text-lg sm:text-2xl font-bold text-slate-900 flex items-center gap-3'>
                  <div className='p-2.5 bg-blue-100 rounded-xl'>
                    <MapPin className='w-6 h-6 text-blue-600' />
                  </div>
                  Route Map
                </h3>
              </div>
              
              {/* Animated Route */}
              <div className='p-6 sm:p-8 space-y-3'>
                {transportData?.segments?.map((segment, idx) => {
                  const isSelected = selectedSegment === idx;
                  const [fromText, toText] = segment.segment.split('→').map(s => s.trim());
                  
                  // Determine fromInfo: First segment starts from Hotel, others start from previous place
                  let fromInfo = { type: '🏨 Hotel', name: 'Hotel' };
                  if (idx > 0 && idx - 1 < dayPlan.length) {
                    fromInfo = getSegmentPlaceInfo(dayPlan[idx - 1]?.placeName, idx - 1);
                  }
                  
                  // Determine toInfo: Current place in itinerary
                  let toInfo = { type: '🎯 Place', name: 'Stop' };
                  if (idx < dayPlan.length) {
                    toInfo = getSegmentPlaceInfo(dayPlan[idx]?.placeName, idx);
                  }
                  
                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedSegment(idx)}
                      className={`relative transition-all duration-300 cursor-pointer group`}
                    >
                      {/* Route Line */}
                      <div className='flex items-stretch gap-4'>
                        {/* Start Pin */}
                        <div className='flex flex-col items-center pt-2'>
                          <div className={`w-5 h-5 rounded-full border-3 transition-all duration-300 ${
                            isSelected 
                              ? 'bg-blue-600 border-blue-600 ring-4 ring-blue-300 scale-125 shadow-lg' 
                              : 'bg-white border-slate-400 group-hover:border-blue-500 group-hover:scale-110'
                          }`}></div>
                          {idx < transportData.segments.length - 1 && (
                            <div className={`w-1 transition-all duration-300 flex-1 ${
                              isSelected ? 'bg-gradient-to-b from-blue-500 to-teal-400' : 'bg-slate-300 group-hover:bg-blue-400'
                            }`}></div>
                          )}
                        </div>

                        {/* Segment Content */}
                        <div className={`flex-1 rounded-2xl p-4 sm:p-5 transition-all duration-300 border-2 ${
                          isSelected
                            ? 'bg-gradient-to-br from-blue-50 to-teal-50 border-blue-300 shadow-lg ring-2 ring-blue-200'
                            : 'bg-white/60 border-slate-200 group-hover:border-blue-300 group-hover:bg-blue-50/50 group-hover:shadow-md'
                        }`}>
                          <div className='flex items-start justify-between gap-3'>
                            <div className='flex-1 min-w-0'>
                              <p className='text-sm sm:text-base font-bold text-slate-900 mb-3'>{fromText} <span className='mx-1.5 text-blue-600 font-black'>→</span> {toText}</p>
                              <div className='flex flex-wrap gap-2 text-[11px] sm:text-sm'>
                                <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-white transition-all'>
                                  <Clock className='w-3.5 h-3.5' /> {segment.travelTime || 'N/A'}
                                </span>
                                <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-white transition-all'>
                                  <span>📏</span> {segment.distance || 'N/A'}
                                </span>
                                {segment.cost && (
                                  <span className='inline-flex items-center gap-2 px-3 py-1.5 bg-white/80 rounded-xl border border-slate-200 font-semibold text-slate-700 hover:bg-white transition-all'>
                                    <span>💰</span> {extractCost(segment.cost)}
                                  </span>
                                )}
                              </div>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSegmentExpansion(idx);
                              }}
                              className='flex-shrink-0 p-1.5 hover:bg-blue-100 rounded-lg transition-all duration-300 group/chevron'
                            >
                              <ChevronRight className={`w-6 h-6 transition-all duration-300 ${expandedSegments.includes(idx) ? 'rotate-90 text-blue-600' : 'text-slate-400 group-hover/chevron:text-blue-500'}`} />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Inline Expandable Details */}
                      {expandedSegments.includes(idx) && (
                        <div className={`transition-all duration-300 ${expandedSegments.includes(idx) ? 'opacity-100 max-h-96 visible' : 'opacity-0 max-h-0 invisible'} overflow-hidden`}>
                          <div className='ml-9 mt-3 bg-gradient-to-br from-blue-50 via-teal-50 to-emerald-50 rounded-2xl p-5 sm:p-6 border-2 border-blue-200 shadow-md'>
                            {/* Timing */}
                            {segment.timing && (
                              <div className='mb-4 pb-4 border-b-2 border-blue-200'>
                                <p className='text-sm sm:text-base text-slate-700 flex items-center gap-2.5 font-semibold'>
                                  <div className='p-2 bg-blue-100 rounded-lg'>
                                    <Clock className='w-4 h-4 text-blue-600' />
                                  </div>
                                  <span>{segment.timing}</span>
                                </p>
                              </div>
                            )}

                            {/* Transport Options Grid */}
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4'>
                              {/* Local Transport */}
                              {segment.localTransport && (
                                <div className={`bg-gradient-to-br ${getTransportColor(segment.localTransport)} rounded-xl p-4 border-2 border-green-300/60 shadow-sm hover:shadow-md transition-all`}>
                                  <div className='flex items-start justify-between mb-3'>
                                    <div>
                                      <p className='text-xs font-black text-slate-700 uppercase tracking-widest mb-2'>Local Transport</p>
                                      <p className='text-4xl'>{getTransportIcon(segment.localTransport)}</p>
                                    </div>
                                    <span className='text-xl sm:text-2xl font-black text-green-600'>{extractCost(segment.localTransport)}</span>
                                  </div>
                                  <p className='text-xs sm:text-sm text-slate-700 leading-relaxed font-medium'>{segment.localTransport}</p>
                                </div>
                              )}

                              {/* Private Transport */}
                              {segment.privateTransport && (
                                <div className='bg-gradient-to-br from-blue-50 to-cyan-100 rounded-xl p-4 border-2 border-blue-300/60 shadow-sm hover:shadow-md transition-all'>
                                  <div className='flex items-start justify-between mb-3'>
                                    <div>
                                      <p className='text-xs font-black text-slate-700 uppercase tracking-widest mb-2'>Private Taxi</p>
                                      <p className='text-4xl'>🚖</p>
                                    </div>
                                    <span className='text-xl sm:text-2xl font-black text-blue-600'>{extractCost(segment.privateTransport)}</span>
                                  </div>
                                  <p className='text-xs sm:text-sm text-slate-700 leading-relaxed font-medium'>{segment.privateTransport}</p>
                                </div>
                              )}
                            </div>

                            {/* Recommendation */}
                            {segment.recommendation && (
                              <div className='bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border-2 border-amber-300/60'>
                                <p className='text-xs font-black text-amber-900 uppercase tracking-widest mb-2 flex items-center gap-2.5'>
                                  <div className='p-1.5 bg-amber-100 rounded-lg'>
                                    <Zap className='w-3.5 h-3.5 text-amber-600' />
                                  </div>
                                  Smart Suggestion
                                </p>
                                <p className='text-xs sm:text-sm text-amber-900 font-medium'>{segment.recommendation}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Summary Cards */}
            {transportData?.summary && (
              <div className='grid grid-cols-1 sm:grid-cols-3 gap-4'>
                {/* Per Person Local Cost */}
                <div className='group relative overflow-hidden rounded-2xl bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 p-6 sm:p-8 border-2 border-green-300/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-green-400'>
                  <div className='absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <div className='relative'>
                    <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-green-100 mb-4 group-hover:scale-110 transition-transform duration-300'>
                      <span className='text-2xl'>🚌</span>
                    </div>
                    <p className='text-xs sm:text-sm font-black text-green-900 uppercase tracking-widest mb-3'>Per Person Local</p>
                    <p className='text-3xl sm:text-4xl font-black text-green-600 mb-2'>{extractCost(transportData.summary.totalCostLocal)}</p>
                    <p className='text-sm text-green-800 font-semibold'>Buses, Metro, Auto</p>
                  </div>
                </div>

                {/* Private Cab Total */}
                <div className='group relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 p-6 sm:p-8 border-2 border-blue-300/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-blue-400'>
                  <div className='absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <div className='relative'>
                    <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-100 mb-4 group-hover:scale-110 transition-transform duration-300'>
                      <span className='text-2xl'>🚖</span>
                    </div>
                    <p className='text-xs sm:text-sm font-black text-blue-900 uppercase tracking-widest mb-3'>Private Cab Total</p>
                    <p className='text-3xl sm:text-4xl font-black text-blue-600 mb-2'>{extractCost(transportData.summary.totalCostPrivate)}</p>
                    <p className='text-sm text-blue-800 font-semibold'>Full Day Option</p>
                  </div>
                </div>

                {/* Total Travel Time */}
                <div className='group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-50 via-pink-50 to-purple-100 p-6 sm:p-8 border-2 border-purple-300/50 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-purple-400'>
                  <div className='absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <div className='relative'>
                    <div className='inline-flex items-center justify-center w-12 h-12 rounded-xl bg-purple-100 mb-4 group-hover:scale-110 transition-transform duration-300'>
                      <span className='text-2xl'>⏱️</span>
                    </div>
                    <p className='text-xs sm:text-sm font-black text-purple-900 uppercase tracking-widest mb-3'>Total Travel Time</p>
                    <p className='text-3xl sm:text-4xl font-black text-purple-600 mb-2'>{transportData.summary.totalTravelTime || '0h'}</p>
                    <p className='text-sm text-purple-800 font-semibold'>All Segments</p>
                  </div>
                </div>
              </div>
            )}

            {/* Generate Button */}
            {!transportData && !loading && (
              <div className='flex flex-col items-center justify-center py-12 sm:py-16'>
                <div className='mb-6'>
                  <div className='w-24 h-24 rounded-full bg-gradient-to-br from-blue-100 to-teal-100 flex items-center justify-center mb-4'>
                    <MapPin className='w-12 h-12 text-blue-600' />
                  </div>
                </div>
                <h3 className='text-xl sm:text-2xl font-bold text-slate-900 mb-2 text-center'>Ready for Smart Routes?</h3>
                <p className='text-slate-600 text-center mb-6 max-w-md'>Generate optimized transport routes and get smart recommendations for every segment of your day.</p>
                <button
                  onClick={generateTransportGuide}
                  className='group relative px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-blue-600 to-teal-600 text-white font-bold text-lg rounded-2xl hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-white/30 overflow-hidden'
                >
                  <div className='absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300'></div>
                  <span className='relative flex items-center gap-2'>
                    <Navigation2 className='w-5 h-5' />
                    Generate Transport Guide
                  </span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
}

export default LocalTransportGuide;
