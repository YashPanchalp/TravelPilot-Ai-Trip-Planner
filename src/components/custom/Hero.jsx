import React from 'react'
import { Link } from 'react-router-dom'

function Hero() {
  return (
    <section className='relative overflow-hidden px-4 py-16 sm:px-8 md:py-20'>
      <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(59,130,246,0.25),transparent_45%),radial-gradient(circle_at_80%_10%,rgba(168,85,247,0.20),transparent_35%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.22),transparent_40%)]' />
      <div className='pointer-events-none absolute -left-12 top-20 h-52 w-52 rounded-full bg-cyan-300/30 blur-3xl' />
      <div className='pointer-events-none absolute -right-16 bottom-10 h-64 w-64 rounded-full bg-fuchsia-300/30 blur-3xl' />

      <div className='relative mx-auto max-w-6xl'>
        <div className='rounded-3xl border border-white/60 bg-white/65 p-8 shadow-[0_24px_80px_-24px_rgba(30,41,59,0.45)] backdrop-blur-xl transition-all duration-500 hover:shadow-[0_30px_90px_-20px_rgba(79,70,229,0.35)] sm:p-12'>
          <p className='inline-flex rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-indigo-700'>
            AI-powered travel designer
          </p>

          <h2 className='mt-6 text-center text-4xl font-extrabold leading-tight text-slate-900 sm:text-5xl lg:text-6xl'>
            Plan Your Perfect Journey
             < span className='block bg-linear-to-r from-indigo-500 via-violet-500 to-pink-500 bg-clip-text text-transparent'>
              With Smart Itineraries
            </span>
          </h2>

          <p className='mx-auto mt-6 max-w-3xl text-center text-lg text-slate-600 sm:text-xl'>
            Discover destinations, build personalized plans, and manage your trip details with a polished AI assistant designed for real travel decisions.
          </p>

          <div className='mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row'>
            <Link to={'/create-trip'}>
              <button type='button' className='h-12 rounded-xl bg-linear-to-r from-indigo-500 to-violet-500 px-6 font-semibold text-white shadow-lg shadow-indigo-500/30 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-500/35'>
                Start Planning
              </button>
            </Link>
            <Link to={'/my-trips'}>
              <button type='button' className='h-12 rounded-xl border border-slate-300 bg-white/90 px-6 font-semibold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-slate-400 hover:shadow-md'>
                Explore Saved Trips
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero