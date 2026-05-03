import React, { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { GetPlaceDetails, PHOTO_REF_URL } from '@/service/GlobalAPI';
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  Filter,
  IndianRupee,
  MapPin,
  Search,
  Share2,
  Trash2,
  Users,
} from 'lucide-react';

function MyTrips() {
  const navigate = useNavigate();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [tripCoverImages, setTripCoverImages] = useState({});

  const fallbackImage = 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1200&q=80&auto=format&fit=crop';

  const getDestinationFallbackImage = (destinationLabel, tripId) => {
    const destination = encodeURIComponent(destinationLabel || 'travel destination');
    const seed = encodeURIComponent(`${tripId || 'trip'}-${destinationLabel || 'destination'}`);
    return `https://source.unsplash.com/1200x800/?${destination},travel&sig=${seed}`;
  };

  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('user'));
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!user?.email) {
      toast.error('Please sign in to view your trips.');
      navigate('/sign-in', { replace: true });
      return;
    }

    const fetchTrips = async () => {
      try {
        const q = query(collection(db, 'AiTrips'), where('userEmail', '==', user.email));
        const querySnapshot = await getDocs(q);

        const tripRows = querySnapshot.docs
          .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
          .sort((a, b) => Number(b?.id || 0) - Number(a?.id || 0));

        setTrips(tripRows);
      } catch (error) {
        console.error('Failed to fetch trips:', error?.message || error);
        toast.error('Could not load your trips right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchTrips();
  }, [navigate, user?.email]);

  const getTripDateTime = (trip) => {
    const created = trip?.createdAt?.seconds ? new Date(trip.createdAt.seconds * 1000) : null;
    const fallback = Number(trip?.id) ? new Date(Number(trip.id)) : null;
    const dateObj = created || fallback;

    if (!dateObj || Number.isNaN(dateObj.getTime())) {
      return 'Date not available';
    }

    return dateObj.toLocaleString();
  };

  const parseTripDate = (value, endOfDay = false) => {
    if (!value) return null;
    const iso = `${value}T${endOfDay ? '23:59:59' : '00:00:00'}`;
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const getTripStatus = (trip) => {
    const now = new Date();
    const start = parseTripDate(trip?.userSelection?.startDate, false);
    const end = parseTripDate(trip?.userSelection?.endDate, true);

    if (!start || !end) return 'planning';
    if (now < start) return 'upcoming';
    if (now > end) return 'completed';
    return 'planning';
  };

  const getPlanningProgress = (trip) => {
    const status = getTripStatus(trip);
    if (status === 'upcoming') return 10;
    if (status === 'completed') return 100;

    const now = new Date();
    const start = parseTripDate(trip?.userSelection?.startDate, false);
    const end = parseTripDate(trip?.userSelection?.endDate, true);

    if (!start || !end || end <= start) return 45;
    const total = end.getTime() - start.getTime();
    const elapsed = now.getTime() - start.getTime();
    const progress = Math.round((elapsed / total) * 100);
    return Math.min(99, Math.max(1, progress));
  };

  const parseAmount = (value) => {
    if (!value) return 0;
    const onlyDigits = String(value)
      .split('')
      .filter((char) => (char >= '0' && char <= '9') || char === '.')
      .join('');
    const amount = Number(onlyDigits);
    return Number.isFinite(amount) ? amount : 0;
  };

  const formatInr = (value) => {
    if (Number.isNaN(value) || value == null) return 'INR 0';
    return `INR ${value.toLocaleString('en-IN')}`;
  };

  const getEstimatedTotal = (trip) => {
    const travelersCount = trip?.userSelection?.travelers || 1;
    const estimatedCost = trip?.tripData?.estimatedCostInr || trip?.tripData?.estimatedCost || {};
    const costBreakdown = trip?.tripData?.costBreakdown || {};

    const extractNumeric = (val) => {
        if (!val) return 0;
        const num = Number.parseInt(String(val).replaceAll(/,/g, '').replaceAll(/[^\d]/g, ''));
        return Number.isNaN(num) ? 0 : num;
    };
    
    let total = 0;
    
    // Add actual selected flight and hotel costs
    total += extractNumeric(costBreakdown?.travelFlightInr || 0);
    total += extractNumeric(costBreakdown?.hotelCostInr || 0);
    
    // Add other estimated costs
    // Only add accommodation if no hotel has been selected
    if (!costBreakdown?.hotelCostInr || costBreakdown?.hotelCostInr <= 0) {
      total += extractNumeric(estimatedCost?.accommodationInr || estimatedCost?.accommodation);
    }
    
    total += extractNumeric(estimatedCost?.foodInr || estimatedCost?.food);
    total += extractNumeric(estimatedCost?.transportInr || estimatedCost?.transport);
    total += extractNumeric(estimatedCost?.activitiesInr || estimatedCost?.activities);
    total += extractNumeric(estimatedCost?.miscInr || estimatedCost?.misc);

    // If no costs found, try fallback totals
    if (total === 0) {
      const fallbackTotal =
        estimatedCost?.totalEstimatedCostInr ||
        estimatedCost?.totalEstimatedCost ||
        estimatedCost?.total ||
        0;
      const numFallback = extractNumeric(fallbackTotal);
      return numFallback > 0 ? numFallback : 0;
    }
    
    return total;
  };

  const getActivityTags = (trip) => {
    const selectedInterests = Array.isArray(trip?.userSelection?.interests) ? trip.userSelection.interests : [];
    if (selectedInterests.length) {
      return selectedInterests.slice(0, 3);
    }

    const itineraryRaw = trip?.tripData?.itinerary;
    const itineraryItems = Array.isArray(itineraryRaw)
      ? itineraryRaw
      : itineraryRaw && typeof itineraryRaw === 'object'
        ? Object.values(itineraryRaw)
        : [];

    const placeNames = [];
    itineraryItems.forEach((dayItem) => {
      const plans = dayItem?.plan || dayItem?.plans || dayItem?.activities || [];
      if (Array.isArray(plans)) {
        plans.forEach((plan) => {
          if (plan?.placeName) {
            placeNames.push(plan.placeName);
          }
        });
      }
    });

    return Array.from(new Set(placeNames)).slice(0, 3);
  };

  const filteredTrips = useMemo(() => {
    const queryText = searchText.trim().toLowerCase();

    return trips.filter((trip) => {
      const destination = String(trip?.userSelection?.location?.label || '').toLowerCase();
      const tripId = String(trip?.id || '').toLowerCase();
      const matchesSearch = !queryText || destination.includes(queryText) || tripId.includes(queryText);
      const status = getTripStatus(trip);
      const matchesFilter = statusFilter === 'all' || status === statusFilter;

      return matchesSearch && matchesFilter;
    });
  }, [trips, searchText, statusFilter]);

  const stats = useMemo(() => {
    const upcoming = trips.filter((trip) => getTripStatus(trip) === 'upcoming').length;
    const completed = trips.filter((trip) => getTripStatus(trip) === 'completed').length;
    const totalSpent = trips.reduce((sum, trip) => {
      const estimated = getEstimatedTotal(trip);
      return sum + (Number.isNaN(estimated) ? 0 : estimated);
    }, 0);

    // Analytics data
    const domestic = trips.filter((trip) => {
      const destination = String(trip?.userSelection?.location?.label || '').toLowerCase();
      return destination.includes('india') || destination.includes('delhi') || destination.includes('mumbai') || 
             destination.includes('bangalore') || destination.includes('goa') || destination.includes('jaipur') ||
             destination.includes('hyderabad') || destination.includes('kolkata') || destination.includes('pune') ||
             destination.includes('agra') || destination.includes('udaipur');
    }).length;
    
    const international = trips.length - domestic;

    // Monthly breakdown
    const monthlyExpenses = {};
    trips.forEach((trip) => {
      const created = trip?.createdAt?.seconds ? new Date(trip.createdAt.seconds * 1000) : null;
      const fallback = Number(trip?.id) ? new Date(Number(trip.id)) : null;
      const dateObj = created || fallback;
      
      if (dateObj && !Number.isNaN(dateObj.getTime())) {
        const monthKey = dateObj.toLocaleString('en-US', { month: 'short', year: 'numeric' });
        const estimated = getEstimatedTotal(trip);
        monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + estimated;
      }
    });

    return {
      total: trips.length,
      upcoming,
      completed,
      totalSpent,
      domestic,
      international,
      monthlyExpenses: Object.entries(monthlyExpenses).slice(-6),
    };
  }, [trips]);

  useEffect(() => {
    if (!trips.length) return;

    const loadTripCovers = async () => {
      const nextCovers = {};

      await Promise.all(
        trips.map(async (trip) => {
          const tripId = trip?.id;
          if (!tripId || tripCoverImages[tripId]) {
            return;
          }

          const destinationLabel = trip?.userSelection?.location?.label;
          if (!destinationLabel) {
            nextCovers[tripId] = fallbackImage;
            return;
          }

          try {
            const res = await GetPlaceDetails({ textQuery: destinationLabel });
            const photoRef = res?.data?.places?.[0]?.photos?.[0]?.name;

            if (photoRef) {
              nextCovers[tripId] = PHOTO_REF_URL.replace('{NAME}', photoRef);
              return;
            }

            const prefilledCover =
              trip?.tripData?.tripCoverImage ||
              trip?.tripData?.itinerary?.[0]?.plan?.[0]?.placeImageUrl ||
              trip?.tripData?.hotels?.[0]?.hotelImageUrl;

            nextCovers[tripId] = prefilledCover || getDestinationFallbackImage(destinationLabel, tripId);
          } catch (error) {
            console.error('Trip cover fetch failed:', error?.response?.data || error?.message || error);
            const prefilledCover =
              trip?.tripData?.tripCoverImage ||
              trip?.tripData?.itinerary?.[0]?.plan?.[0]?.placeImageUrl ||
              trip?.tripData?.hotels?.[0]?.hotelImageUrl;

            nextCovers[tripId] = prefilledCover || getDestinationFallbackImage(destinationLabel, tripId);
          }
        })
      );

      if (Object.keys(nextCovers).length) {
        setTripCoverImages((prev) => ({ ...prev, ...nextCovers }));
      }
    };

    loadTripCovers();
  }, [trips, tripCoverImages]);

  const handleDeleteTrip = async (tripId) => {
    const confirmed = window.confirm('Delete this trip permanently? This action cannot be undone.');
    if (!confirmed) return;

    try {
      await deleteDoc(doc(db, 'AiTrips', tripId));
      setTrips((prev) => prev.filter((trip) => trip.id !== tripId));
      toast.success('Trip deleted successfully.');
    } catch (error) {
      console.error('Delete trip failed:', error?.message || error);
      toast.error('Could not delete this trip right now.');
    }
  };

  const handleShareTrip = async (tripId) => {
    const shareUrl = `${window.location.origin}/view-trip/${tripId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'My AI Trip Plan',
          text: 'Check out my AI-generated trip details.',
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
      }

      toast.success('Trip link ready to share.');
    } catch (error) {
      console.error('Share trip failed:', error?.message || error);
      toast.error('Could not share this trip right now.');
    }
  };

  return (
    <section className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-0 py-8'>
      <div className='mx-auto flex max-w-full gap-6 px-4 sm:px-8 md:px-12 lg:px-16'>
        {/* Left Sidebar - Analytics */}
        <aside className='hidden w-96 flex-shrink-0 overflow-y-auto lg:block max-h-screen'>
          <div className='sticky top-8 space-y-5'>
            {/* Stats Cards */}
            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)] backdrop-blur'>
              <h3 className='mb-4 text-lg font-extrabold text-slate-900'>Quick Stats</h3>
              <div className='space-y-4'>
                <div className='rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-4 border border-blue-200'>
                  <p className='text-xs font-bold uppercase tracking-wider text-blue-600'>Total Trips</p>
                  <p className='mt-2 text-3xl font-extrabold text-blue-900'>{stats.total}</p>
                </div>

                <div className='rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100 p-4 border border-emerald-200'>
                  <p className='text-xs font-bold uppercase tracking-wider text-emerald-600'>Upcoming</p>
                  <p className='mt-2 text-3xl font-extrabold text-emerald-900'>{stats.upcoming}</p>
                </div>

                <div className='rounded-2xl bg-gradient-to-br from-violet-50 to-violet-100 p-4 border border-violet-200'>
                  <p className='text-xs font-bold uppercase tracking-wider text-violet-600'>Completed</p>
                  <p className='mt-2 text-3xl font-extrabold text-violet-900'>{stats.completed}</p>
                </div>

                <div className='rounded-2xl bg-gradient-to-br from-amber-50 to-amber-100 p-4 border border-amber-200'>
                  <p className='text-xs font-bold uppercase tracking-wider text-amber-600'>Total Budget</p>
                  <p className='mt-2 text-lg font-extrabold text-amber-900'>{formatInr(stats.totalSpent)}</p>
                </div>
              </div>
            </div>

            {/* Trip Type Analytics */}
            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)] backdrop-blur'>
              <h3 className='mb-4 text-lg font-extrabold text-slate-900'>Trip Types</h3>
              <div className='space-y-4'>
                <div>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm font-semibold text-slate-700'>🇮🇳 Domestic</span>
                    <span className='rounded-full bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-700'>{stats.domestic}</span>
                  </div>
                  <div className='h-3 rounded-full bg-slate-200'>
                    <div 
                      className='h-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300'
                      style={{ width: `${stats.total > 0 ? (stats.domestic / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className='mb-2 flex items-center justify-between'>
                    <span className='text-sm font-semibold text-slate-700'>🌍 International</span>
                    <span className='rounded-full bg-violet-100 px-2.5 py-1 text-xs font-bold text-violet-700'>{stats.international}</span>
                  </div>
                  <div className='h-3 rounded-full bg-slate-200'>
                    <div 
                      className='h-3 rounded-full bg-gradient-to-r from-violet-500 to-violet-600 transition-all duration-300'
                      style={{ width: `${stats.total > 0 ? (stats.international / stats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>

                <div className='mt-4 grid grid-cols-2 gap-2'>
                  <div className='rounded-xl border border-blue-200 bg-blue-50 p-3 text-center'>
                    <p className='text-xs font-bold text-blue-700'>Domestic %</p>
                    <p className='mt-1 text-lg font-extrabold text-blue-900'>{stats.total > 0 ? Math.round((stats.domestic / stats.total) * 100) : 0}%</p>
                  </div>
                  <div className='rounded-xl border border-violet-200 bg-violet-50 p-3 text-center'>
                    <p className='text-xs font-bold text-violet-700'>International %</p>
                    <p className='mt-1 text-lg font-extrabold text-violet-900'>{stats.total > 0 ? Math.round((stats.international / stats.total) * 100) : 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Expense Summary */}
            <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)] backdrop-blur'>
              <h3 className='mb-4 text-lg font-extrabold text-slate-900'>Spending Summary</h3>
              <div className='space-y-3'>
                {trips.length > 0 ? (
                  <>
                    <div className='rounded-xl border border-amber-200 bg-amber-50 p-3'>
                      <p className='text-xs font-bold uppercase tracking-wider text-amber-700'>Avg/Trip</p>
                      <p className='mt-2 text-xl font-extrabold text-amber-900'>
                        {formatInr(Math.round(stats.totalSpent / Math.max(trips.length, 1)))}
                      </p>
                    </div>

                    <div className='rounded-xl border border-emerald-200 bg-emerald-50 p-3'>
                      <p className='text-xs font-bold uppercase tracking-wider text-emerald-700'>Highest</p>
                      <p className='mt-2 text-xl font-extrabold text-emerald-900'>
                        {formatInr(Math.max(...trips.map((t) => getEstimatedTotal(t)), 0))}
                      </p>
                    </div>

                    <div className='rounded-xl border border-rose-200 bg-rose-50 p-3'>
                      <p className='text-xs font-bold uppercase tracking-wider text-rose-700'>Lowest</p>
                      <p className='mt-2 text-xl font-extrabold text-rose-900'>
                        {formatInr(Math.min(...trips.map((t) => getEstimatedTotal(t)), 0))}
                      </p>
                    </div>
                  </>
                ) : (
                  <p className='text-sm text-slate-500 text-center py-4'>No trips yet</p>
                )}
              </div>
            </div>

            {/* Monthly Expense Chart */}
            {stats.monthlyExpenses.length > 0 && (
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)]'>
                <h3 className='mb-4 text-lg font-extrabold text-slate-900'>📊 Expense Trend</h3>
                <div className='flex items-end justify-between gap-1'>
                  {stats.monthlyExpenses.map(([month, expense], idx) => {
                    const maxExpense = Math.max(...stats.monthlyExpenses.map(([, e]) => e));
                    const heightPercent = (expense / maxExpense) * 100;
                    const barHeight = (heightPercent * 150) / 100;
                    
                    return (
                      <div key={`${month}-${idx}`} className='flex flex-1 flex-col items-center gap-2 group'>
                        <div className='relative w-full flex flex-col items-center'>
                          <div 
                            className='w-full rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-300 hover:from-blue-700 hover:to-blue-500 shadow-lg group-hover:shadow-xl cursor-pointer'
                            style={{ height: `${barHeight}px` }}
                          >
                            <div className='absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-slate-900 text-white px-2 py-1 rounded text-[10px] font-bold whitespace-nowrap'>
                              {formatInr(expense)}
                            </div>
                          </div>
                        </div>
                        <span className='text-[10px] font-bold text-slate-700 text-center'>{month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Upcoming Trips Calendar */}
            {trips.length > 0 && (
              <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)]'>
                <h3 className='mb-4 text-lg font-extrabold text-slate-900'>📅 Upcoming</h3>
                <div className='space-y-3'>
                  {trips
                    .filter((trip) => getTripStatus(trip) === 'upcoming')
                    .sort((a, b) => {
                      const dateA = parseTripDate(a?.userSelection?.startDate);
                      const dateB = parseTripDate(b?.userSelection?.startDate);
                      return (dateA || 0) - (dateB || 0);
                    })
                    .slice(0, 4)
                    .map((trip, idx) => {
                      const destination = trip?.userSelection?.location?.label || 'Unknown';
                      const startDate = trip?.userSelection?.startDate;
                      const days = trip?.userSelection?.noOfDays || 'N/A';
                      
                      return (
                        <div key={trip?.id} className='rounded-lg border border-slate-200 bg-slate-50 p-3 hover:border-blue-300 hover:bg-blue-50 transition-all'>
                          <p className='font-bold text-sm text-slate-900 line-clamp-1'>{destination}</p>
                          <p className='text-xs text-slate-600 mt-1'>📅 {startDate} • {days}d</p>
                          <p className='text-xs font-bold text-blue-700 mt-2'>{formatInr(getEstimatedTotal(trip))}</p>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content - Full Width */}
        <main className='flex-1 w-full'>
        <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <h1 className='text-4xl font-extrabold tracking-tight text-slate-900'>My Trips</h1>
            <p className='mt-1 text-lg text-slate-600'>Manage and track all your travel adventures</p>
          </div>
          <Button
            className='h-12 rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-6 text-base font-bold text-white shadow-lg shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl'
            onClick={() => navigate('/create-trip')}
          >
            + Plan New Trip
          </Button>
        </div>

        {/* Search and Filter */}
        <div className='mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)]'>
          <div className='flex flex-col gap-3 lg:flex-row'>
            <div className='relative flex-1'>
              <Search className='pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-slate-400' />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='h-12 w-full rounded-xl border border-slate-300 bg-slate-50 pl-11 pr-4 text-base text-slate-800 outline-none transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
                placeholder='Search trips by destination...'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Filter className='h-5 w-5 text-slate-500' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='h-12 rounded-xl border border-slate-300 bg-slate-50 px-4 text-base font-semibold text-slate-700 transition-all focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-500/10'
              >
                <option value='all'>All Trips</option>
                <option value='upcoming'>Upcoming</option>
                <option value='planning'>Planning</option>
                <option value='completed'>Completed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div className='mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)]'>
            <div className='mb-4 flex justify-center'>
              <div className='h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-500' />
            </div>
            <p className='text-lg font-semibold text-slate-600'>Loading your trips...</p>
          </div>
        ) : filteredTrips.length === 0 ? (
          <div className='mt-8 rounded-3xl border border-slate-200 bg-white p-12 text-center shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)]'>
            <p className='text-xl font-extrabold text-slate-900'>No trips matched your search</p>
            <p className='mt-2 text-slate-600'>Try adjusting your filter or create a new trip to get started!</p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3'>
            {filteredTrips.map((trip) => {
              const status = getTripStatus(trip);
              const progress = getPlanningProgress(trip);
              const destination = trip?.userSelection?.location?.label || 'Trip destination';
              const amount = formatInr(getEstimatedTotal(trip));
              const tags = getActivityTags(trip);
              const destinationFallback = getDestinationFallbackImage(destination, trip?.id);
              const thumbnail =
                tripCoverImages[trip?.id] ||
                trip?.tripData?.tripCoverImage ||
                trip?.tripData?.hotels?.[0]?.hotelImageUrl ||
                destinationFallback;

              return (
                <article key={trip?.id} className='group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_42px_-24px_rgba(15,23,42,0.35)] transition-all duration-300 hover:shadow-[0_28px_60px_-28px_rgba(15,23,42,0.45)] hover:border-blue-300 hover:-translate-y-1'>
                  {/* Image Section */}
                  <div className='relative overflow-hidden h-64 bg-slate-200'>
                    <img
                      src={thumbnail}
                      alt={destination}
                      className='h-full w-full object-cover transition-transform duration-500 group-hover:scale-125'
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = destinationFallback || fallbackImage;
                      }}
                    />

                    <div className='absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent' />

                    {/* Status Badge */}
                    <div className='absolute left-3 top-3 rounded-full border-2 border-white bg-white/95 px-3 py-1 text-xs font-extrabold capitalize text-slate-800 shadow-lg backdrop-blur-sm'>
                      {status}
                    </div>

                    {/* Progress Bar for Planning */}
                    {status === 'planning' ? (
                      <div className='absolute bottom-3 left-3 right-3 rounded-lg border border-white bg-white/95 p-2.5 backdrop-blur shadow-lg'>
                        <div className='mb-1.5 flex items-center justify-between'>
                          <span className='text-[11px] font-bold text-slate-700'>Planning Progress</span>
                          <span className='text-xs font-bold text-blue-600'>{progress}%</span>
                        </div>
                        <div className='h-2.5 rounded-full bg-slate-200'>
                          <div className='h-2.5 rounded-full bg-gradient-to-r from-blue-500 via-violet-500 to-purple-500 transition-all duration-500' style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  {/* Content Section */}
                  <div className='flex flex-col p-4'>
                    {/* Title & ID */}
                    <div className='mb-3'>
                      <h2 className='text-base font-extrabold text-slate-900 line-clamp-2'>{destination}</h2>
                      <p className='mt-0.5 text-xs text-slate-500 font-semibold'>ID: {trip?.id}</p>
                    </div>

                    {/* Info Cards */}
                    <div className='mb-3 space-y-2 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 p-3'>
                      <div className='flex items-center justify-between text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <Calendar className='h-3.5 w-3.5 text-blue-600 flex-shrink-0' />
                          <span className='font-bold text-slate-700'>Duration:</span>
                        </div>
                        <span className='font-extrabold text-blue-900'>{trip?.userSelection?.noOfDays || 'N/A'}d</span>
                      </div>

                      <div className='flex items-center justify-between text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <Users className='h-3.5 w-3.5 text-violet-600 flex-shrink-0' />
                          <span className='font-bold text-slate-700'>Travelers:</span>
                        </div>
                        <span className='font-extrabold text-violet-900'>{trip?.userSelection?.travelers || 'N/A'}</span>
                      </div>

                      <div className='border-t border-blue-200 pt-1.5 flex items-center justify-between text-xs'>
                        <div className='flex items-center gap-1.5'>
                          <IndianRupee className='h-3.5 w-3.5 text-amber-600 flex-shrink-0' />
                          <span className='font-bold text-slate-700'>Budget:</span>
                        </div>
                        <span className='rounded-lg bg-gradient-to-r from-amber-100 to-orange-100 px-2.5 py-0.5 text-xs font-extrabold text-amber-900 border border-amber-200'>{amount}</span>
                      </div>
                    </div>

                    {/* Dates Info */}
                    <div className='mb-2 rounded-lg bg-slate-50 border border-slate-200 p-2'>
                      <p className='flex items-center gap-1.5 text-xs'>
                        <span className='text-slate-600 font-semibold'>📅</span>
                        <span className='font-bold text-slate-900 text-xs'>{trip?.userSelection?.startDate || '--'} to {trip?.userSelection?.endDate || '--'}</span>
                      </p>
                    </div>

                    {/* Activities Tags */}
                    {tags.length > 0 && (
                      <div className='mb-2'>
                        <p className='mb-1.5 text-xs font-extrabold uppercase tracking-wider text-slate-600'>🎯 Activities</p>
                        <div className='flex flex-wrap gap-1'>
                          {tags.map((tag) => (
                            <span key={`${trip?.id}-${tag}`} className='inline-flex items-center rounded-full border border-blue-300 bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors'>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className='mt-auto grid grid-cols-4 gap-1'>
                      <Button
                        className='col-span-2 h-8 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-xs font-bold text-white hover:from-blue-700 hover:to-blue-800 shadow-lg hover:shadow-xl transition-all'
                        onClick={() => navigate(`/view-trip/${trip?.id}`)}
                      >
                        <Eye className='mr-1 h-3.5 w-3.5' /> View
                      </Button>
                      <button
                        type='button'
                        className='flex h-8 items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-600 transition-all hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 font-bold'
                        onClick={() => handleShareTrip(trip?.id)}
                        title='Share trip'
                      >
                        <Share2 className='h-3.5 w-3.5' />
                      </button>
                      <button
                        type='button'
                        className='flex h-8 items-center justify-center rounded-lg border border-rose-300 bg-white text-rose-600 transition-all hover:border-rose-500 hover:bg-rose-50 font-bold'
                        onClick={() => handleDeleteTrip(trip?.id)}
                        title='Delete trip'
                      >
                        <Trash2 className='h-3.5 w-3.5' />
                      </button>
                    </div>

                    <p className='mt-1.5 text-[10px] text-slate-400 text-center font-semibold'>Updated: {getTripDateTime(trip)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
        </main>
      </div>
    </section>
  );
}

export default MyTrips;
