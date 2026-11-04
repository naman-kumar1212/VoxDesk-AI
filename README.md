# VoxDesk AI – Voice‑First Customer Support Platform

[![Frontend React 18 + Vite](https://img.shields.io/badge/Frontend-React%2018%20%2B%20Vite-61dafb?style=flat-square&logo=react)](frontend/)
[![Backend Python 3.13 + Flask](https://img.shields.io/badge/Backend-Python%203.13%20%2B%20Flask-3776ab?style=flat-square&logo=python)](backend/)
[![Database Supabase PostgreSQL](https://img.shields.io/badge/Database-Supabase%20PostgreSQL-3ecf8e?style=flat-square&logo=supabase)](https://supabase.com)
[![Tests 39/39 Passing](https://img.shields.io/badge/Tests-39%2F39%20Passing-brightgreen?style=flat-square)](backend/tests/)
[![License MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)](LICENSE)

---

## 📖 Overview
VoxDesk AI is an **AI‑powered ticketing system** that lets customers **record a voice grievance**, automatically transcribes it, classifies the issue with **Google Gemini**, and routes the ticket to the correct department.  All components run on a **$0 free‑tier infrastructure** (Render, Supabase, Groq Whisper, Gemini Flash).

---

## ✨ Key Features
- **Voice‑first intake** – real‑time audio capture & Whisper STT.
- **AI classification** – Gemini generates structured intent & priority.
- **Real‑time admin dashboard** – KPIs, pagination, filters, analytics charts.
- **Server‑side pagination & caching** – low‑latency API responses.
- **Free‑tier deployment** – Render static backend, Vercel frontend, Supabase DB.

---

## 🏗️ Architecture
The high‑level design lives in the docs folder:
- [Architecture Blueprint](docs/ARCHITECTURE.md)
- [Product Requirements (PRD)](docs/PRD.md)
- [User Flow & State Machines](docs/USER_FLOW.md)

---

## 🚀 Getting Started
```bash
# Clone the repo
git clone https://github.com/naman-kumar1212/VoxDesk-AI.git
cd VoxDesk-AI

# Backend (Python 3.13+)
python -m venv venv
venv\Scripts\activate   # on Windows
pip install -r backend/requirements.txt
cp backend/.env.example backend/.env   # edit with your Supabase credentials
flask run                # starts http://localhost:5000

# Frontend (Node 18+)
cd frontend
npm ci
npm run dev              # starts http://localhost:5173
```

The admin UI is available at `http://localhost:5173/admin`.  Use the demo credentials supplied in `backend/tests/fixtures/admin.json`.

---

## 📦 Demo & Live Deployments
- **Live web app** – https://voxdesk-web-lac.vercel.app
- **Backend API** – https://voxdesk-api.vercel.app
- **Playwright demo video** – `frontend/public/voxdesk_demo_walkthrough.webm`

---

## 🤝 Contributing
1. Fork the repository.
2. Create a feature branch (`git checkout -b feat/awesome-feature`).
3. Follow the existing code style (flake8, prettier, TypeScript strict mode).
4. Run tests: `pytest backend/tests` and `npm run test` in the frontend.
5. Submit a Pull Request with a clear description.

---

## 📄 License
Distributed under the MIT License. See `LICENSE` for details.

---

## 📞 Contact
- **Author**: Naman Kumar – [GitHub](https://github.com/naman-kumar1212)
- **Discord**: `#voxdesk` on the VoxDesk community server

---

*Repository description (GitHub “About”):* "VoxDesk AI – AI‑powered ticketing & support platform with voice transcription, automated complaint classification, and real‑time admin analytics."
