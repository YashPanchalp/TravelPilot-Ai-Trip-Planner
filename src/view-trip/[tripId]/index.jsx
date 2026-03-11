import React, { useEffect } from 'react'
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig'; // adjust path if different
import { toast } from 'sonner';
import { useState } from 'react';
import InformationSection from '../components/InformationSection';
import Hotels from '../components/Hotels';
import Itenary from '../components/Itenary';
import Footer from '../components/Footer';

function ViewTrip() {

  const { tripId } = useParams();

  const [tripData, setTripData] = useState([]);
  

  //every time update
  useEffect(() => {
     tripId && GetTripData();
   }, [tripId])

    //get trip data from firebase
const GetTripData = async () => {
    const docRef = doc(db, "AiTrips", tripId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      console.log("Document data:", docSnap.data());
      setTripData(docSnap.data());
    } else {
      console.log("No such document!");
      toast.error("Trip not found");
      return null;
}

}
  return (
    <div className='relative min-h-screen overflow-hidden bg-linear-to-b from-slate-50 via-white to-indigo-50/35 px-3 py-8 sm:px-6 md:px-8 lg:px-10 xl:px-12'>
      <div className='pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl' />
      <div className='pointer-events-none absolute -right-24 top-48 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl' />
      <div className='pointer-events-none absolute bottom-8 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl' />

      <div className='relative space-y-8'>
        {/* Information Section  */}
        <InformationSection trip={tripData}/>

        {/* Hotels */}
        <Hotels trip={tripData}/>

        {/* Itenary Full Width */}
        <Itenary trip={tripData}/>

        {/* Footer */}
        <Footer trip={tripData}/>
      </div>
    </div>

  )
}

export default ViewTrip