import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getAirlines, getAircraft } from '../lib/api';
import { Input } from '../components/ui/input';
import { Search, Plane } from 'lucide-react';
import { AircraftCard } from '../components/AircraftCard';
import { MANUFACTURERS } from '../types';

export function CollectedPage() {
  const [search, setSearch] = useState('');
  const [manufacturer, setManufacturer] = useState('all');

  const { data: airlines = [] } = useQuery({
    queryKey: ['airlines'],
    queryFn: getAirlines,
  });

  const { data: aircraft = [], refetch } = useQuery({
    queryKey: ['aircraft'],
    queryFn: getAircraft,
  });

  const airlineMap = useMemo(() => {
    return new Map(airlines.map((a) => [a.id, a.name]));
  }, [airlines]);

  const collectedAircraft = useMemo(() => {
    return aircraft.filter((a) => a.collected);
  }, [aircraft]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return collectedAircraft
      .filter((ac) => {
        const matchesMfr = manufacturer === 'all' || ac.manufacturer === manufacturer;
        const airlineName = airlineMap.get(ac.airline_id ?? '') ?? '';
        const matchesSearch =
          !q ||
          `${ac.name} ${ac.manufacturer} ${ac.family ?? ''} ${ac.generation ?? ''} ${airlineName}`
            .toLowerCase()
            .includes(q);
        return matchesMfr && matchesSearch;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [collectedAircraft, search, manufacturer, airlineMap]);

  return (
    <div className="space-y-6 animate-rise pb-16">
      <header className="min-w-0">
        <h1 className="truncate text-2xl font-bold sm:text-3xl">Collected aircraft</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} of {collectedAircraft.length} collected aircraft
          {collectedAircraft.length === 0
            ? ' — mark aircraft as collected from any airline page to build your collection.'
            : ''}
        </p>
      </header>

      {/* Search and Filters */}
      <div className="panel grid gap-3 p-4 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search collected aircraft…"
            className="pl-9"
          />
        </div>

        <div>
          <select
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all" className="bg-surface text-foreground">All manufacturers</option>
            {MANUFACTURERS.map((m) => (
              <option key={m} value={m} className="bg-surface text-foreground">
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Aircraft */}
      {filtered.length === 0 ? (
        <div className="panel grid-radar p-12 text-center">
          <Plane className="h-10 w-10 text-primary/40 mx-auto mb-3" />
          <p className="font-display text-lg font-semibold">No collected aircraft found</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            {collectedAircraft.length === 0
              ? 'Browse your airline fleets and click "Not collected" on any aircraft to log it here.'
              : 'Try clearing your search query or manufacturer filter.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((ac) => (
            <AircraftCard
              key={ac.id}
              aircraft={ac}
              airlineName={airlineMap.get(ac.airline_id ?? '')}
              onRefresh={refetch}
            />
          ))}
        </div>
      )}
    </div>
  );
}
