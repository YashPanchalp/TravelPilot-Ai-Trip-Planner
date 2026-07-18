import './App.css'
import Hero from './components/custom/Hero'
import { ArrowRight, CalendarDays, CheckCircle2, Compass, Globe2, HelpCircle, Link2, MapPinned, MessageCircle, MessageCircleQuestion, Send, ShieldCheck, Sparkles, Star } from 'lucide-react'

const howItWorks = [
  {
    title: 'Tell us your travel intent',
    desc: 'Choose destination, dates, budget, and traveler style to shape the first draft of your trip.',
    icon: Compass,
  },
  {
    title: 'Let AI shape the itinerary',
    desc: 'The planner organizes your days into meals, activities, and travel timing with a cleaner flow.',
    icon: Sparkles,
  },
  {
    title: 'Review, save, and go',
    desc: 'Refine your plan, reopen trip details later, and keep everything in one calm workspace.',
    icon: CheckCircle2,
  },
]

const features = [
  { title: 'AI trip planning', desc: 'Generate day-by-day plans with smart structure and clear hierarchy.', icon: Sparkles },
  { title: 'Travel-focused context', desc: 'See hotels, flights, and activities together in one view.', icon: MapPinned },
  { title: 'Fast trip recall', desc: 'Reopen saved trips with all of the detail you need at a glance.', icon: CalendarDays },
  { title: 'Calm visual system', desc: 'Clean cards, light borders, and restrained motion keep the UI premium.', icon: ShieldCheck },
]

const reasons = [
  'Inspired by modern travel and productivity products.',
  'Designed for clarity on desktop, tablet, and mobile.',
  'Focused on readable hierarchy rather than cluttered dashboards.',
  'Built around polished cards, subtle borders, and soft spacing.',
]

const destinations = [
  { name: 'Tokyo', note: 'Urban energy, efficient rail, and future-forward food scenes.', badge: 'City break' },
  { name: 'Paris', note: 'Museums, river walks, and elegant hotel-to-gallery pacing.', badge: 'Classic escape' },
  { name: 'Bali', note: 'Balanced days for beaches, cafes, and restorative stays.', badge: 'Relaxed retreat' },
  { name: 'Dubai', note: 'High-design stays, iconic architecture, and polished experiences.', badge: 'Luxury city' },
]

const stats = [
  { value: '3x', label: 'clearer trip hierarchy' },
  { value: '24/7', label: 'accessible saved trips' },
  { value: '100+', label: 'destination possibilities' },
  { value: '4.9', label: 'average planning clarity' },
]

const testimonials = [
  { quote: 'It finally feels like an AI travel product, not a generic CRUD dashboard.', name: 'Aarav', role: 'Weekend traveler' },
  { quote: 'The day-by-day layout is clean, premium, and easy to scan on mobile.', name: 'Maya', role: 'Family trip planner' },
  { quote: 'The itinerary cards look polished enough to share with a client or friend.', name: 'Noah', role: 'Frequent flyer' },
]

const faqs = [
  { question: 'What makes this look different from a normal trip app?', answer: 'The layout prioritizes travel planning hierarchy, whitespace, and premium card treatment instead of dense forms or tabs.' },
  { question: 'Can I still manage saved trips the same way?', answer: 'Yes. The UI is refactored only at the presentation layer, so existing trip actions and screens remain intact.' },
  { question: 'Is the itinerary view responsive?', answer: 'Yes. The grid, cards, and spacing adapt cleanly from mobile to wide screens.' },
  { question: 'Does the design support future enhancements?', answer: 'The structure leaves room for richer AI summaries, maps, and reviews without changing the current flow.' },
]

