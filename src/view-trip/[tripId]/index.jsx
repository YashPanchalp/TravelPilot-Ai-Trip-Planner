import React, { useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/service/firebaseConfig'; // adjust path if different
import { toast } from 'sonner';
import { useState } from 'react';
import InformationSection from '../components/InformationSection';
import Hotels from '../components/Hotels';
import Itenary from '../components/Itenary';
import Footer from '../components/Footer';
import Flights from '@/components/custom/Flights';
import LocalTransportGuide from '../components/LocalTransportGuide';

function ViewTrip() {

  const { tripId } = useParams();
  const navigate = useNavigate();
  const pdfRef = useRef(null);

  const [tripData, setTripData] = useState([]);
  const [selectedOutboundFlight, setSelectedOutboundFlight] = useState(null);
  const [selectedReturnFlight, setSelectedReturnFlight] = useState(null);
  const [selectedHotel, setSelectedHotel] = useState(null);
  const [costBreakdown, setCostBreakdown] = useState({});
  const [activeTab, setActiveTab] = useState('flights');
  

  //every time update
  useEffect(() => {
     tripId && GetTripData();
   }, [tripId])

   // Set first hotel as default and load cost breakdown when trip data loads
   useEffect(() => {
     if (tripData?.tripData?.hotels && tripData.tripData.hotels.length > 0) {
       const firstHotel = tripData.tripData.hotels[0];
       const noOfDays = tripData?.userSelection?.noOfDays || 1;
       handleHotelSelection(firstHotel, noOfDays);
     }
     // Load saved cost breakdown from Firestore
     if (tripData?.tripData?.costBreakdown) {
       setCostBreakdown(tripData.tripData.costBreakdown);
     }
   }, [tripData?.tripData?.hotels?.length])

   // Scroll to top when tab changes
   useEffect(() => {
     window.scrollTo(0, 0);
   }, [activeTab])

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

// Function to calculate and update costs when flight is selected
const handleFlightSelection = (outbound, returnFlight) => {
  setSelectedOutboundFlight(outbound);
  setSelectedReturnFlight(returnFlight);
  
  const outboundPrice = extractPrice(outbound?.price);
  const returnPrice = extractPrice(returnFlight?.price);
  const flightCost = outboundPrice + returnPrice;
  const travelers = tripData?.userSelection?.travelers || 1;
  const costPerPerson = Math.round(flightCost / travelers);
  
  const updatedBreakdown = {
    ...costBreakdown,
    travelFlightInr: flightCost,
  };
  
  setCostBreakdown(updatedBreakdown);
  
  // Save to Firestore
  const updateTrip = async () => {
    try {
      const tripRef = doc(db, 'AiTrips', tripId);
      await updateDoc(tripRef, {
        'tripData.costBreakdown': updatedBreakdown,
      });
    } catch (error) {
      console.error('Error saving flight selection:', error);
    }
  };
  updateTrip();
  
  toast.success(`✈️ Flight selected! Added ₹${flightCost.toLocaleString('en-IN')} to expenses${travelers > 1 ? ` (₹${costPerPerson.toLocaleString('en-IN')} per person)` : ''}`);
};

// Function to calculate and update costs when hotel is selected
const handleHotelSelection = (hotel, noOfDays) => {
  setSelectedHotel(hotel);
  
  const hotelPrice = extractPrice(hotel?.price);
  const totalHotelCost = hotelPrice * noOfDays;
  const travelers = tripData?.userSelection?.travelers || 1;
  const costPerPerson = Math.round(totalHotelCost / travelers);
  
  const updatedBreakdown = {
    ...costBreakdown,
    hotelCostInr: totalHotelCost,
  };
  
  setCostBreakdown(updatedBreakdown);
  
  // Save to Firestore
  const updateTrip = async () => {
    try {
      const tripRef = doc(db, 'AiTrips', tripId);
      await updateDoc(tripRef, {
        'tripData.costBreakdown': updatedBreakdown,
      });
    } catch (error) {
      console.error('Error saving hotel selection:', error);
    }
  };
  updateTrip();
  
  toast.success(`🏨 Hotel selected! Added ₹${totalHotelCost.toLocaleString('en-IN')} (₹${hotelPrice}/day × ${noOfDays} days)${travelers > 1 ? ` - ₹${costPerPerson.toLocaleString('en-IN')} per person` : ''} to expenses`);
};

// Helper function to extract numeric price
const extractPrice = (price) => {
  if (!price) return 0;
  const priceStr = String(price);
  const numericPrice = parseInt(priceStr.replace(/[^0-9]/g, '')) || 0;
  return numericPrice;
};

// Helper function to extract numeric value from cost strings
const extractNumeric = (val) => {
  if (!val) return 0;
  return Number.parseInt(String(val).replaceAll(/\D/g, '')) || 0;
};

// Helper function to format cost as INR
const inr = (value) => {
  const numeric = extractNumeric(value);
  return `₹${numeric.toLocaleString('en-IN')}`;
};

// Calculate total trip cost
const calculateTotal = () => {
  let total = 0;
  const estimatedCost = {
    ...tripData?.tripData?.estimatedCostInr,
    ...costBreakdown,
  };

  // Add additional costs (flights, hotel selections)
  total += costBreakdown?.travelFlightInr || 0;
  total += costBreakdown?.hotelCostInr || 0;
  
  // Add original estimated costs
  // Only add accommodation if no hotel has been selected
  if (!costBreakdown?.hotelCostInr || costBreakdown?.hotelCostInr <= 0) {
    total += extractNumeric(estimatedCost?.accommodationInr);
  }
  
  total += extractNumeric(estimatedCost?.foodInr);
  total += extractNumeric(estimatedCost?.transportInr);
  total += extractNumeric(estimatedCost?.activitiesInr);
  total += extractNumeric(estimatedCost?.miscInr);
  
  return total.toLocaleString('en-IN');
};

// Generate and download PDF
const handleDownloadPDF = async () => {
  try {
    // Import html2pdf dynamically
    const html2pdf = (await import('html2pdf.js')).default;
    
    const tripName = tripData?.userSelection?.location?.label || 'Trip';
    const destination = tripName.split(',')[0];
    const element = document.createElement('div');
    
    // Helper to format day itinerary
    const formatDayItinerary = (dayPlans) => {
      if (!Array.isArray(dayPlans)) {
        dayPlans = Object.values(dayPlans || {});
      }
      return dayPlans.map((plan, idx) => `
        <div style="margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px; border-left: 3px solid #3b82f6;">
          <p style="margin: 0; font-size: 13px;"><strong>${idx + 1}. ${plan?.placeName || 'Activity'}</strong></p>
          <p style="margin: 3px 0; font-size: 12px; color: #666;">⏰ ${plan?.time || 'N/A'} | ${plan?.timeToVisit || 'N/A'}</p>
          ${plan?.placeDetails ? `<p style="margin: 3px 0; font-size: 11px; color: #666;">${plan.placeDetails}</p>` : ''}
          ${plan?.ticketPricing ? `<p style="margin: 3px 0; font-size: 11px; color: #16a34a;"><strong>💰 ${plan.ticketPricing}</strong></p>` : ''}
        </div>
      `).join('');
    };

    // Flight display helpers
    const formatDuration = (minutes) => {
      if (!minutes) return '';
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return hours + 'h ' + mins + 'm';
    };

    const getStopsText = (stops) => {
      if (stops === 0) return 'Non-stop';
      if (stops === 1) return '1 Stop';
      if (stops > 1) return stops + ' Stops';
      return '';
    };

    const generateFlightHTML = (flight, title, isReturn = false) => {
      if (!flight) return '<p style="color: #666; font-size: 11px;">No ' + title.toLowerCase() + ' selected</p>';
      const airlineName = flight.airlines?.[0]?.name || flight.airline || flight.name || 'Commercial Flight';
      const depTime = flight.departureTime || flight.departure_time || flight.departure || '';
      const arrTime = flight.arrivalTime || flight.arrival_time || flight.arrival || '';
      const depAirportCode = flight.departureAirportCode || '';
      const depAirportName = flight.departureAirport?.split(',')[0] || '';
      const arrAirportCode = flight.arrivalAirportCode || '';
      const arrAirportName = flight.arrivalAirport?.split(',')[0] || '';
      const durationStr = typeof flight.duration === 'number' ? formatDuration(flight.duration) : (flight.duration || '');
      const stopsText = getStopsText(flight.stops);
      const price = flight.price ? '₹' + Number.parseInt(flight.price).toLocaleString('en-IN') : '';
      const icon = isReturn ? '📥' : '📤';

      return '<div style="margin-bottom: 12px; break-inside: avoid; background: white; padding: 12px; border-radius: 6px; border: 1px solid #bfdbfe;">' +
        '<div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 8px;">' +
          '<h3 style="color: #1e40af; margin: 0; font-size: 13px;">' + icon + ' ' + title + '</h3>' +
          '<strong style="color: #059669; font-size: 14px;">' + price + '</strong>' +
        '</div>' +
        '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">' +
          '<div style="font-weight: bold; color: #334155; font-size: 12px;">' + airlineName + '</div>' +
          '<div style="font-size: 10px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; color: #475569;">' + stopsText + '</div>' +
        '</div>' +
        '<div style="display: flex; justify-content: space-between; align-items: center;">' +
          '<div style="text-align: left; width: 40%;">' +
            '<p style="margin: 0; font-weight: bold; font-size: 13px; color: #0f172a;">' + depTime + '</p>' +
            '<p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #1e40af;">' + depAirportCode + '</p>' +
            '<p style="margin: 0; font-size: 10px; color: #64748b;">' + depAirportName + '</p>' +
          '</div>' +
          '<div style="text-align: center; width: 20%; padding: 0 10px;">' +
            '<p style="margin: 0 0 2px 0; font-size: 9px; color: #64748b;">' + durationStr + '</p>' +
            '<div style="border-top: 2px solid #cbd5e1; position: relative;">' +
              '<span style="position: absolute; top: -7px; left: 50%; transform: translateX(-50%); background: white; padding: 0 2px; color: #94a3b8; font-size: 10px;">✈</span>' +
            '</div>' +
          '</div>' +
          '<div style="text-align: right; width: 40%;">' +
            '<p style="margin: 0; font-weight: bold; font-size: 13px; color: #0f172a;">' + arrTime + '</p>' +
            '<p style="margin: 2px 0 0 0; font-size: 11px; font-weight: bold; color: #1e40af;">' + arrAirportCode + '</p>' +
            '<p style="margin: 0; font-size: 10px; color: #64748b;">' + arrAirportName + '</p>' +
          '</div>' +
        '</div>' +
        (flight.legs && flight.legs.length > 0 ? 
          '<div style="margin-top: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0; font-size: 9px; color: #64748b;">' +
          flight.legs.map((leg, idx) => '<div style="margin-bottom: 2px;">' + (idx + 1) + '. ' + (leg.origin?.id || '') + ' → ' + (leg.destination?.id || '') + ' (' + (leg.airline?.name || airlineName) + ')</div>').join('') +
          '</div>' 
        : '') +
      '</div>';
    };

    // Create comprehensive PDF content
    element.innerHTML = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 900px; line-height: 1.4;">
        
        <!-- Cover Header -->
        <div style="text-align: center; margin-bottom: 25px; padding-bottom: 20px; border-bottom: 4px solid linear-gradient(to right, #1e40af, #0ea5e9); page-break-inside: avoid;">
          <h1 style="color: #1e40af; margin: 0; font-size: 32px; font-weight: bold;">✈️ ${destination}</h1>
          <p style="color: #0ea5e9; margin: 8px 0 0 0; font-size: 16px;">Complete Trip Itinerary</p>
          <p style="color: #64748b; margin: 3px 0; font-size: 11px;">AI Generated Travel Plan | ${new Date().toLocaleDateString()}</p>
        </div>

        <!-- Trip Overview -->
        <div style="background: linear-gradient(to right, #f0f9ff, #e0f2fe); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1e40af; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">📋 Trip Overview</h2>
          <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tr style="background: white;">
              <td style="padding: 6px; font-weight: bold; width: 40%;">Destination:</td>
              <td style="padding: 6px;">${tripName}</td>
            </tr>
            <tr>
              <td style="padding: 6px; font-weight: bold;">Duration:</td>
              <td style="padding: 6px;">${tripData?.userSelection?.noOfDays || 'N/A'} Days</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 6px; font-weight: bold;">Travelers:</td>
              <td style="padding: 6px;">${tripData?.userSelection?.travelers || 'N/A'} Person${(tripData?.userSelection?.travelers || 1) > 1 ? 's' : ''}</td>
            </tr>
            <tr>
              <td style="padding: 6px; font-weight: bold;">Start Date:</td>
              <td style="padding: 6px;">${tripData?.userSelection?.startDate || 'N/A'}</td>
            </tr>
            <tr style="background: white;">
              <td style="padding: 6px; font-weight: bold;">Budget Type:</td>
              <td style="padding: 6px;">${tripData?.userSelection?.budget || 'N/A'}</td>
            </tr>
          </table>
        </div>

        <!-- Flight Selection -->
        <div style="background: linear-gradient(to right, #dbeafe, #bfdbfe); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #1e40af; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="color: #1e40af; margin: 0 0 12px 0; font-size: 16px;">✈️ Flight Details</h2>
          ${selectedOutboundFlight ? generateFlightHTML(selectedOutboundFlight, 'Outbound Flight', false) : '<p style="color: #666; font-size: 11px;">No outbound flight selected</p>'}
          ${selectedReturnFlight ? generateFlightHTML(selectedReturnFlight, 'Return Flight', true) : ''}
        </div>

        <!-- Hotel Selection -->
        <div style="background: linear-gradient(to right, #dcfce7, #bbf7d0); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #16a34a; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="color: #16a34a; margin: 0 0 12px 0; font-size: 16px;">🏨 Hotel Details</h2>
          ${selectedHotel ? '<table style="width: 100%; font-size: 11px; border-collapse: collapse; break-inside: avoid;">' +
              '<tr style="background: white;">' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0; font-weight: bold; width: 30%;">Hotel Name:</td>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0;">' + (selectedHotel?.hotelName || 'Hotel') + '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0; font-weight: bold;">Address:</td>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0;">' + (selectedHotel?.hotelAddress || 'Address not available') + '</td>' +
              '</tr>' +
              '<tr style="background: white;">' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0; font-weight: bold;">Rating:</td>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0;">⭐ ' + (selectedHotel?.rating || 'N/A') + '</td>' +
              '</tr>' +
              '<tr>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0; font-weight: bold;">Description:</td>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0;">' + ((selectedHotel?.hotelDescription || 'No description').substring(0, 80)) + '...</td>' +
              '</tr>' +
              '<tr style="background: white;">' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0; font-weight: bold; color: #16a34a;">Price/Night:</td>' +
                '<td style="padding: 6px; border: 1px solid #bbf7d0; color: #16a34a; font-weight: bold;">' + (selectedHotel?.price || '₹0') + '</td>' +
              '</tr>' +
            '</table>' : '<p style="color: #666; font-size: 11px;">No hotel selected</p>'}
        </div>

        <!-- Day-wise Itinerary -->
        <div style="margin-bottom: 20px;">
          <h2 style="color: #1e40af; margin: 0 0 15px 0; font-size: 16px; border-bottom: 3px solid #1e40af; padding-bottom: 8px;">📅 Day-Wise Itinerary</h2>
          ${(tripData?.tripData?.itinerary || []).map((day, dayIdx) => {
            const dayPlans = Array.isArray(day?.plan) ? day.plan : Object.values(day?.plan || {});
            const dayLabel = day?.day || ('Day ' + (dayIdx + 1));
            const colors = ['#fef3c7', '#dbeafe', '#dcfce7', '#f3e8ff', '#fecaca'];
            const borderColors = ['#f59e0b', '#3b82f6', '#16a34a', '#a855f7', '#ef4444'];
            const bgColor = colors[dayIdx % colors.length];
            const borderColor = borderColors[dayIdx % borderColors.length];
            
            return '<div style="background: ' + bgColor + '; padding: 15px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid ' + borderColor + '; page-break-inside: avoid; break-inside: avoid;">' +
              '<h3 style="color: ' + borderColor + '; margin: 0 0 10px 0; font-size: 14px;">📌 ' + dayLabel + '</h3>' +
              '<div style="margin-bottom: 10px;">' +
              formatDayItinerary(dayPlans) +
              '</div>' +
              '</div>';
          }).join('')}
        </div>

        <!-- Complete Expense Breakdown -->
        <div style="background: linear-gradient(to right, #f0fdf4, #dbeafe); padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #16a34a; page-break-inside: avoid; break-inside: avoid;">
          <h2 style="color: #16a34a; margin: 0 0 12px 0; font-size: 16px;">💰 Expense Breakdown</h2>
          
          <!-- Expense Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 3px 0; font-size: 10px; color: #666;">✈️ Flights</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #1e40af;">₹${Number.parseInt(costBreakdown?.travelFlightInr || 0).toLocaleString('en-IN')}</p>
            </div>
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 3px 0; font-size: 10px; color: #666;">🏨 Hotel</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #16a34a;">₹${Number.parseInt(costBreakdown?.hotelCostInr || 0).toLocaleString('en-IN')}</p>
            </div>
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 3px 0; font-size: 10px; color: #666;">🍽️ Food</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #f59e0b;">${inr(tripData?.tripData?.estimatedCostInr?.foodInr)}</p>
            </div>
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 3px 0; font-size: 10px; color: #666;">🚕 Transport</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #0ea5e9;">${inr(tripData?.tripData?.estimatedCostInr?.transportInr)}</p>
            </div>
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 3px 0; font-size: 10px; color: #666;">🎭 Activities</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #a855f7;">${inr(tripData?.tripData?.estimatedCostInr?.activitiesInr)}</p>
            </div>
            <div style="background: white; padding: 10px; border-radius: 6px; border: 1px solid #e5e7eb;">
              <p style="margin: 0 0 3px 0; font-size: 10px; color: #666;">📦 Misc</p>
              <p style="margin: 0; font-size: 13px; font-weight: bold; color: #6b7280;">${inr(tripData?.tripData?.estimatedCostInr?.miscInr)}</p>
            </div>
          </div>

          <!-- Summary Table -->
          <table style="width: 100%; font-size: 11px; border-collapse: collapse; margin-bottom: 12px; break-inside: avoid;">
            <tr style="background: #f9fafb;">
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Daily Average</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right; font-weight: bold; color: #16a34a;">₹${calculateDailyAverage()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e5e7eb; font-weight: bold;">Total Duration</td>
              <td style="padding: 8px; border: 1px solid #e5e7eb; text-align: right;">${tripData?.tripData?.itinerary?.length || 0} Days</td>
            </tr>
            <tr style="background: #f0fdf4;">
              <td style="padding: 10px; border: 1px solid #bbf7d0; font-weight: bold; font-size: 12px; color: #16a34a;">TOTAL TRIP COST</td>
              <td style="padding: 10px; border: 1px solid #bbf7d0; text-align: right; font-weight: bold; font-size: 14px; color: #16a34a;">₹${calculateTotal()}</td>
            </tr>
          </table>

          ${(tripData?.userSelection?.travelers || 1) > 1 ? '<div style="background: #e0e7ff; padding: 8px; border-radius: 4px; text-align: center; font-size: 11px; break-inside: avoid;">' +
            '<strong>Cost per traveler:</strong> ₹' + Math.round(extractNumeric(calculateTotal()) / (tripData?.userSelection?.travelers || 1)).toLocaleString('en-IN') +
            '</div>' : ''}
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; font-size: 11px; color: #64748b;">
          <p style="margin: 5px 0;">✨ Generated by AI Trip Planner</p>
          <p style="margin: 3px 0; font-size: 10px;">${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          <p style="margin: 3px 0; font-size: 9px;">For ${tripData?.userSelection?.travelers || 1} Traveler${(tripData?.userSelection?.travelers || 1) > 1 ? 's' : ''} | ${tripData?.userSelection?.noOfDays || 0} Days</p>
        </div>

      </div>
    `;

    const options = {
      margin: [8, 5, 8, 5],
      filename: destination + '_Trip_' + new Date().toISOString().split('T')[0] + '.pdf',
      image: { type: 'jpeg', quality: 0.95 },
      html2canvas: { scale: 2, allowTaint: true, useCORS: true, logging: false },
      jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(options).from(element).save();
    toast.success('📥 Trip PDF downloaded successfully!');
  } catch (error) {
    console.error('Error generating PDF:', error);
    toast.error('Failed to download PDF');
  }
};

// Save trip and navigate to home
const handleSaveTrip = () => {
  try {
    toast.success('✅ Trip saved successfully!');
    setTimeout(() => {
      navigate('/');
    }, 1500);
  } catch (error) {
    console.error('Error saving trip:', error);
    toast.error('Failed to save trip');
  }
};

// Calculate daily average cost
const calculateDailyAverage = () => {
  let total = 0;
  const estimatedCost = {
    ...tripData?.tripData?.estimatedCostInr,
    ...costBreakdown,
  };

  // Add additional costs (flights, hotel selections)
  total += costBreakdown?.travelFlightInr || 0;
  total += costBreakdown?.hotelCostInr || 0;
  
  // Add original estimated costs
  // Only add accommodation if no hotel has been selected
  if (!costBreakdown?.hotelCostInr || costBreakdown?.hotelCostInr <= 0) {
    total += extractNumeric(estimatedCost?.accommodationInr);
  }
  
  total += extractNumeric(estimatedCost?.foodInr);
  total += extractNumeric(estimatedCost?.transportInr);
  total += extractNumeric(estimatedCost?.activitiesInr);
  total += extractNumeric(estimatedCost?.miscInr);
  
  const days = tripData?.tripData?.itinerary?.length || 1;
  const dailyAvg = Math.round(total / days);
  return dailyAvg.toLocaleString('en-IN');
};

  const tabs = [
    { id: 'flights', label: 'Travel Mode (flights)', icon: '✈️' },
    { id: 'itinerary', label: 'Days wise itinerary', icon: '📅' },
    { id: 'transport', label: 'Local Transport', icon: '🚗' },
    { id: 'expense', label: 'Expense', icon: '💰' },
  ];

  return (
    <div className='relative min-h-screen overflow-hidden bg-linear-to-b from-slate-50 via-white to-indigo-50/35 px-2 py-4 sm:px-6 md:px-8 lg:px-10 xl:px-12'>
      <div className='pointer-events-none absolute -left-20 top-8 h-48 w-48 rounded-full bg-sky-200/35 blur-3xl sm:-left-24 sm:top-12 sm:h-72 sm:w-72' />
      <div className='pointer-events-none absolute -right-20 top-32 h-48 w-48 rounded-full bg-indigo-200/30 blur-3xl sm:-right-24 sm:top-48 sm:h-80 sm:w-80' />
      <div className='pointer-events-none absolute bottom-4 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-emerald-200/20 blur-3xl sm:h-64 sm:w-64' />

      <div className='relative space-y-4 sm:space-y-8'>
        {/* Information Section  */}
        <InformationSection trip={tripData}/>

        {/* Tab Switcher - Capsule Shape Full Width */}
        <div className='flex justify-center px-2 sm:px-4'>
          <div className='w-full p-2 sm:p-3 rounded-full bg-white/80 backdrop-blur-md border-2 border-slate-200/50 shadow-lg hover:shadow-xl transition-all duration-300'>
            <div className='flex items-center gap-2 sm:gap-3'>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 relative group px-3 sm:px-6 py-2.5 sm:py-3 rounded-full font-bold text-xs sm:text-sm transition-all duration-300 flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                    activeTab === tab.id
                      ? tab.id === 'flights'
                        ? 'bg-linear-to-r from-blue-500 to-cyan-500 text-white shadow-[0_8px_24px_-6px_rgba(59,130,246,0.5)]'
                        : tab.id === 'itinerary'
                          ? 'bg-linear-to-r from-purple-500 to-violet-500 text-white shadow-[0_8px_24px_-6px_rgba(147,51,234,0.5)]'
                          : tab.id === 'transport'
                            ? 'bg-linear-to-r from-emerald-500 to-teal-500 text-white shadow-[0_8px_24px_-6px_rgba(16,185,129,0.5)]'
                            : 'bg-linear-to-r from-orange-500 to-red-500 text-white shadow-[0_8px_24px_-6px_rgba(249,115,22,0.5)]'
                      : 'bg-white/50 text-slate-700 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <span className='text-lg sm:text-xl'>{tab.icon}</span>
                  <span className='hidden sm:inline font-semibold'>{tab.label}</span>
                  <span className='inline sm:hidden text-[10px] font-semibold'>{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'flights' && (
          <div className='space-y-4 sm:space-y-8 animate-fadeIn'>
            {/* Flights Section */}
            <Flights tripData={tripData} userSelection={tripData?.userSelection} onFlightSelect={handleFlightSelection} selectedOutbound={selectedOutboundFlight} selectedReturn={selectedReturnFlight}/>
            
            {/* Navigation Button to Next Tab */}
            <div className='flex justify-center pt-4 sm:pt-8'>
              <button
                onClick={() => setActiveTab('itinerary')}
                className='px-8 sm:px-12 py-3 sm:py-4 bg-linear-to-r from-purple-500 to-violet-500 hover:from-purple-600 hover:to-violet-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
              >
                📅 Explore Day Wise Itinerary →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'itinerary' && (
          <div className='space-y-4 sm:space-y-8 animate-fadeIn'>
            {/* Hotels */}
            <Hotels trip={tripData} onHotelSelect={handleHotelSelection} selectedHotel={selectedHotel} noOfDays={tripData?.userSelection?.noOfDays}/>

            {/* Itinerary Full Width */}
            <Itenary trip={tripData} additionalCostBreakdown={costBreakdown} travelers={tripData?.userSelection?.travelers}/>
            
            {/* Navigation Button to Next Tab */}
            <div className='flex justify-center pt-4 sm:pt-8'>
              <button
                onClick={() => setActiveTab('transport')}
                className='px-8 sm:px-12 py-3 sm:py-4 bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
              >
                🚗 Discover Local Transport →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'transport' && (
          <div className='space-y-4 sm:space-y-8 animate-fadeIn'>
            {/* Local Transport Guide */}
            <LocalTransportGuide trip={tripData} tripId={tripId}/>
            
            {/* Navigation Button to Next Tab */}
            <div className='flex justify-center pt-4 sm:pt-8'>
              <button
                onClick={() => setActiveTab('expense')}
                className='px-8 sm:px-12 py-3 sm:py-4 bg-linear-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
              >
                💰 Review Expense Breakdown →
              </button>
            </div>
          </div>
        )}

        {activeTab === 'expense' && (
          <div className='space-y-4 sm:space-y-8 animate-fadeIn'>
            {/* Expense Breakdown Section */}
            <div className='rounded-3xl bg-linear-to-br from-emerald-50 via-teal-50 to-cyan-50 p-6 shadow-[0_12px_32px_-16px_rgba(16,185,129,0.2)] sm:p-8'>
              <h3 className='text-xl font-extrabold text-emerald-900 sm:text-2xl'>💰 Complete Cost Breakdown (₹)</h3>
              <p className='mt-2 text-xs text-emerald-700 font-medium'>Detailed breakdown of all expenses for your journey</p>
              
              {/* Cost Categories Grid */}
              <div className='mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3'>
                {/* Flights Cost */}
                {costBreakdown?.travelFlightInr > 0 && (
                  <div className='rounded-2xl bg-linear-to-br from-blue-50 to-sky-50 p-4 shadow-[0_6px_16px_-10px_rgba(59,130,246,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(59,130,246,0.25)] transition-all duration-300'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-sm font-bold uppercase tracking-wide text-blue-900'>✈️ Flights (Round-trip)</p>
                      <span className='inline-flex items-center rounded-full bg-blue-100/60 px-2 py-1 text-[10px] font-bold text-blue-900'>Total</span>
                    </div>
                    <p className='text-2xl font-extrabold text-blue-900'>₹{Number.parseInt(costBreakdown?.travelFlightInr || 0).toLocaleString('en-IN')}</p>
                    <p className='mt-2 text-xs text-blue-700'>Outbound & return flights for {tripData?.userSelection?.travelers || 1} traveler{(tripData?.userSelection?.travelers || 1) > 1 ? 's' : ''}</p>
                  </div>
                )}

                {/* Hotels Cost - Only show if selected */}
                {costBreakdown?.hotelCostInr > 0 && (
                  <div className='rounded-2xl bg-linear-to-br from-green-50 to-emerald-50 p-4 shadow-[0_6px_16px_-10px_rgba(34,197,94,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(34,197,94,0.25)] transition-all duration-300'>
                    <div className='flex items-center justify-between mb-2'>
                      <p className='text-sm font-bold uppercase tracking-wide text-green-900'>🏨 Hotel Selected</p>
                      <span className='inline-flex items-center rounded-full bg-green-200 px-2 py-1 text-[10px] font-bold text-green-900'>Total</span>
                    </div>
                    <p className='text-2xl font-extrabold text-green-900'>₹{Number.parseInt(costBreakdown?.hotelCostInr || 0).toLocaleString('en-IN')}</p>
                    <p className='mt-2 text-xs text-green-700'>Hotel accommodation total for all {tripData?.userSelection?.travelers || 1} traveler{(tripData?.userSelection?.travelers || 1) > 1 ? 's' : ''}</p>
                  </div>
                )}

                {/* Food & Dining */}
                <div className='rounded-2xl bg-linear-to-br from-amber-50 to-orange-50 p-4 shadow-[0_6px_16px_-10px_rgba(251,146,60,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(251,146,60,0.25)] transition-all duration-300'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-bold uppercase tracking-wide text-orange-900'>🍽️ Food & Dining</p>
                    {(tripData?.userSelection?.travelers || 1) > 1 && <span className='text-[10px] font-bold bg-orange-100/60 text-orange-900 px-2 py-1 rounded'>Per Person</span>}
                  </div>
                  <p className='text-2xl font-extrabold text-orange-900'>{inr(tripData?.tripData?.estimatedCostInr?.foodInr)}</p>
                  <p className='mt-2 text-xs text-orange-700'>All meals (breakfast, lunch, dinner){(tripData?.userSelection?.travelers || 1) > 1 ? ' per person' : ''}</p>
                </div>

                {/* Local Transport */}
                <div className='rounded-2xl bg-linear-to-br from-sky-50 to-blue-50 p-4 shadow-[0_6px_16px_-10px_rgba(59,130,246,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(59,130,246,0.25)] transition-all duration-300'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-bold uppercase tracking-wide text-blue-900'>🚕 Local Transport</p>
                    {(tripData?.userSelection?.travelers || 1) > 1 && <span className='text-[10px] font-bold bg-blue-100/60 text-blue-900 px-2 py-1 rounded'>Per Person</span>}
                  </div>
                  <p className='text-2xl font-extrabold text-blue-900'>{inr(tripData?.tripData?.estimatedCostInr?.transportInr)}</p>
                  <p className='mt-2 text-xs text-blue-700'>Taxis, buses, local travel{(tripData?.userSelection?.travelers || 1) > 1 ? ' per person' : ''}</p>
                </div>

                {/* Activities & Attractions */}
                <div className='rounded-2xl bg-linear-to-br from-purple-50 to-violet-50 p-4 shadow-[0_6px_16px_-10px_rgba(147,51,234,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(147,51,234,0.25)] transition-all duration-300'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-bold uppercase tracking-wide text-purple-900'>🎭 Activities & Attractions</p>
                    {(tripData?.userSelection?.travelers || 1) > 1 && <span className='text-[10px] font-bold bg-purple-100/60 text-purple-900 px-2 py-1 rounded'>Per Person</span>}
                  </div>
                  <p className='text-2xl font-extrabold text-purple-900'>{inr(tripData?.tripData?.estimatedCostInr?.activitiesInr)}</p>
                  <p className='mt-2 text-xs text-purple-700'>Tickets, tours, experiences{(tripData?.userSelection?.travelers || 1) > 1 ? ' per person' : ''}</p>
                </div>

                {/* Miscellaneous */}
                <div className='rounded-2xl bg-linear-to-br from-gray-50 to-slate-50 p-4 shadow-[0_6px_16px_-10px_rgba(100,116,139,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(100,116,139,0.25)] transition-all duration-300'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-bold uppercase tracking-wide text-gray-900'>📦 Miscellaneous</p>
                    {(tripData?.userSelection?.travelers || 1) > 1 && <span className='text-[10px] font-bold bg-gray-100/60 text-gray-900 px-2 py-1 rounded'>Per Person</span>}
                  </div>
                  <p className='text-2xl font-extrabold text-gray-900'>{inr(tripData?.tripData?.estimatedCostInr?.miscInr)}</p>
                  <p className='mt-2 text-xs text-gray-700'>Tips, souvenirs, contingency{(tripData?.userSelection?.travelers || 1) > 1 ? ' per person' : ''}</p>
                </div>

                {/* Per Day Average */}
                <div className='rounded-2xl bg-linear-to-br from-indigo-50 to-blue-50 p-4 shadow-[0_6px_16px_-10px_rgba(99,102,241,0.2)] hover:shadow-[0_10px_24px_-12px_rgba(99,102,241,0.25)] transition-all duration-300'>
                  <div className='flex items-center justify-between mb-2'>
                    <p className='text-sm font-bold uppercase tracking-wide text-indigo-900'>📅 Per Day Average</p>
                  </div>
                  <p className='text-2xl font-extrabold text-indigo-900'>₹{calculateDailyAverage()}</p>
                  <p className='mt-2 text-xs text-indigo-700'>Daily budget allocation</p>
                </div>
              </div>

              {/* Cost Summary & Total */}
              <div className='mt-8 rounded-2xl bg-linear-to-r from-emerald-50/80 to-teal-50/80 p-5 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.15)] sm:p-6'>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                  <div className='rounded-xl bg-white/60 backdrop-blur px-4 py-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]'>
                    <p className='text-xs text-emerald-700 font-semibold uppercase'>Total Breakdown {(tripData?.userSelection?.travelers || 1) > 1 && `(${tripData?.userSelection?.travelers} travelers)`}</p>
                    <div className='mt-3 space-y-2 text-xs text-emerald-800'>
                      {costBreakdown?.travelFlightInr > 0 && (
                        <div className='flex justify-between'><span>✈️ Flights (Total)</span><span className='font-bold'>₹{Number.parseInt(costBreakdown?.travelFlightInr || 0).toLocaleString('en-IN')}</span></div>
                      )}
                      {costBreakdown?.hotelCostInr > 0 && (
                        <div className='flex justify-between'><span>🏨 Hotel (Total)</span><span className='font-bold'>₹{Number.parseInt(costBreakdown?.hotelCostInr || 0).toLocaleString('en-IN')}</span></div>
                      )}
                      <div className='flex justify-between'><span>�️ Food{(tripData?.userSelection?.travelers || 1) > 1 ? ' (per person)' : ''}</span><span className='font-bold'>{inr(tripData?.tripData?.estimatedCostInr?.foodInr)}</span></div>
                      <div className='flex justify-between'><span>🚕 Transport{(tripData?.userSelection?.travelers || 1) > 1 ? ' (per person)' : ''}</span><span className='font-bold'>{inr(tripData?.tripData?.estimatedCostInr?.transportInr)}</span></div>
                      <div className='flex justify-between'><span>🎭 Activities{(tripData?.userSelection?.travelers || 1) > 1 ? ' (per person)' : ''}</span><span className='font-bold'>{inr(tripData?.tripData?.estimatedCostInr?.activitiesInr)}</span></div>
                      <div className='flex justify-between'><span>📦 Misc{(tripData?.userSelection?.travelers || 1) > 1 ? ' (per person)' : ''}</span><span className='font-bold'>{inr(tripData?.tripData?.estimatedCostInr?.miscInr)}</span></div>
                      <div className='border-t border-emerald-200 pt-2 flex justify-between font-extrabold text-emerald-900'>
                        <span>TOTAL</span>
                        <span>₹{calculateTotal()}</span>
                      </div>
                    </div>
                  </div>

                  <div className='rounded-xl bg-white/60 backdrop-blur px-4 py-3 shadow-[0_2px_8px_-4px_rgba(0,0,0,0.05)]'>
                    <p className='text-xs text-emerald-700 font-semibold uppercase'>Cost Highlights & Per Person Breakdown</p>
                    <div className='mt-3 space-y-2 text-xs'>
                      <div className='flex items-center justify-between'>
                        <span className='text-emerald-700'>Total travelers</span>
                        <span className='font-bold text-emerald-900'>{tripData?.userSelection?.travelers || 1} person{(tripData?.userSelection?.travelers || 1) > 1 ? 's' : ''}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-emerald-700'>Daily average {(tripData?.userSelection?.travelers || 1) > 1 ? '(per person)' : ''}</span>
                        <span className='font-bold text-emerald-900'>₹{calculateDailyAverage()}</span>
                      </div>
                      <div className='flex items-center justify-between'>
                        <span className='text-emerald-700'>Trip duration</span>
                        <span className='font-bold text-emerald-900'>{tripData?.tripData?.itinerary?.length || 0} Days</span>
                      </div>
                      {(tripData?.userSelection?.travelers || 1) > 1 && (
                        <div className='bg-linear-to-r from-indigo-100/60 to-purple-100/60 rounded-lg px-2 py-2 mt-2 shadow-[0_2px_6px_-3px_rgba(99,102,241,0.15)]'>
                          <p className='text-xs text-indigo-700 font-semibold'>
                            👥 Cost per traveler: ₹{Math.round(extractNumeric(calculateTotal()) / (tripData?.userSelection?.travelers || 1)).toLocaleString('en-IN')}
                          </p>
                        </div>
                      )}
                      <div className='bg-linear-to-r from-emerald-100/60 to-teal-100/60 rounded-lg px-2 py-2 mt-2 shadow-[0_2px_6px_-3px_rgba(16,185,129,0.15)]'>
                        <p className='text-xs text-emerald-700 font-semibold'>
                          💡 Budget Tip: Plan a ₹{Math.round(extractNumeric(calculateTotal()) * 1.1)} total buffer for unexpected costs
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Total Cost Banner */}
              <div className='mt-6 rounded-2xl bg-linear-to-r from-emerald-100/60 via-teal-50/60 to-cyan-100/60 p-6 shadow-[0_12px_32px_-16px_rgba(16,185,129,0.2)]'>
                <p className='text-center text-sm text-emerald-800 font-semibold uppercase tracking-wider'>Total Estimated Cost for Your Trip</p>
                <p className='mt-3 text-center text-4xl font-extrabold text-emerald-900'>
                  ₹{calculateTotal()}
                </p>
                <p className='mt-2 text-center text-xs text-emerald-700'>For {tripData?.tripData?.itinerary?.length || 0} days • {tripData?.userSelection?.travelers || 1} traveler{(tripData?.userSelection?.travelers || 1) > 1 ? 's' : ''}{(tripData?.userSelection?.travelers || 1) > 1 && ` • ₹${Math.round(extractNumeric(calculateTotal()) / (tripData?.userSelection?.travelers || 1)).toLocaleString('en-IN')} per person`}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className='flex flex-col sm:flex-row justify-center gap-4 pt-4 sm:pt-8'>
              <button
                onClick={handleSaveTrip}
                className='px-8 sm:px-12 py-3 sm:py-4 bg-linear-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
              >
                💾 Save Trip & Home
              </button>
              <button
                onClick={handleDownloadPDF}
                className='px-8 sm:px-12 py-3 sm:py-4 bg-linear-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-base sm:text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
              >
                📥 Download as PDF
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <Footer trip={tripData}/>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out;
        }
      `}</style>
    </div>

  )
}

export default ViewTrip