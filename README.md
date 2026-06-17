# Job Tracker

A polished web app for new grads to research cities, compare cost of living, discover great companies, and track job applications — all in one place.

## Features

- **Google Authentication** — Sign in with your Google account; all data is private to you
- **City Research** — Browse 10 major metros with cost of living, rent, salary estimates, and new-grad fit scores
- **Salary Calculator** — See a detailed monthly budget breakdown per city including taxes, savings, and expenses
- **Company Database** — Curated list of new-grad-friendly companies with salary ranges, roles, and work styles
- **City Comparison** — Compare up to 4 saved cities side by side on salary, rent, job market, and more
- **Application Tracker** — Full CRUD for job applications with status, deadlines, recruiter contacts, and notes
- **Company Watchlist** — Save companies with priority levels, notes, and applied status
- **Mobile-first** — Fully responsive with a bottom nav on mobile and a sidebar on desktop

## Tech Stack

- **React 19** + **TypeScript**
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **Firebase Authentication** (Google Sign-In)
- **Cloud Firestore** for user data storage
- **React Router v7**
- **Lucide React** for icons
- **GitHub Pages** for deployment

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/leidaeunise22/job-tracker.git
cd job-tracker
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com/) and create a new project
2. Enable **Authentication** → Sign-in method → **Google**
3. Enable **Firestore Database** (start in test mode, then apply the rules below)
4. In Project Settings → Your apps → Web app, register a new app and copy the config

### 3. Environment Variables

Copy `.env.example` to `.env` and fill in your Firebase config:

```bash
cp .env.example .env
```

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules

Apply the rules from `firestore.rules` in the Firebase Console under Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /savedCities/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /savedCompanies/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    match /jobApplications/{docId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 5. Run locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173/job-tracker/`

## GitHub Pages Deployment

### 1. Enable GitHub Pages

In your GitHub repo settings → Pages → Source: **GitHub Actions** or set to `gh-pages` branch.

### 2. Add Firebase env variables to GitHub

Go to repo → Settings → Secrets and variables → Actions → New repository secret.
Add each `VITE_*` variable from your `.env` file.

### 3. Deploy

```bash
npm run deploy
```

This builds the app and pushes to the `gh-pages` branch. Your app will be live at:
`https://leidaeunise22.github.io/job-tracker/`

### 4. Firebase Authorized Domains

In Firebase Console → Authentication → Settings → Authorized domains, add:
```
leidaeunise22.github.io
```

## Project Structure

```
src/
├── components/
│   ├── layout/      # AppLayout (sidebar + bottom nav)
│   └── ui/          # Reusable: Modal, Toast, EmptyState, ScoreBar, StatusBadge, LoadingSpinner
├── data/            # Static seed data (cities.ts, companies.ts)
├── hooks/           # useAuth (AuthContext + provider)
├── pages/           # LandingPage, DashboardPage, CitiesPage, CompaniesPage, JobsPage, ComparePage
├── services/        # firebase.ts (init), firestore.ts (CRUD)
├── styles/          # index.css (Tailwind + global component classes)
├── types/           # index.ts (TypeScript interfaces)
└── utils/           # salaryCalculator.ts
```

## Future Improvements

- Add more cities and companies to the seed dataset
- Real-time Firestore listeners (currently uses one-time fetches)
- Export applications to CSV
- Kanban board view for applications
- Email reminders for follow-up dates
- Integration with job APIs (LinkedIn, Indeed) for salary data
- Dark mode support
