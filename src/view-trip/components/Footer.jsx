import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className='mt-8 rounded-[1.75rem] border border-slate-200 bg-white p-5 text-center shadow-sm sm:p-6'>
      <h2 className='text-base font-semibold text-slate-950 sm:text-lg'>Created for seamless travel planning</h2>
      <p className='mt-2 text-sm leading-6 text-slate-600'>Your trip, designed with intelligent recommendations and calm, readable visual hierarchy.</p>
      <div className='mt-4 flex flex-wrap items-center justify-center gap-2'>
        <Link to='/create-trip' className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'>Create Trip</Link>
        <Link to='/my-trips' className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'>My Trips</Link>
      </div>
    </footer>
  )
}
