# My Plane Collection — Personal Aviation Encyclopedia

A premium personal aviation encyclopedia and flight journal application, reconstructed from [flight-journal.lovable.app](https://flight-journal.lovable.app).

## Features

- **Personal Aviation Encyclopedia Landing Page**: Atmospheric hero sky banner, feature grid, tracking highlights, and interactive FAQ.
- **Flight Deck Dashboard (`/dashboard`)**:
  - Quick stats (Airlines collected, Aircraft types, Families, Completion %).
  - Progress bar tracking collected vs missing aircraft.
  - Interactive **Aircraft Popularity Section** with Recharts bar chart and ranked sightings leaderboard (Aircraft, Airlines, Manufacturers, Families) filterable by Most seen, Least seen, Recently added, and Alphabetical.
- **Airline Index (`/airlines`)**:
  - Numbered alphabetical carrier index with logos, country tags, status badges, fleet sizes, and collected counts.
  - Instant live search, filter by active/retired status, filter by country, and multi-mode sorting.
  - **Manual Airline Creator**: Full details dialog for airline name, country, founded year, alliance, IATA/ICAO codes, callsign, and history.
  - **AI Generate Airline**: Upload livery/tail photos or enter a hint to automatically identify carriers and generate complete fleet specifications.
- **Airline Detail Fleet View (`/airlines/:id`)**:
  - Carrier overview header with logo, operational statistics, and historical narrative.
  - Categorized **Active Fleet** and **Retired Fleet** galleries.
  - Add and edit individual airframe cards with specs (Family, Generation, Role passenger/cargo, Status active/retired).
- **Collected Aircraft Gallery (`/collected`)**:
  - Dedicated gallery of all aircraft marked as collected.
  - Filter by manufacturer (Airbus, Boeing, Embraer, ATR, Bombardier, McDonnell Douglas, Lockheed, Other) and search query.
- **Aviation Statistics & Insights (`/statistics`)**:
  - **Airbus vs Boeing Ratio**: Visual comparative breakdown bar and counter.
  - **Largest Collection**: Highlights your carrier with the highest number of collected airframes.
  - **Aircraft by Manufacturer**: Proportional distribution bars.
  - **Airlines by Country**: Country-by-country breakdown.
- **Airport Landing Radar Mini-Game (`/game`)**:
  - Interactive HTML5 canvas radar display with 360-degree airspace coverage.
  - Touch/pointer drag path drawing to route incoming flights into runway touch-down thresholds.
  - Dynamic physics, separation distance collision alarms, crash detection, and high score tracking (`landing-best`).
- **AI Aviation Assistant (`/assistant`)**:
  - Conversation threads and prompt suggestions ("Which airlines do I have?", "Airbus vs Boeing count", "What am I missing?", "Recommend next spot").
  - Intelligent contextual responses calculated against your active catalog.
- **Authentication (`/auth`)**:
  - Email/Password sign-in and sign-up with Supabase.
  - Google OAuth integration.
  - One-click demo exploration mode.

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- npm or pnpm

### Running Locally

```bash
# In this directory:
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Building for Production

```bash
npm run build
npm run preview
```

---

## Tech Stack

- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS with custom OKLCH color palettes (radar grid, horizon gradient, elevation shadows)
- **State & Data Fetching**: TanStack Query (React Query)
- **Database & Auth**: Supabase client (`@supabase/supabase-js`) + persistent LocalStorage fallback
- **Charts**: Recharts (Responsive vertical bar charts)
- **Icons**: Lucide React
- **Notifications**: Sonner toasts
