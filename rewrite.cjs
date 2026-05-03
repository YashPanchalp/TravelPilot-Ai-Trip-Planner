const fs = require('fs');
const path = 'c:/Users/776ya/Home/Desktop/De Sem5/ai trip - planner code/ai-tip-planner/src/view-trip/components/Itenary.jsx';
const jsxContent = `import React from 'react';
import PlaceCard from './PlaceCard';

function Itenary({ trip }) {
  const itineraryData = trip?.tripData?.itinerary || {};
  
  const sortedDays = Object.entries(itineraryData).sort((a, b) => {
    const dayA = parseInt(a[0].replace(/[^0-9]/g, '')) || 0;
    const dayB = parseInt(b[0].replace(/[^0-9]/g, '')) || 0;
    return dayA - dayB;
  });

  return (
    <div>
      <h2 className="font-bold text-2xl mt-8 mb-6">Places to Visit</h2>
      
      <div className="relative border-l-2 border-slate-200 ml-4 pb-4">
        {sortedDays.map(([dayKey, dayDetails], index) => {
          return (
            <div key={dayKey} className="mb-10 ml-6 relative">
              <div className="absolute -left-[35px] top-1 h-5 w-5 rounded-full bg-slate-800 border-4 border-white shadow shadow-slate-300"></div>
              
              <h3 className="font-bold text-xl text-slate-800 capitalize mb-1">{dayKey.replace(/([a-z])([0-9])/i, '$1 $2')}</h3>
              <p className="text-slate-500 mb-6 text-sm">
                {dayDetails?.theme || dayDetails?.bestTime || ''}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {dayDetails.plan?.map((place, idx) => (
                  <div key={idx} className="relative z-10">
                    <PlaceCard place={place} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Itenary;
`;

fs.writeFileSync(path, jsxContent, 'utf-8');
console.log('Successfully rewritten Itenary.jsx');