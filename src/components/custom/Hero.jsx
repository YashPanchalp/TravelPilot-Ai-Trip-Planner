import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, Globe2, MapPinned, PlaneTakeoff, Sparkles, Star, Users } from 'lucide-react'

function Hero() {
  return (
    <section className='relative overflow-hidden px-4 pt-8 pb-16 sm:px-6 lg:px-8 lg:pt-12 lg:pb-20'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,70,229,0.14),transparent_30%),radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.95),transparent_40%)]' />
      <div className='relative mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]'>
        <div className='space-y-8'>
          <div className='inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-indigo-700 shadow-sm'>
            <Sparkles className='h-3.5 w-3.5' />
            AI-powered travel designer
          </div>

          <div className='space-y-5'>
            <h1 className='max-w-3xl text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl lg:text-5xl lg:leading-[1.03]'>
              Plan trips that feel curated, calm, and beautifully AI-generated.
            </h1>
            <p className='max-w-2xl text-lg leading-8 text-slate-600 sm:text-xl'>
              Build premium itineraries with smart suggestions, polished trip cards, and a clean workflow inspired by the best modern travel and productivity products.
            </p>
          </div>

          <div className='flex flex-col gap-3 sm:flex-row'>
            <Link to='/create-trip' className='inline-flex'>
              <button type='button' className='inline-flex h-12 items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 text-sm font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/20'>
                Start Planning
                <ArrowRight className='h-4 w-4' />
              </button>
            </Link>
            <Link to='/my-trips' className='inline-flex'>
              <button type='button' className='inline-flex h-12 items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 text-sm font-semibold text-slate-700 transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-slate-50'>
                Explore Saved Trips
              </button>
            </Link>
          </div>

          <div className='grid gap-3 sm:grid-cols-3'>
            {[
              { icon: Users, label: 'Personalized for each traveler', value: 'Smart planning' },
              { icon: Globe2, label: 'Destinations with context', value: 'Global coverage' },
              { icon: BadgeCheck, label: 'Clean, reliable outputs', value: 'Polished itineraries' },
            ].map((item) => {
              const Icon = item.icon
              return (
                <div key={item.label} className='rounded-2xl border border-slate-200 bg-white/85 p-4 shadow-sm backdrop-blur-sm'>
                  <Icon className='h-5 w-5 text-indigo-600' />
                  <p className='mt-3 text-sm font-semibold text-slate-900'>{item.value}</p>
                  <p className='mt-1 text-sm text-slate-500'>{item.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className='relative'>
          <div className='absolute -inset-6 rounded-3xl bg-indigo-100/50 blur-3xl' />
          <div className='relative overflow-hidden rounded-4xl border border-slate-200 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.35)] sm:p-6'>
            <div className='flex items-center justify-between border-b border-slate-200 pb-4'>
              <div>
                <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-500'>Live preview</p>
                <h2 className='mt-1 text-xl font-semibold text-slate-950'>AI itinerary canvas</h2>
              </div>
              <div className='flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700'>
                <PlaneTakeoff className='h-4 w-4' />
                Ready in minutes
              </div>
            </div>

            <div className='mt-5 grid gap-4 sm:grid-cols-[1.1fr_0.9fr]'>
              <div className='overflow-hidden rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(79,70,229,0.92),rgba(99,102,241,0.86))] p-5 text-white'>
                <div className='flex items-start justify-between gap-4'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.2em] text-white/70'>Featured destination</p>
                    <h3 className='mt-2 text-2xl font-semibold'>Paris, France</h3>
                    <p className='mt-2 max-w-xs text-sm leading-6 text-white/80'>Elegant neighborhood stays, museum days, and slow travel moments in one structured plan.</p>
                  </div>
                  <div className='rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur'>
                    <MapPinned className='h-5 w-5' />
                  </div>
                </div>

                <div className='mt-6 grid gap-3'>
                  {[
                    ['Day 1', 'Arrival, Seine walk, sunset dinner'],
                    ['Day 2', 'Morning museum block, cafe lunch, river cruise'],
                    ['Day 3', 'Market stroll, AI-picked hidden gems, departure'],
                  ].map(([day, text]) => (
                    <div key={day} className='rounded-2xl border border-white/15 bg-white/10 p-3 backdrop-blur-sm'>
                      <p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75'>{day}</p>
                      <p className='mt-1 text-sm font-medium text-white'>{text}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className='grid gap-4'>
                <div className='rounded-2xl border border-slate-200 bg-slate-50 p-4'>
                  <div className='flex items-center gap-2 text-sm font-semibold text-slate-700'>
                    <Star className='h-4 w-4 text-amber-500' />
                    Trusted by travelers who want a cleaner planning flow
                  </div>
                  <p className='mt-3 text-sm leading-6 text-slate-600'>Less clutter, better hierarchy, and a more premium way to review every day of your trip.</p>
                </div>

                <div className='rounded-2xl border border-slate-200 bg-white p-4'>
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500'>Travel quality</p>
                      <p className='mt-1 text-lg font-semibold text-slate-950'>Balanced for comfort</p>
                    </div>
                    <span className='rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700'>4.9</span>
                  </div>
                  <div className='mt-4 space-y-3'>
                    {[
                      'Smarter day-by-day flow',
                      'Elegant cards with clear signals',
                      'Quick access to maps and bookings',
                    ].map((item) => (
                      <div key={item} className='flex items-center gap-3 text-sm text-slate-600'>
                        <span className='h-2.5 w-2.5 rounded-full bg-indigo-600' />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero