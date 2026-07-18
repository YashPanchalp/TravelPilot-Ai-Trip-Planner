import React, { useState, useEffect } from 'react'
import GooglePlacesAutocomplete from 'react-google-places-autocomplete' 
import { Input } from '../components/ui/input' // adjust path if different
import { SelectBudgetoptions, SelectInterestOptions, SelectTravelesList } from '@/constants/options';
import { toast } from 'sonner';
import { AI_PROMPT } from '@/constants/options';
import { chatSession } from '@/service/AIModel';
import { FcGoogle } from "react-icons/fc";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig'; // adjust path if different

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from '@/components/ui/button';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

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

const normalizeGoogleUser = (profile = {}) => ({
  ...profile,
  picture:
    profile?.picture ||
    profile?.photoURL ||
    profile?.imageUrl ||
    profile?.avatar_url ||
    profile?.profile?.picture ||
    profile?.profileObj?.imageUrl ||
    '',
});

function CreateTrip() {
  const [place, setPlace] = useState();
  const [sourcePlace, setSourcePlace] = useState();
  const [formData, setFormData] = useState({
    source: null,
    location: null,
    startDate: '',
    endDate: '',
    noOfDays: '',
    travelers: '',
    budget: '',
    interests: [],
    userPreference: '',
    weatherSummary: '',
  });
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const router = useNavigate();

  const placeSelectStyles = {
    control: (provided) => ({
      ...provided,
      minHeight: '52px',
      borderRadius: '0.75rem',
      borderColor: '#cbd5e1',
      boxShadow: 'none',
      paddingLeft: '0.35rem',
      backgroundColor: '#ffffff',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#64748b',
    }),
    menu: (provided) => ({
      ...provided,
      borderRadius: '0.75rem',
      overflow: 'hidden',
      zIndex: 60,
    }),
  };

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const selected = prev?.interests || [];
      const exists = selected.includes(interest);

      return {
        ...prev,
        interests: exists ? selected.filter((item) => item !== interest) : [...selected, interest],
      };
    });
  };

  useEffect(() => {
      console.log(formData); 
  }, [formData])

  useEffect(() => {
    const start = formData?.startDate;
    const end = formData?.endDate;

    if (!start || !end) {
      setFormData((prev) => ({ ...prev, noOfDays: '' }));
      return;
    }

    const startDate = new Date(`${start}T00:00:00`);
    const endDate = new Date(`${end}T00:00:00`);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime()) || endDate < startDate) {
      setFormData((prev) => ({ ...prev, noOfDays: '' }));
      return;
    }

    const diff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    setFormData((prev) => ({ ...prev, noOfDays: String(diff) }));
  }, [formData?.startDate, formData?.endDate]);

  useEffect(() => {
    if (location?.state?.openSignIn) {
      setOpenDialog(true);
      router('/create-trip', { replace: true });
    }
  }, [location?.state, router]);

  const login = useGoogleLogin({
    scope: 'openid profile email https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
    onSuccess: (response) => {
      console.log('Login Success:', response);
      GetUserProfile(response);
    },
    onError: (error) => {
      console.log('Login Failed:', error)
    }
  })

  const GetUserProfile = (tokenInfo) => {
    axios.get(`https://www.googleapis.com/oauth2/v3/userinfo?access_token=${tokenInfo.access_token}`, {
      headers: {
        Authorization: `Bearer ${tokenInfo.access_token}`,
        Accept: 'application/json',
      },
    }).then((response) => {
      console.log('User Profile:', response.data);
      const normalizedUser = normalizeGoogleUser(response.data);
      localStorage.setItem('user', JSON.stringify(normalizedUser));
      window.dispatchEvent(new Event('user-auth-changed'));
      setOpenDialog(false);
      OnGenerateTrp();
    })
  }

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

      // Fallback: try city-only token when full label does not resolve.
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

  const sanitizeJsonResponse = (rawText = '') => {
    const cleaned = rawText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    return cleaned;
  };

  const OnGenerateTrp =async () => {

    //for Oauth user details -> get the current logged in user details from local storage and pass it to the backend for storing the trip details with user id and also for personalized trip planning based on user preferences and past trips.
    const user = localStorage.getItem('user')

    if(!user){
      setOpenDialog(true);
      return;
    }

    const days = Number(formData?.noOfDays);

    if (!formData?.source || !formData?.location || !formData?.travelers || !formData?.budget || !formData?.startDate || !formData?.endDate || !days) {
      toast.error('Please fill all fields including source location before generating the trip.');
      return;
    }

    if (formData?.endDate < formData?.startDate) {
      toast.error('End date must be after start date.');
      return;
    }

    if (days > 9) {
      toast.error('Please select a trip duration of 9 days or less.');
      return;
    }

    const tripSelection = {
      ...formData,
      noOfDays: String(days),
      weatherSummary: '',
      weatherDetails: null,
    };

    toast.success('Trip details look good. Starting generation...');
    router('/generating-trip', {
      state: {
        tripSelection,
      },
    });
  }
  
  const SaveTrip= async (TripData, tripSelection) => {

    setLoading(true); //start loading when saving trip data to firebase

    const user = JSON.parse(localStorage.getItem('user')); //get user detlais from local storage
    const parsedTripData = JSON.parse(sanitizeJsonResponse(TripData));
    const docId = Date.now().toString(); // Generate a unique document ID using the current timestamp
      await setDoc(doc(db,"AiTrips", docId), {
        userSelection: tripSelection,
        tripData: parsedTripData,
        userEmail: user?.email,
        id: docId,
        createdAt: serverTimestamp()
      })
      setLoading(false); //stop loading after saving trip data to firebase
      toast.success('Trip generated and saved successfully! Check your trip history to view the details.'); //show success message after saving trip data to firebase

      router(`/view-trip/${docId}`); //navigate                        
  }

  

  return (
    <>
      <section className='relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 px-0 py-10 sm:px-0 md:px-0 lg:px-0'>
        <div className='pointer-events-none absolute -left-32 top-10 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl' />
        <div className='pointer-events-none absolute -right-32 top-40 h-80 w-80 rounded-full bg-violet-200/40 blur-3xl' />
        <div className='pointer-events-none absolute bottom-20 left-1/2 h-60 w-96 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl' />

        <div className='relative mx-auto w-full'>
          {/* Header Section */}
          <div className='mb-8 px-4 text-center sm:mb-10 sm:px-8 md:px-14 lg:px-20'>
            <p className='text-xs font-bold uppercase tracking-[0.3em] text-indigo-600'>✨ AI Travel Planner</p>
            <h1 className='mt-2 text-3xl font-bold text-slate-900 sm:text-4xl'>Plan Your Perfect Trip</h1>
            <p className='mt-3 text-sm text-slate-600 sm:text-base'>Let AI create a personalized itinerary based on your preferences and interests</p>
          </div>

          {/* Form and Preview Grid */}
          <div className='grid gap-8 px-4 sm:px-8 md:px-14 lg:px-20 lg:grid-cols-[1.1fr_1fr]'>
          <div className='rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white/95 p-8 shadow-xl backdrop-blur-sm'>
            <div className='mb-2 flex items-center gap-3'>
              <div className='flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-lg font-bold text-white'>✈</div>
              <div>
                <h2 className='text-2xl font-bold text-slate-900'>Create Your Trip</h2>
                <p className='text-xs text-slate-500'>Personalized AI-powered itinerary</p>
              </div>
            </div>

            <div className='mt-8 space-y-6'>
              <div>
                <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>📍 Where are you traveling from?</h3>
                <GooglePlacesAutocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  selectProps={{
                    value: sourcePlace,
                    placeholder: 'e.g., New York, London, Mumbai...',
                    styles: placeSelectStyles,
                    onChange: (v) => {
                      setSourcePlace(v);
                      handleInputChange('source', v);
                    },
                  }}
                />
              </div>

              <div>
                <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>✈️ Where do you want to go?</h3>
                <GooglePlacesAutocomplete
                  apiKey={import.meta.env.VITE_GOOGLE_PLACES_API_KEY}
                  selectProps={{
                    value: place,
                    placeholder: 'e.g., Paris, Tokyo, Bali...',
                    styles: placeSelectStyles,
                    onChange: (v) => {
                      setPlace(v);
                      handleInputChange('location', v);
                    },
                  }}
                />
              </div>

              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                <div>
                  <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>📅 Start Date</h3>
                  <Input
                    className='h-12 rounded-xl border-slate-300 bg-white text-base font-medium transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                    type='date'
                    value={formData?.startDate || ''}
                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                  />
                </div>

                <div>
                  <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>📅 End Date</h3>
                  <Input
                    className='h-12 rounded-xl border-slate-300 bg-white text-base font-medium transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                    type='date'
                    value={formData?.endDate || ''}
                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <div className='grid grid-cols-1 gap-5 sm:grid-cols-2'>
                <div>
                  <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>👥 Travelers</h3>
                  <select
                    className='h-12 w-full rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                    value={formData?.travelers || ''}
                    onChange={(e) => handleInputChange('travelers', e.target.value)}
                  >
                    <option value=''>Select travelers</option>
                    {SelectTravelesList.map((item) => (
                      <option key={item.id} value={item.people}>{item.title} ({item.people})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>⏱️ Trip Duration</h3>
                  <Input
                    className='h-12 rounded-xl border-slate-300 bg-gradient-to-r from-indigo-50 to-violet-50 text-base font-bold text-slate-800'
                    value={formData?.noOfDays ? `${formData?.noOfDays} day(s)` : ''}
                    placeholder='Auto calculated from dates'
                    disabled
                  />
                </div>
              </div>

              <div>
                <h3 className='mb-4 text-sm font-bold uppercase tracking-wide text-slate-700'>💸 Budget Preference</h3>
                <div className='grid grid-cols-1 gap-4 sm:grid-cols-3'>
                  {SelectBudgetoptions.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => handleInputChange('budget', item.title)}
                      className={`group rounded-2xl border-2 px-4 py-5 text-left transition-all duration-300 ${
                        formData?.budget === item.title
                          ? 'border-indigo-600 bg-gradient-to-br from-indigo-50 to-violet-50 text-indigo-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-1 hover:shadow-lg'
                      }`}
                    >
                      <p className='text-3xl'>{item.icon}</p>
                      <p className='mt-3 text-sm font-bold leading-snug'>{item.title}</p>
                      <p className='mt-2 text-xs text-slate-600 group-hover:text-slate-700'>{item.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className='mb-4 text-sm font-bold uppercase tracking-wide text-slate-700'>🎯 What interests you?</h3>
                <div className='grid grid-cols-2 gap-3'>
                  {SelectInterestOptions.map((item) => (
                    <button
                      key={item.id}
                      type='button'
                      onClick={() => toggleInterest(item.title)}
                      className={`rounded-xl border-2 px-4 py-3 text-center text-sm font-semibold transition-all duration-300 ${
                        (formData?.interests || []).includes(item.title)
                          ? 'border-violet-500 bg-gradient-to-br from-violet-50 to-purple-50 text-violet-900'
                          : 'border-slate-200 bg-white text-slate-700 hover:-translate-y-0.5 hover:shadow-sm'
                      }`}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className='mb-3 text-sm font-bold uppercase tracking-wide text-slate-700'>💬 Your Preference (Optional)</h3>
                <textarea
                  className='min-h-28 w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 placeholder-slate-400 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100'
                  placeholder='Example: Prefer less walking, vegetarian food, kid-friendly places, nightlife, shopping, museums, etc.'
                  value={formData?.userPreference || ''}
                  onChange={(e) => handleInputChange('userPreference', e.target.value)}
                />
              </div>
            </div>

            <div className='mt-8 pt-6 border-t border-slate-200'>
              <Button
                disabled={loading}
                className='h-14 w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-base font-bold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-violet-500/40 disabled:opacity-75 disabled:cursor-not-allowed'
                onClick={OnGenerateTrp}
              >
                {loading ? <AiOutlineLoading3Quarters className='animate-spin' /> : '🚀 Generate AI Trip Plan'}
              </Button>
            </div>
          </div>

          <div className='rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white/95 p-8 shadow-xl backdrop-blur-sm'>
            <div className='mb-2 flex items-center gap-2'>
              <div className='h-1 w-8 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500' />
              <p className='text-xs font-bold uppercase tracking-widest text-indigo-600'>Preview</p>
            </div>
            <h3 className='text-2xl font-bold text-slate-900'>Trip Summary</h3>
            <p className='mt-2 text-sm text-slate-600'>Your itinerary details will appear here</p>

            <div className='mt-8 space-y-5'>
              {/* Source Location */}
              <div className='rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md'>
                <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>📍 From</p>
                <p className='mt-2 text-lg font-semibold text-slate-900'>{formData?.source?.label || 'Not selected'}</p>
              </div>

              {/* Destination */}
              <div className='rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md'>
                <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>✈️ To</p>
                <p className='mt-2 text-lg font-semibold text-slate-900'>{formData?.location?.label || 'Not selected'}</p>
              </div>

              {/* Trip Dates & Duration */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md'>
                  <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>📅 Start</p>
                  <p className='mt-2 text-sm font-semibold text-slate-900'>{formData?.startDate || '--'}</p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md'>
                  <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>📅 End</p>
                  <p className='mt-2 text-sm font-semibold text-slate-900'>{formData?.endDate || '--'}</p>
                </div>
              </div>

              {/* Trip Duration & Travelers */}
              <div className='grid grid-cols-2 gap-3'>
                <div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-indigo-50 to-violet-50 p-4 transition-all hover:shadow-md'>
                  <p className='text-xs font-bold uppercase tracking-wide text-indigo-600'>⏱️ Duration</p>
                  <p className='mt-2 text-lg font-bold text-indigo-900'>{formData?.noOfDays ? `${formData?.noOfDays} Days` : '--'}</p>
                </div>
                <div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4 transition-all hover:shadow-md'>
                  <p className='text-xs font-bold uppercase tracking-wide text-violet-600'>👥 Travelers</p>
                  <p className='mt-2 text-lg font-bold text-violet-900'>{formData?.travelers || '--'}</p>
                </div>
              </div>

              {/* Budget */}
              <div className='rounded-2xl border border-slate-200 bg-gradient-to-br from-amber-50 to-orange-50 p-4 transition-all hover:shadow-md'>
                <p className='text-xs font-bold uppercase tracking-wide text-amber-600'>💸 Budget</p>
                <div className='mt-2 flex items-center gap-3'>
                  <span className='text-2xl'>{formData?.budget ? (formData?.budget === 'Pocket Friendly' ? '🪙' : formData?.budget === 'Moderate' ? '💰' : '💎') : '❓'}</span>
                  <p className='text-lg font-bold text-amber-900'>{formData?.budget || 'Not selected'}</p>
                </div>
              </div>

              {/* Interests */}
              {(formData?.interests || []).length > 0 && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>🎯 Interests</p>
                  <div className='mt-3 flex flex-wrap gap-2'>
                    {(formData?.interests || []).map((interest) => (
                      <span key={interest} className='inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800'>
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* User Preference */}
              {(formData?.userPreference || '').trim() && (
                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <p className='text-xs font-bold uppercase tracking-wide text-slate-500'>💬 Your Preference</p>
                  <p className='mt-2 text-sm text-slate-700 italic'>{formData?.userPreference}</p>
                </div>
              )}

              {/* Status Indicator */}
              <div className='rounded-2xl border border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50 p-4'>
                <div className='flex items-center gap-2'>
                  <div className={`h-2 w-2 rounded-full ${
                    formData?.location && formData?.travelers && formData?.budget && formData?.startDate && formData?.endDate 
                      ? 'bg-green-500' 
                      : 'bg-amber-400'
                  }`} />
                  <p className='text-xs font-semibold text-slate-600'>
                    {formData?.location && formData?.travelers && formData?.budget && formData?.startDate && formData?.endDate 
                      ? '✓ Ready to generate' 
                      : '○ Complete the form'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      </section>

      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className='rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-2xl'>
          <DialogHeader>
            <DialogTitle className='mt-6 text-center text-2xl font-bold text-slate-900'>
              Sign in with Google
            </DialogTitle>
            <DialogDescription className='pt-2 text-center text-slate-600 sm:text-left'>
              <div className='flex items-center justify-center gap-2 sm:justify-start'>
                <img className='h-8 w-8 rounded-md' src='/logo.png' alt='AI Trip Planner logo' />
                <span className='text-xl font-bold tracking-wide text-orange-800'>AI Trip Planner</span>
              </div>
              <p className='mt-3 text-center font-medium'>Sign in to continue and generate your personalized travel itinerary.</p>

              {/* disable when loading */}
              <Button disabled={loading} 
              className='mt-6 h-11 w-full rounded-lg bg-slate-900 font-semibold text-white hover:bg-slate-800'
              onClick={login}>
                <FcGoogle></FcGoogle>Sign In With Google
              </Button>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </>
  )
}

export default CreateTrip