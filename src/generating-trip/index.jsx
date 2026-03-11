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
    <section className='relative min-h-[calc(100vh-72px)] overflow-hidden bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.2),transparent_45%),radial-gradient(circle_at_80%_30%,rgba(99,102,241,0.24),transparent_46%),radial-gradient(circle_at_50%_90%,rgba(16,185,129,0.2),transparent_48%),#f8fafc]'>
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
      `}</style>

      <div className='mx-auto flex min-h-[calc(100vh-72px)] max-w-4xl items-center px-4 py-12 sm:px-6'>
        <div className='w-full rounded-3xl border border-white/60 bg-white/65 p-6 shadow-[0_30px_90px_-35px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:p-10'>
          <p className='text-center text-xs font-bold uppercase tracking-[0.22em] text-indigo-600'>AI Route Engine</p>
          <h1 className='mt-4 text-center text-2xl font-extrabold text-slate-900 sm:text-4xl'>Generating trip to {destination}</h1>
          <p className='mx-auto mt-3 max-w-2xl text-center text-sm text-slate-600 sm:text-base'>{statusText}</p>

          <div className='relative mt-10 h-40 overflow-hidden rounded-2xl border border-indigo-100 bg-white/80 sm:h-48'>
            <div className='absolute left-1/2 top-1/2 h-1.5 w-64 -translate-x-1/2 rounded-full bg-linear-to-r from-sky-200 via-indigo-200 to-emerald-200' style={{ animation: 'trail 2.4s ease-in-out infinite' }} />
            <div
              className='absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl drop-shadow-[0_10px_10px_rgba(79,70,229,0.35)] sm:text-6xl'
              style={{ animation: 'fly 2.8s ease-in-out infinite' }}
            >
              ✈️
            </div>
            <div className='absolute inset-x-0 bottom-4 text-center text-xs font-semibold text-slate-500 sm:text-sm'>Calibrating routes, food stops, and budget fit...</div>
          </div>

          <div className='mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3'>
            {[
              'Weather-aware activities',
              'Local hotels and transport',
              'Morning to night flow',
            ].map((item) => (
              <div key={item} className='rounded-xl border border-slate-200 bg-white px-4 py-3 text-center text-xs font-semibold text-slate-700 sm:text-sm' style={{ animation: 'pulseSoft 2.6s ease-in-out infinite' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default GeneratingTrip;
