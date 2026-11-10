# Page Dependency Trees

## 1. Landing Page (`src/pages/Home.jsx`)
- Dependencies: `Navbar.jsx`, `Footer.jsx`, `lucide-react`
- Context: `tailwind.config.js`, `index.css`, `design.md`

## 2. Voice Grievance Intake (`src/pages/VoiceComplaint.jsx`)
- Dependencies: `Navbar.jsx`, `AudioWaveform.jsx`, `api.js`, `lucide-react`

## 3. Transcript Review (`src/pages/ReviewComplaint.jsx`)
- Dependencies: `Navbar.jsx`, `StatusBadge.jsx`, `api.js`, `lucide-react`

## 4. Ticket Confirmation (`src/pages/TicketConfirmation.jsx`)
- Dependencies: `Navbar.jsx`, `StatusBadge.jsx`, `lucide-react`

## 5. Public Ticket Tracker (`src/pages/TrackTicket.jsx`)
- Dependencies: `Navbar.jsx`, `StatusBadge.jsx`, `api.js`, `lucide-react`

## 6. Admin Portal (`src/pages/AdminDashboard.jsx`)
- Dependencies: `AdminLayout.jsx`, `DashboardView.jsx`, `TicketsView.jsx`, `AnalyticsView.jsx`, `DepartmentsView.jsx`, `UsersView.jsx`
