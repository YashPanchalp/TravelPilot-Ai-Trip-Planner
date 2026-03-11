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
    return `INR ${value.toLocaleString('en-IN')}`;
  };

  const getEstimatedTotal = (trip) => {
    const total =
      trip?.tripData?.estimatedCostInr?.totalEstimatedCostInr ||
      trip?.tripData?.estimatedCostInr?.total ||
      trip?.tripData?.estimatedCost?.totalEstimatedCostInr ||
      trip?.tripData?.estimatedCost?.total ||
      0;

    return parseAmount(total);
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
    const totalSpent = trips.reduce((sum, trip) => sum + getEstimatedTotal(trip), 0);

    return {
      total: trips.length,
      upcoming,
      completed,
      totalSpent,
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
    <section className='min-h-screen bg-linear-to-b from-slate-100 via-slate-50 to-white px-4 py-8 sm:px-8 md:px-12 lg:px-16'>
      <div className='mx-auto max-w-7xl'>
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-4xl font-extrabold tracking-tight text-slate-900'>My Trips</h1>
            <p className='mt-1 text-xl text-slate-600'>Manage and track all your travel adventures</p>
          </div>
          <Button
            className='h-11 rounded-xl bg-linear-to-r from-blue-600 to-violet-600 px-5 text-base font-bold text-white shadow-lg shadow-blue-500/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl'
            onClick={() => navigate('/create-trip')}
          >
            + Plan New Trip
          </Button>
        </div>

        <div className='rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_14px_35px_-22px_rgba(15,23,42,0.35)]'>
          <div className='flex flex-col gap-3 lg:flex-row'>
            <div className='relative flex-1'>
              <Search className='pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-400' />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className='h-11 w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 text-sm text-slate-800 outline-none transition-colors focus:border-blue-400'
                placeholder='Search trips by destination or title...'
              />
            </div>

            <div className='flex items-center gap-2'>
              <Filter className='h-4 w-4 text-slate-500' />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className='h-11 rounded-xl border border-slate-300 bg-slate-50 px-3 text-sm font-semibold text-slate-700'
              >
                <option value='all'>All Trips</option>
                <option value='upcoming'>Upcoming</option>
                <option value='planning'>Planning</option>
                <option value='completed'>Completed</option>
              </select>
            </div>
          </div>
        </div>

        <div className='mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-slate-500'>Total Trips</p>
              <div className='rounded-xl bg-blue-100 p-2 text-blue-600'><MapPin className='h-5 w-5' /></div>
            </div>
            <p className='mt-2 text-4xl font-extrabold text-slate-900'>{stats.total}</p>
          </article>

          <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-slate-500'>Upcoming</p>
              <div className='rounded-xl bg-emerald-100 p-2 text-emerald-600'><Calendar className='h-5 w-5' /></div>
            </div>
            <p className='mt-2 text-4xl font-extrabold text-slate-900'>{stats.upcoming}</p>
          </article>

          <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-slate-500'>Completed</p>
              <div className='rounded-xl bg-violet-100 p-2 text-violet-600'><CheckCircle2 className='h-5 w-5' /></div>
            </div>
            <p className='mt-2 text-4xl font-extrabold text-slate-900'>{stats.completed}</p>
          </article>

          <article className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
            <div className='flex items-center justify-between'>
              <p className='text-sm font-semibold text-slate-500'>Total Spent</p>
              <div className='rounded-xl bg-amber-100 p-2 text-amber-600'><IndianRupee className='h-5 w-5' /></div>
            </div>
            <p className='mt-2 text-4xl font-extrabold text-slate-900'>{formatInr(stats.totalSpent)}</p>
          </article>
        </div>

        {loading ? (
          <p className='mt-8 text-slate-600'>Loading your trips...</p>
        ) : filteredTrips.length === 0 ? (
          <div className='mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 shadow-sm'>
            No trips matched your search/filter.
          </div>
        ) : (
          <div className='mt-6 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3'>
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
                <article key={trip?.id} className='overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_42px_-24px_rgba(15,23,42,0.35)]'>
                  <div className='relative'>
                    <img
                      src={thumbnail}
                      alt={destination}
                      className='h-44 w-full object-cover'
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = destinationFallback || fallbackImage;
                      }}
                    />

                    <div className='absolute left-3 top-3 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-bold capitalize text-slate-700'>
                      {status}
                    </div>

                    {status === 'planning' ? (
                      <div className='absolute inset-x-3 bottom-3 rounded-xl border border-white/70 bg-white/90 p-2 backdrop-blur'>
                        <div className='mb-1 flex items-center justify-between text-xs font-semibold text-slate-600'>
                          <span>Planning Progress</span>
                          <span>{progress}%</span>
                        </div>
                        <div className='h-2 rounded-full bg-slate-200'>
                          <div className='h-2 rounded-full bg-linear-to-r from-blue-500 to-violet-500' style={{ width: `${progress}%` }} />
                        </div>
                      </div>
                    ) : null}
                  </div>

                  <div className='space-y-3 p-5'>
                    <h2 className='text-3xl font-extrabold leading-tight text-slate-900'>{destination}</h2>

                    <div className='space-y-2 text-sm text-slate-600'>
                      <p className='flex items-center gap-2'><MapPin className='h-4 w-4' /> {destination}</p>
                      <p className='flex items-center gap-2'><Calendar className='h-4 w-4' /> {trip?.userSelection?.startDate || '--'} - {trip?.userSelection?.endDate || '--'} ({trip?.userSelection?.noOfDays || 'N/A'} days)</p>
                      <p className='flex items-center gap-2'><Users className='h-4 w-4' /> {trip?.userSelection?.travelers || 'N/A'} travelers</p>
                      <p className='flex items-center justify-between gap-2'>
                        <span className='inline-flex items-center gap-2'><Clock3 className='h-4 w-4' /> Budget: {trip?.userSelection?.budget || 'N/A'}</span>
                        <span className='font-bold text-slate-800'>{amount}</span>
                      </p>
                    </div>

                    <div>
                      <p className='mb-2 text-sm font-bold text-slate-700'>Key Activities:</p>
                      <div className='flex flex-wrap gap-2'>
                        {tags.length ? tags.map((tag) => (
                          <span key={`${trip?.id}-${tag}`} className='rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700'>
                            {tag}
                          </span>
                        )) : (
                          <span className='rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600'>General sightseeing</span>
                        )}
                      </div>
                    </div>

                    <div className='grid grid-cols-[1fr_auto_auto] gap-2'>
                      <Button
                        className='h-10 rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700'
                        onClick={() => navigate(`/view-trip/${trip?.id}`)}
                      >
                        <Eye className='mr-1 h-4 w-4' /> View
                      </Button>
                      <button
                        type='button'
                        className='flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100'
                        onClick={() => handleShareTrip(trip?.id)}
                        title='Share trip'
                      >
                        <Share2 className='h-4 w-4' />
                      </button>
                      <button
                        type='button'
                        className='flex h-10 w-10 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition-colors hover:bg-rose-100'
                        onClick={() => handleDeleteTrip(trip?.id)}
                        title='Delete trip'
                      >
                        <Trash2 className='h-4 w-4' />
                      </button>
                    </div>

                    <p className='text-xs text-slate-500'>Generated: {getTripDateTime(trip)}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default MyTrips;
