import React from 'react';
import { Link } from 'react-router-dom';
import { Library, Plane, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';

const features = [
  {
    icon: Library,
    title: 'Airline index',
    copy: 'Numbered, searchable, filterable by country and status.',
  },
  {
    icon: Plane,
    title: 'Aircraft catalogue',
    copy: 'Manufacturer filters, families, generations and roles.',
  },
  {
    icon: BarChart3,
    title: 'Statistics',
    copy: 'Airbus vs Boeing, completion rate, top collections.',
  },
  {
    icon: Sparkles,
    title: 'AI assistant',
    copy: 'Ask what you have, what\'s missing and what to collect next.',
  },
];

const trackSections = [
  {
    title: 'Airline collection tracker',
    copy: 'Build a numbered, alphabetical index of every airline in your collection. Each airline page records its logo, country, headquarters, founding year, IATA and ICAO codes, alliance, fleet size and history — with active and retired fleets organised automatically.',
  },
  {
    title: 'Aircraft type encyclopedia',
    copy: 'Catalogue aircraft types as detailed cards: photos, manufacturer, family, generation, passenger or cargo role, and active or retired status. Mark each type collected as your collection grows and browse everything you own in one gallery.',
  },
  {
    title: 'Aviation statistics and insights',
    copy: 'See your collection at a glance — total airlines and aircraft, manufacturer breakdowns, airlines by country, and your completion percentage — rendered as clear, encyclopedia-style charts.',
  },
];

const faqs = [
  {
    q: 'What is My Plane Collection?',
    a: 'My Plane Collection is a personal aviation encyclopedia for aircraft and airline collectors. It lets you catalogue every airline and aircraft type you have collected, with logos, photos, fleet data and collection statistics in one dark, premium interface.',
  },
  {
    q: 'Which aircraft can I track in my collection?',
    a: 'You can track aircraft from any manufacturer — Airbus, Boeing, Embraer, ATR, Bombardier, McDonnell Douglas, Lockheed and others — organised by family, generation, and passenger or cargo role. Each aircraft can be marked as collected or not collected.',
  },
  {
    q: 'How do I add an airline to my collection?',
    a: 'Add airlines manually with name, country, IATA/ICAO codes and fleet details, or use the AI Generate Airline feature: upload a photo of a logo, livery or aircraft and the assistant identifies the airline, fills in its history and creates its aircraft cards automatically.',
  },
  {
    q: 'What statistics does the app show?',
    a: 'The statistics page shows total airlines and aircraft, an Airbus vs Boeing comparison, aircraft by manufacturer, airlines by country, your largest collection and your overall collection completion percentage.',
  },
  {
    q: 'Can the AI assistant answer questions about my collection?',
    a: 'Yes. You can ask which airlines you have, which Airbus or Boeing aircraft you\'ve collected or are missing, which airline has the most aircraft in your collection, and get recommendations for what to collect next.',
  },
  {
    q: 'Is my collection saved automatically?',
    a: 'Yes. Every change is saved instantly to your account, so your aviation encyclopedia is always up to date across desktop, tablet and mobile.',
  },
];

export function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background">
      {/* Background imagery */}
      <img
        src="/assets/hero-sky.jpg"
        alt="Airliner wing above the clouds at dusk"
        width={1920}
        height={1088}
        className="absolute inset-0 h-full w-full object-cover opacity-60 pointer-events-none"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background pointer-events-none" />
      <div className="grid-radar absolute inset-0 opacity-40 pointer-events-none" />

      {/* Main Container */}
      <div className="relative mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-8 sm:px-6">
        {/* Header */}
        <header className="flex items-center gap-3">
          <img src="/assets/logo.png" alt="My Plane Collection" width={40} height={40} className="h-10 w-10 object-contain" />
          <span className="font-display text-lg font-bold">My Plane Collection</span>
        </header>

        {/* Hero Section */}
        <div className="flex flex-1 flex-col justify-center py-16 sm:py-24">
          <p className="animate-rise font-display text-xs uppercase tracking-[0.35em] text-primary">
            Personal aviation encyclopedia
          </p>
          <h1 className="animate-rise mt-5 max-w-3xl text-4xl font-bold leading-[1.05] sm:text-6xl">
            Every airline. Every airframe.{' '}
            <span className="text-horizon">Catalogued.</span>
          </h1>
          <p className="animate-rise mt-6 max-w-xl text-base text-muted-foreground sm:text-lg leading-relaxed">
            Build an encyclopedia-grade record of the airlines and aircraft types you've collected — with instant search, deep statistics and an AI aviation assistant.
          </p>
          <div className="animate-rise mt-9 flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-horizon font-semibold text-primary-foreground hover:opacity-90">
              <Link to="/auth">Open your collection</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/dashboard">Explore Demo Mode</Link>
            </Button>
          </div>
        </div>

        {/* Features 4-column Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div key={item.title} className="panel hover-lift p-5 transition-all">
              <item.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 text-sm font-semibold">{item.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground leading-snug">{item.copy}</p>
            </div>
          ))}
        </div>

        {/* What you can track */}
        <section aria-label="What you can track" className="mt-16 sm:mt-24">
          <h2 className="font-display text-xs uppercase tracking-[0.35em] text-primary">
            What you can track
          </h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {trackSections.map((item) => (
              <article key={item.title} className="panel p-6">
                <h3 className="text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section aria-label="Frequently asked questions" className="mt-16 sm:mt-24 pb-12">
          <h2 className="font-display text-xs uppercase tracking-[0.35em] text-primary">
            Frequently asked questions
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {faqs.map((faq) => (
              <article key={faq.q} className="panel p-6">
                <h3 className="text-base font-semibold">{faq.q}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{faq.a}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border/40 py-6 text-center text-xs text-muted-foreground">
          My Plane Collection — your personal aviation encyclopedia for airlines and aircraft.
        </footer>
      </div>
    </div>
  );
}
