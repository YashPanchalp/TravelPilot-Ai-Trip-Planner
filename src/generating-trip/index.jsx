import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig';
import { AI_PROMPT } from '@/constants/options';
import { chatSession } from '@/service/AIModel';

const WEATHER_CODE_LABEL = {
  0: 'Clear sky',
  1: 'Mostly clear',
  2: 'Partly cloudy',
  3: 'Overcast',
  45: 'Foggy',
  48: 'Rime fog',
  51: 'Light drizzle',
  53: 'Moderate drizzle',
  55: 'Dense drizzle',
  56: 'Freezing drizzle',
  57: 'Dense freezing drizzle',
  61: 'Light rain',
  63: 'Moderate rain',
  65: 'Heavy rain',
  66: 'Freezing rain',
  67: 'Heavy freezing rain',
  71: 'Light snow',
  73: 'Moderate snow',
  75: 'Heavy snow',
  77: 'Snow grains',
  80: 'Rain showers',
  81: 'Heavy rain showers',
  82: 'Violent rain showers',
  85: 'Snow showers',
  86: 'Heavy snow showers',
  95: 'Thunderstorm',
  96: 'Thunderstorm with hail',
  99: 'Severe thunderstorm with hail',
};

function GeneratingTrip() {
  const navigate = useNavigate();
  const location = useLocation();
  const [statusText, setStatusText] = useState('Reading your travel details...');

  const tripSelection = useMemo(() => location?.state?.tripSelection || null, [location?.state]);
  const destination = tripSelection?.location?.label || 'your destination';

  const getDominantWeatherCode = (codes = []) => {
    const counts = codes.reduce((acc, code) => {
      acc[code] = (acc[code] || 0) + 1;
      return acc;
    }, {});

    const winner = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return winner ? Number(winner[0]) : null;
  };

  const fetchWeatherSummary = async (locationLabel, startDate, endDate) => {
    const noData = {
      condition: 'Unavailable',
      avgDayTempC: null,
      avgNightTempC: null,
      rainChancePercent: null,
      totalPrecipitationMm: null,
      avgUvIndex: null,
      startDate,
      endDate,
    };

    const geocodeLocation = async (name) => {
      const response = await axios.get('https://geocoding-api.open-meteo.com/v1/search', {
        params: {
          name,
          count: 1,
          language: 'en',
          format: 'json',
        },
      });

      return response?.data?.results?.[0] || null;
    };

    try {
      let topResult = await geocodeLocation(locationLabel);

      if (!topResult && String(locationLabel).includes(',')) {
        const cityOnly = String(locationLabel).split(',')[0].trim();
        topResult = cityOnly ? await geocodeLocation(cityOnly) : null;
      }

      if (!topResult || typeof topResult?.latitude !== 'number' || typeof topResult?.longitude !== 'number') {
        return {
          summary: `Weather unavailable for ${locationLabel}. Plan mixed indoor and outdoor activities.`,
          details: noData,
        };
      }

      const weatherRes = await axios.get('https://api.open-meteo.com/v1/forecast', {
        params: {
          latitude: topResult.latitude,
          longitude: topResult.longitude,
          daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_mean,precipitation_sum,uv_index_max',
          start_date: startDate,
          end_date: endDate,
          timezone: 'auto',
        },
      });

      const daily = weatherRes?.data?.daily;
      const maxTemps = daily?.temperature_2m_max || [];
      const minTemps = daily?.temperature_2m_min || [];
      const rainChance = daily?.precipitation_probability_mean || [];
      const precipitation = daily?.precipitation_sum || [];
      const uvIndex = daily?.uv_index_max || [];
      const weatherCodes = daily?.weather_code || [];

      if (!maxTemps.length || !minTemps.length) {
        return {
          summary: `Weather forecast is limited for ${locationLabel}. Add flexible indoor alternatives in the itinerary.`,
          details: noData,
        };
      }

      const avgMax = Math.round(maxTemps.reduce((a, b) => a + b, 0) / maxTemps.length);
      const avgMin = Math.round(minTemps.reduce((a, b) => a + b, 0) / minTemps.length);
      const avgRain = Math.round(rainChance.reduce((a, b) => a + b, 0) / Math.max(rainChance.length, 1));
      const totalPrecipitation = Math.round((precipitation.reduce((a, b) => a + b, 0)) * 10) / 10;
      const avgUv = Math.round((uvIndex.reduce((a, b) => a + b, 0) / Math.max(uvIndex.length, 1)) * 10) / 10;
      const dominantCode = getDominantWeatherCode(weatherCodes);
      const weatherLabel = WEATHER_CODE_LABEL[dominantCode] || 'Mixed conditions';

      return {
        summary: `${weatherLabel}; avg daytime around ${avgMax}C, nights around ${avgMin}C, rain chance about ${avgRain}%. Prioritize weather-suitable activities.`,
        details: {
          condition: weatherLabel,
          avgDayTempC: avgMax,
          avgNightTempC: avgMin,
          rainChancePercent: avgRain,
          totalPrecipitationMm: totalPrecipitation,
          avgUvIndex: avgUv,
          startDate,
          endDate,
        },
      };
    } catch (error) {
      console.error('Weather lookup failed:', error?.response?.data || error?.message || error);
      return {
        summary: `Weather could not be fetched for ${locationLabel}. Plan a balanced itinerary with backup indoor options.`,
        details: noData,
      };
    }
  };

  const sanitizeJsonResponse = (rawText = '') => rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  useEffect(() => {
    const runGeneration = async () => {
      const userRaw = localStorage.getItem('user');
      const user = userRaw ? JSON.parse(userRaw) : null;

      if (!tripSelection?.location?.label || !user?.email) {
        toast.error('Missing trip details. Please try again.');
        navigate('/create-trip', { replace: true });
        return;
      }

      try {
        setStatusText('Checking weather for your dates...');
        const weatherResult = await fetchWeatherSummary(
          tripSelection?.location?.label,
          tripSelection?.startDate,
          tripSelection?.endDate,
        );

        const payload = {
          ...tripSelection,
          weatherSummary: weatherResult?.summary || 'Weather context unavailable',
          weatherDetails: weatherResult?.details || null,
        };

        setStatusText('Designing your day-by-day itinerary...');
        const finalPrompt = AI_PROMPT
          .replace('{location}', payload?.location?.label)
          .replace('{startDate}', payload?.startDate)
          .replace('{endDate}', payload?.endDate)
          .replace('{totalDays}', payload?.noOfDays)
          .replace('{travelers}', payload?.travelers)
          .replace('{budget}', payload?.budget)
          .replace('{interests}', (payload?.interests || []).join(', ') || 'General sightseeing')
          .replace('{userPreference}', String(payload?.userPreference || '').trim() || 'None')
          .replace('{weatherSummary}', payload?.weatherSummary)
          .replace('{totalDays}', payload?.noOfDays);

        const result = await chatSession.sendMessage(finalPrompt);

        setStatusText('Finalizing hotels, costs, and route map...');
        const parsedTripData = JSON.parse(sanitizeJsonResponse(result?.response?.text() || ''));
        const docId = Date.now().toString();

        await setDoc(doc(db, 'AiTrips', docId), {
          userSelection: payload,
          tripData: parsedTripData,
          userEmail: user?.email,
          id: docId,
          createdAt: serverTimestamp(),
        });

        setStatusText('Trip ready. Redirecting...');
        toast.success('Trip generated successfully!');
        setTimeout(() => {
          navigate(`/view-trip/${docId}`, { replace: true });
        }, 900);
      } catch (error) {
        console.error('Trip generation failed:', error?.response?.data || error?.message || error);
        toast.error('Trip generation failed. Please try again.');
        navigate('/create-trip', { replace: true });
      }
    };

    runGeneration();
  }, [navigate, tripSelection]);

  return (
    <section className='relative min-h-[calc(100vh-72px)] overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50'>
      <div className='pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl' />
      <div className='pointer-events-none absolute -right-32 top-1/3 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl' />
      <div className='pointer-events-none absolute bottom-0 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl' />

      <style>{`
        @keyframes fly {
          0% { transform: translateX(-18vw) translateY(8px) rotateY(0deg) rotateZ(-6deg); }
          50% { transform: translateX(0vw) translateY(-10px) rotateY(22deg) rotateZ(0deg); }
          100% { transform: translateX(18vw) translateY(6px) rotateY(0deg) rotateZ(6deg); }
        }

        @keyframes trail {
          0% { opacity: 0.15; transform: scaleX(0.7); }
          50% { opacity: 0.45; transform: scaleX(1); }
          100% { opacity: 0.15; transform: scaleX(0.7); }
        }

        @keyframes pulseSoft {
          0% { transform: scale(0.98); opacity: 0.75; }
          50% { transform: scale(1.02); opacity: 1; }
          100% { transform: scale(0.98); opacity: 0.75; }
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div className='mx-auto flex min-h-[calc(100vh-72px)] max-w-2xl items-center px-4 py-12 sm:px-6'>
        <div className='w-full rounded-3xl border border-white/60 bg-white/70 p-8 shadow-2xl backdrop-blur-2xl sm:p-12'>
          {/* Header */}
          <div className='text-center'>
            <p className='text-xs font-bold uppercase tracking-[0.22em] text-indigo-600 animate-pulse'>🔄 Processing</p>
            <h1 className='mt-4 text-3xl font-bold text-slate-900 sm:text-4xl'>Generating Your Perfect Trip</h1>
            <p className='mt-2 text-sm text-slate-600 sm:text-base'>to <span className='font-semibold text-indigo-600'>{destination}</span></p>
          </div>

          {/* Status Indicator */}
          <div className='relative mt-12 h-40 overflow-hidden rounded-2xl border border-indigo-100/60 bg-gradient-to-b from-white/80 to-slate-50/60 backdrop-blur-sm sm:h-48'>
            <div className='absolute left-1/2 top-1/2 h-1.5 w-64 -translate-x-1/2 rounded-full bg-gradient-to-r from-sky-300 via-indigo-300 to-emerald-300' style={{ animation: 'trail 2.4s ease-in-out infinite' }} />
            <div
              className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-6xl drop-shadow-[0_10px_20px_rgba(79,70,229,0.4)] sm:text-7xl'
              style={{ animation: 'fly 2.8s ease-in-out infinite' }}
            >
              ✈️
            </div>
            <div className='absolute inset-x-0 bottom-4 flex justify-center'>
              <p className='text-xs font-semibold text-slate-600 sm:text-sm'>Crafting your itinerary with AI intelligence...</p>
            </div>
          </div>

          {/* Current Status */}
          <div className='mt-8 rounded-2xl border border-slate-200 bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4'>
            <p className='text-center text-sm font-medium text-slate-700'>
              <span className='inline-block animate-bounce mr-2'>⚡</span>
              {statusText}
              <span className='inline-block animate-bounce ml-2'>⚡</span>
            </p>
          </div>

          {/* Processing Steps */}
          <div className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {[
              { icon: '🌦️', text: 'Weather-aware activities' },
              { icon: '🏨', text: 'Hotels & transport' },
              { icon: '🍽️', text: 'Morning to night flow' },
            ].map((item, index) => (
              <div 
                key={item.text} 
                className='rounded-xl border border-slate-200 bg-white px-4 py-4 text-center transition-all hover:shadow-md' 
                style={{ 
                  animation: `pulseSoft 2.6s ease-in-out infinite`,
                  animationDelay: `${index * 0.2}s`
                }}
              >
                <p className='text-2xl mb-2'>{item.icon}</p>
                <p className='text-xs font-semibold text-slate-700 sm:text-sm'>{item.text}</p>
              </div>
            ))}
          </div>

          {/* Footer Note */}
          <div className='mt-8 text-center'>
            <p className='text-xs text-slate-500'>This typically takes 30-60 seconds. Please don't refresh the page.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default GeneratingTrip;
