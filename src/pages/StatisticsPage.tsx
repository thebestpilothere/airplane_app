import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAirlines, getAircraft, computeCollectionStats } from '../lib/api';
import { Progress } from '../components/ui/progress';

function DistributionList({ data }: { data: [string, number][] }) {
  const max = Math.max(1, ...data.map(([, count]) => count));
  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <ul className="space-y-3">
      {data.map(([label, count]) => (
        <li key={label}>
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
            <span className="truncate">{label}</span>
            <span className="font-display font-bold text-primary">{count}</span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="bg-horizon h-full rounded-full transition-all duration-500"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function StatisticsPage() {
  const { data: airlines = [] } = useQuery({
    queryKey: ['airlines'],
    queryFn: getAirlines,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['aircraft'],
    queryFn: getAircraft,
  });

  const stats = useMemo(() => computeCollectionStats(airlines, aircraft), [airlines, aircraft]);

  const manufacturerDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const ac of aircraft.filter((a) => a.collected)) {
      map.set(ac.manufacturer, (map.get(ac.manufacturer) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [aircraft]);

  const countryDistribution = useMemo(() => {
    const map = new Map<string, number>();
    for (const al of airlines) {
      const country = al.country || 'Unknown';
      map.set(country, (map.get(country) ?? 0) + 1);
    }
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [airlines]);

  const largestCollection = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ac of aircraft.filter((a) => a.collected && a.airline_id)) {
      counts.set(ac.airline_id!, (counts.get(ac.airline_id!) ?? 0) + 1);
    }
    let top: { name: string; count: number } | null = null;
    for (const [airlineId, count] of counts) {
      if (!top || count > top.count) {
        top = {
          name: airlines.find((a) => a.id === airlineId)?.name ?? 'Unknown',
          count,
        };
      }
    }
    return top;
  }, [aircraft, airlines]);

  const airbusCount = manufacturerDistribution.find(([name]) => name === 'Airbus')?.[1] ?? 0;
  const boeingCount = manufacturerDistribution.find(([name]) => name === 'Boeing')?.[1] ?? 0;
  const totalAB = Math.max(1, airbusCount + boeingCount);

  const topCards = [
    { label: 'Total airlines', value: stats.airlines },
    { label: 'Total aircraft', value: stats.aircraftTotal },
    { label: 'Collected', value: stats.aircraftCollected },
    { label: 'Completion', value: `${stats.completion}%` },
  ];

  return (
    <div className="space-y-8 animate-rise pb-16">
      <header>
        <h1 className="text-2xl font-bold sm:text-3xl">Statistics</h1>
        <p className="mt-1 text-sm text-muted-foreground">The shape of your collection.</p>
      </header>

      {/* 4 Stat Panels */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {topCards.map((c) => (
          <div key={c.label} className="panel hover-lift p-6">
            <p className="font-display text-3xl font-bold">{c.value}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </section>

      {/* Comparisons */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Airbus vs Boeing Card */}
        <div className="panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Airbus vs Boeing
          </h2>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="font-display text-4xl font-bold text-primary">{airbusCount}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Airbus</p>
            </div>
            <div className="text-right">
              <p className="font-display text-4xl font-bold text-beacon">{boeingCount}</p>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Boeing</p>
            </div>
          </div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(airbusCount / totalAB) * 100}%` }}
            />
            <div
              className="h-full bg-beacon transition-all duration-500"
              style={{ width: `${(boeingCount / totalAB) * 100}%` }}
            />
          </div>
        </div>

        {/* Largest Collection Card */}
        <div className="panel p-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Largest collection
          </h2>
          <p className="mt-6 font-display text-2xl font-bold">{largestCollection?.name ?? '—'}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {largestCollection
              ? `${largestCollection.count} aircraft collected`
              : 'No aircraft assigned yet'}
          </p>
          <Progress value={stats.completion} className="mt-8" />
          <p className="mt-2 text-xs text-muted-foreground">
            {stats.completion}% of catalogued aircraft marked collected
          </p>
        </div>

        {/* Aircraft by Manufacturer */}
        <div className="panel p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Aircraft by manufacturer
          </h2>
          <DistributionList data={manufacturerDistribution} />
        </div>

        {/* Airlines by Country */}
        <div className="panel p-6">
          <h2 className="mb-5 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Airlines by country
          </h2>
          <DistributionList data={countryDistribution} />
        </div>
      </section>
    </div>
  );
}
