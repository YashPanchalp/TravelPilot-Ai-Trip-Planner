import './App.css'
import Hero from './components/custom/Hero'

function App() {
  return (
    <main className='min-h-screen bg-linear-to-b from-slate-50 via-white to-indigo-50/40'>
      <Hero />

      <section className='px-4 pb-16 sm:px-8 lg:pb-24'>
        <div className='mx-auto max-w-6xl'>
          <div className='mx-auto max-w-3xl text-center'>
            <h3 className='text-3xl font-extrabold text-slate-900 sm:text-4xl'>Why Travelers Choose AI Trip Planner</h3>
            <p className='mt-3 text-slate-600'>A modern travel workspace with elegant visuals, fast planning flow, and detail-rich trip insights.</p>
          </div>

          <div className='mt-10 grid grid-cols-1 gap-5 md:grid-cols-3'>
            {[
              {
                title: 'Smart Itinerary Engine',
                desc: 'Generate day-wise plans tailored to budget, duration, and travel style with one click.',
                color: 'from-indigo-500 to-blue-500',
              },
              {
                title: 'Visual Trip Cards',
                desc: 'Preview hotels and destinations with rich imagery, ratings, and clickable map actions.',
                color: 'from-violet-500 to-fuchsia-500',
              },
              {
                title: 'Your Travel Timeline',
                desc: 'Keep every generated trip with date/time context and instantly reopen details anytime.',
                color: 'from-cyan-500 to-teal-500',
              },
            ].map((item) => (
              <article key={item.title} className='group rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_16px_45px_-20px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_50px_-16px_rgba(79,70,229,0.35)]'>
                <div className={`h-2 w-16 rounded-full bg-linear-to-r ${item.color}`} />
                <h4 className='mt-4 text-xl font-bold text-slate-900'>{item.title}</h4>
                <p className='mt-2 text-slate-600'>{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}

export default App