function App() {
  return (
    <main className='min-h-screen bg-transparent text-slate-900'>
      <Hero />

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700 shadow-sm'>
              <Sparkles className='h-3.5 w-3.5' />
              How it works
            </p>
            <h2 className='mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl'>Simple steps, premium travel output.</h2>
            <p className='mt-4 text-base leading-7 text-slate-600'>The experience is intentionally calm: easy to scan, clear to act on, and polished enough to feel like a real AI travel product.</p>
          </div>

          <div className='mt-10 grid gap-5 md:grid-cols-3'>
            {howItWorks.map((item, index) => {
              const Icon = item.icon
              return (
                <article key={item.title} className='group rounded-3xl border border-slate-200 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_45px_-28px_rgba(15,23,42,0.28)]'>
                  <div className='flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-700 transition-colors group-hover:bg-indigo-600 group-hover:text-white'>
                    <Icon className='h-5 w-5' />
                  </div>
                  <p className='mt-5 text-xs font-semibold uppercase tracking-[0.24em] text-slate-400'>Step {index + 1}</p>
                  <h3 className='mt-2 text-xl font-semibold text-slate-950'>{item.title}</h3>
                  <p className='mt-3 text-sm leading-6 text-slate-600'>{item.desc}</p>
              </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600'>
              <Globe2 className='h-3.5 w-3.5 text-indigo-600' />
              Features
            </p>
            <h2 className='mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl'>Designed for a refined travel planning workflow.</h2>
          </div>

          <div className='mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article key={feature.title} className='rounded-2xl border border-slate-200 bg-slate-50 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:bg-white'>
                  <Icon className='h-6 w-6 text-indigo-600' />
                  <h3 className='mt-4 text-lg font-semibold text-slate-950'>{feature.title}</h3>
                  <p className='mt-2 text-sm leading-6 text-slate-600'>{feature.desc}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.95fr_1.05fr]'>
          <div className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
            <p className='inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-indigo-700'>
              <ShieldCheck className='h-3.5 w-3.5' />
              Why choose us
            </p>
            <h2 className='mt-5 text-3xl font-semibold tracking-tight text-slate-950'>A cleaner interface for confident travel decisions.</h2>
            <p className='mt-4 text-sm leading-7 text-slate-600'>The interface is built to feel premium and calm, with thin borders, strong typography, and enough whitespace to make the planner feel intentional.</p>

            <div className='mt-8 space-y-3'>
              {reasons.map((reason) => (
                <div key={reason} className='flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3'>
                  <CheckCircle2 className='mt-0.5 h-5 w-5 text-indigo-600' />
                  <p className='text-sm leading-6 text-slate-700'>{reason}</p>
                </div>
              ))}
            </div>
          </div>

          <div className='grid gap-5 sm:grid-cols-2'>
            {destinations.map((destination, index) => (
              <article key={destination.name} className='group rounded-3xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-1 hover:border-indigo-200 hover:shadow-[0_24px_45px_-30px_rgba(15,23,42,0.3)]'>
                <div className='flex items-center justify-between gap-4'>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-[0.22em] text-slate-400'>Destination {index + 1}</p>
                    <h3 className='mt-2 text-2xl font-semibold text-slate-950'>{destination.name}</h3>
                  </div>
                  <span className='rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700'>{destination.badge}</span>
                </div>
                <p className='mt-4 text-sm leading-6 text-slate-600'>{destination.note}</p>
                <div className='mt-5 inline-flex items-center gap-2 text-sm font-semibold text-indigo-700'>
                  Preview route
                  <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-0.5' />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
          <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-4'>
            {stats.map((stat) => (
              <div key={stat.label} className='rounded-2xl border border-slate-200 bg-slate-50 p-5 text-center'>
                <p className='text-3xl font-semibold tracking-tight text-slate-950'>{stat.value}</p>
                <p className='mt-2 text-sm leading-6 text-slate-600'>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl'>
          <div className='mx-auto max-w-3xl text-center'>
            <p className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm'>
              <MessageCircleQuestion className='h-3.5 w-3.5 text-indigo-600' />
              Testimonials
            </p>
            <h2 className='mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl'>Designed to feel like a polished travel product.</h2>
          </div>

          <div className='mt-10 grid gap-5 md:grid-cols-3'>
            {testimonials.map((testimonial) => (
              <article key={testimonial.name} className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
                <Star className='h-5 w-5 text-amber-500' />
                <p className='mt-4 text-sm leading-7 text-slate-600'>“{testimonial.quote}”</p>
                <div className='mt-6 border-t border-slate-200 pt-4'>
                  <p className='font-semibold text-slate-950'>{testimonial.name}</p>
                  <p className='text-sm text-slate-500'>{testimonial.role}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <p className='inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-600 shadow-sm'>
              <HelpCircle className='h-3.5 w-3.5 text-indigo-600' />
              FAQ
            </p>
            <h2 className='mt-5 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl'>Everything is organized to be easy to review.</h2>
          </div>

          <div className='mt-10 space-y-4'>
            {faqs.map((faq) => (
              <details key={faq.question} className='group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'>
                <summary className='flex cursor-pointer list-none items-center justify-between gap-4 text-left text-base font-semibold text-slate-950'>
                  <span>{faq.question}</span>
                  <span className='flex h-8 w-8 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform duration-300 group-open:rotate-45'>
                    <ArrowRight className='h-4 w-4' />
                  </span>
                </summary>
                <p className='mt-4 max-w-3xl text-sm leading-7 text-slate-600'>{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className='px-4 pb-20 sm:px-6 lg:px-8'>
        <div className='mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8'>
          <div className='flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
            <div className='max-w-2xl'>
              <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-500'>Footer</p>
              <h2 className='mt-3 text-3xl font-semibold tracking-tight text-slate-950'>A minimal travel workspace with room to grow.</h2>
              <p className='mt-3 text-sm leading-7 text-slate-600'>Quick links, social channels, and a clean ending to the landing page keep the experience aligned with the rest of the planner.</p>
            </div>

            <div className='grid gap-3 sm:grid-cols-2'>
              {[
                ['Create Trip', '/create-trip'],
                ['My Trips', '/my-trips'],
                ['Sign In', '/sign-in'],
                ['View Trips', '/my-trips'],
              ].map(([label, href]) => (
                <a key={label} href={href} className='rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition-colors hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'>
                  {label}
                </a>
              ))}
            </div>
          </div>

          <div className='mt-8 flex flex-col gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between'>
            <p className='text-sm text-slate-500'>Built for modern AI trip planning with a cleaner visual language.</p>
            <div className='flex items-center gap-3'>
              {[Globe2, MessageCircle, Send, Link2].map((Icon, index) => (
                <a key={index} href='/' className='flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700'>
                  <Icon className='h-4 w-4' />
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
