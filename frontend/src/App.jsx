import React, { useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import VoiceComplaint from './pages/VoiceComplaint';
import ReviewComplaint from './pages/ReviewComplaint';
import TicketConfirmation from './pages/TicketConfirmation';
import TrackTicket from './pages/TrackTicket';
import AdminDashboard from './pages/AdminDashboard';
import NotFound from './pages/NotFound';

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isReport = location.pathname === '/report';

  const [activeTranscript, setActiveTranscript] = useState('');
  const [createdTicketResult, setCreatedTicketResult] = useState(null);

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col selection:bg-primary-100 selection:text-primary-900">
      {/* Hide customer navbar on admin dashboard to match reference Screen 6 */}
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

          {/* Screen 6: Admin Dashboard & All 5 Sections via shared layout */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/:tab" element={<AdminDashboard />} />

          {/* 404 Catch-All Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Main Footer on standard pages; minimal footer on recording page to prevent scroll overflow */}
      {!isAdmin && !isReport && <Footer />}
      {!isAdmin && isReport && (
        <footer className="py-3 text-center text-[11px] text-slate-400 border-t border-slate-100 bg-white">
          VoxDesk AI • Privacy Protected In-Memory Transcription • VocalLabs Hackathon Edition
        </footer>
      )}
    </div>
  );
}
