# Patient Admission Management App

A clean, full-stack web application where hospital staff can manage admitted patients, built with **React.js** (frontend) and **Python + Flask + SQLite** (backend).

## Live Demo

- **Live App:** `<ADD_YOUR_DEPLOYED_FRONTEND_URL_HERE>`
- **Backend API:** `<ADD_YOUR_DEPLOYED_BACKEND_URL_HERE>`

---

## Tech Stack

- **Frontend:** React.js (Vite), CSS (responsive for mobile, tablet, and desktop)
- **Backend:** Python 3, Flask, Flask-CORS
- **Database:** SQLite (`patients.db` persisted on disk across server restarts)

---

## Features

1. **Add a Patient** — Admit new patients with Name, Age, Gender, Ward, Department, Doctor, Admission Date, and Status.
2. **View All Patients** — Clean table on desktop/tablet and stacked cards on mobile, plus summary counts (Total, Admitted, Discharged).
3. **Filter & Search** — Search patients by name and filter by Ward, Department, and Doctor simultaneously.
4. **Edit Patient** — Update any patient field via modal form.
5. **Mark as Discharged** — One-click discharge action on admitted patients.
6. **Delete Patient** — Confirmation dialog before permanently removing a record.
7. **Frontend & Backend Validation** —
   - **Name:** Required, letters and spaces only
   - **Age:** Required, whole number between 0 and 120
   - **Gender, Ward, Department, Doctor:** Required, must be selected from allowed lists
   - **Admission Date:** Required, cannot be a future date
   - Backend validates all inputs independently and returns clear HTTP `400` JSON error messages.

---

## Project Structure

```text
patient_man/
├── backend/
│   ├── app.py               # Flask API, SQLite persistence, and validation
│   ├── test_app.py          # Backend unit tests
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js       # Proxies /api requests to Flask in local dev
│   └── src/
│       ├── App.jsx          # Main dashboard, API calls, search & filters
│       ├── App.css          # Responsive styling (mobile, tablet, desktop)
│       ├── constants.js     # Allowed dropdown options
│       ├── validation.js    # Client-side validation rules
│       └── components/
│           ├── PatientFormModal.jsx
│           ├── PatientList.jsx
│           └── DeleteConfirmModal.jsx
└── README.md
```

---

## Steps to Run Locally

### 1. Start the Backend (Flask + SQLite)

```bash
cd backend
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
# source venv/bin/activate

pip install -r requirements.txt
python app.py
```

The backend runs on `http://127.0.0.1:5000`.
Patient records are saved to `backend/patients.db` and persist across server restarts.

To run backend tests:

```bash
python -m unittest discover -s backend -v
```

### 2. Start the Frontend (React.js)

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser. Vite automatically proxies `/api` requests to `http://127.0.0.1:5000`.

---

## Deployment Guide (Free Hosting)

1. **Backend (Render Web Service):**
   - Root Directory: `backend`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `gunicorn app:app`
2. **Frontend (Vercel / Netlify):**
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Environment Variable: `VITE_API_URL=https://your-render-backend.onrender.com`

---

## Screenshots

> Add screenshots of the deployed app (Desktop, Mobile, and Add/Edit Modal) before submitting:
> - `![Desktop View](screenshots/desktop.png)`
> - `![Mobile View](screenshots/mobile.png)`
