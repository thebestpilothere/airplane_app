import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { AirlinesPage } from './pages/AirlinesPage';
import { AirlineDetailPage } from './pages/AirlineDetailPage';
import { CollectedPage } from './pages/CollectedPage';
import { StatisticsPage } from './pages/StatisticsPage';
import { AssistantPage } from './pages/AssistantPage';
import { GamePage } from './pages/GamePage';

function DashboardLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public landing and auth */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />

        {/* Dashboard and collection app */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/airlines" element={<AirlinesPage />} />
          <Route path="/airlines/:id" element={<AirlineDetailPage />} />
          <Route path="/collected" element={<CollectedPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/assistant" element={<AssistantPage />} />
          <Route path="/assistant/:threadId" element={<AssistantPage />} />
          <Route path="/game" element={<GamePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
