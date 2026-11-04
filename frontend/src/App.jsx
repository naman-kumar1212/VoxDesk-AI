import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import VoiceComplaint from './pages/VoiceComplaint';
import ReviewComplaint from './pages/ReviewComplaint';
import TicketConfirmation from './pages/TicketConfirmation';
import TrackTicket from './pages/TrackTicket';
import AdminDashboard from './pages/AdminDashboard';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  const [activeTranscript, setActiveTranscript] = useState('');
  const [createdTicketResult, setCreatedTicketResult] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Hide customer navbar on admin dashboard to match reference screen 6 */}
      {!isAdmin && <Navbar />}

      <main className="flex-1">
        <Routes>
          {/* Screen 1: Landing / Home Page */}
          <Route path="/" element={<Home />} />

          {/* Screen 2: Customer Voice Complaint (Record) */}
          <Route
            path="/report"
            element={<VoiceComplaint onTranscriptReady={setActiveTranscript} />}
          />

          {/* Screen 3: Customer Review Transcript & Submit */}
          <Route
            path="/review"
            element={
              <ReviewComplaint
                transcript={activeTranscript}
                onTicketCreated={setCreatedTicketResult}
              />
            }
          />

          {/* Screen 4: Customer Confirmation (Voice + Details) */}
          <Route
            path="/confirmation"
            element={<TicketConfirmation ticketResult={createdTicketResult} />}
          />

          {/* Screen 5: Track Ticket (Customer) */}
          <Route path="/track" element={<TrackTicket />} />

          {/* Screen 6: Admin Dashboard (Ticket Management) */}
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}
