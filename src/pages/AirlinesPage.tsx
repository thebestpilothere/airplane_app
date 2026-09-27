import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAirlines, getAircraft } from '../lib/api';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Search, Sparkles, Plus, Plane } from 'lucide-react';
import { AddAirlineDialog } from '../components/AddAirlineDialog';
import { GenerateAirlineDialog } from '../components/GenerateAirlineDialog';
import { getInitials } from '../lib/utils';

export function AirlinesPage() {
  const [addOpen, setAddOpen] = useState(false);
  const [generateOpen, setGenerateOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [countryFilter, setCountryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'alpha' | 'collected' | 'country'>('alpha');

  const {
    data: airlines = [],
    isLoading,
    refetch: refetchAirlines,
  } = useQuery({
    queryKey: ['airlines'],
    queryFn: getAirlines,
  });

  const { data: aircraft = [], refetch: refetchAircraft } = useQuery({
    queryKey: ['aircraft'],
    queryFn: getAircraft,
  });

  const collectedCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const ac of aircraft) {
      if (ac.airline_id && ac.collected) {
        map.set(ac.airline_id, (map.get(ac.airline_id) ?? 0) + 1);
      }
    }
    return map;
  }, [aircraft]);

  const uniqueCountries = useMemo(() => {
    return Array.from(new Set(airlines.map((a) => a.country).filter(Boolean))).sort();
  }, [airlines]);

  const filteredAirlines = useMemo(() => {
    const q = search.trim().toLowerCase();
    return airlines
      .filter((a) => {
        const matchesSearch = !q || `${a.name} ${a.country} ${a.iata_code || ''} ${a.icao_code || ''}`.toLowerCase().includes(q);
        const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
        const matchesCountry = countryFilter === 'all' || a.country === countryFilter;
        return matchesSearch && matchesStatus && matchesCountry;
      })
      .sort((a, b) => {
        if (sortBy === 'country') {
          return a.country.localeCompare(b.country) || a.name.localeCompare(b.name);
        }
        if (sortBy === 'collected') {
          return (collectedCounts.get(b.id) ?? 0) - (collectedCounts.get(a.id) ?? 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [airlines, search, statusFilter, countryFilter, sortBy, collectedCounts]);

  const handleRefresh = () => {
    refetchAirlines();
    refetchAircraft();
  };

  return (
    <div className="space-y-6 animate-rise pb-12">
      {/* Header with Title and Actions */}
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold sm:text-3xl">Airline index</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {filteredAirlines.length} of {airlines.length} carriers
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" onClick={() => setGenerateOpen(true)}>
            <Sparkles className="mr-2 h-4 w-4 text-primary" />
            Generate airline
          </Button>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add airline
          </Button>
        </div>
      </header>

      {/* Filter and Search Bar */}
      <div className="panel grid gap-3 p-4 md:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search airlines…"
            className="pl-9"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all" className="bg-surface text-foreground">All statuses</option>
            <option value="active" className="bg-surface text-foreground">Active</option>
            <option value="retired" className="bg-surface text-foreground">Retired</option>
          </select>
        </div>

        <div>
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="all" className="bg-surface text-foreground">All countries</option>
            {uniqueCountries.map((c) => (
              <option key={c} value={c} className="bg-surface text-foreground">
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'alpha' | 'collected' | 'country')}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <option value="alpha" className="bg-surface text-foreground">Alphabetical</option>
            <option value="collected" className="bg-surface text-foreground">Aircraft collected</option>
            <option value="country" className="bg-surface text-foreground">Country</option>
          </select>
        </div>
      </div>

      {/* Airlines List */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading airline index…</p>
      ) : filteredAirlines.length === 0 ? (
        <div className="panel grid-radar p-12 text-center">
          <p className="font-display text-lg font-semibold">No airlines found</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Try adjusting your search criteria or add your first carrier to begin the index.
          </p>
        </div>
      ) : (
        <ol className="grid gap-3">
          {filteredAirlines.map((airline, idx) => {
            const collectedCount = collectedCounts.get(airline.id) ?? 0;
            return (
              <li key={airline.id}>
                <Link
                  to={`/airlines/${airline.id}`}
                  className="panel hover-lift grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-4 p-4 transition-all"
                >
                  <span className="w-8 shrink-0 text-center font-display text-sm font-bold text-muted-foreground">
                    {idx + 1}
                  </span>

                  <span className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-2">
                    {airline.logo_url ? (
                      <img
                        src={airline.logo_url}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-contain p-1"
                      />
                    ) : (
                      <span className="font-display text-xs font-bold text-primary">
                        {getInitials(airline.name)}
                      </span>
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-base font-semibold">{airline.name}</span>
                      <Badge
                        variant={airline.status === 'active' ? 'default' : 'secondary'}
                        className="text-[10px] uppercase"
                      >
                        {airline.status}
                      </Badge>
                      {airline.alliance && airline.alliance !== 'None' && (
                        <span className="hidden sm:inline-block text-xs text-muted-foreground">
                          · {airline.alliance}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {airline.country}
                      {airline.iata_code ? ` · ${airline.iata_code}` : ''}
                      {airline.icao_code ? ` / ${airline.icao_code}` : ''}
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1.5 justify-end">
                      <Plane className="h-3.5 w-3.5 text-primary" />
                      <span className="font-display text-base font-bold text-primary">
                        {collectedCount}
                      </span>
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                      collected
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {/* Dialogs */}
      <AddAirlineDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onSuccess={handleRefresh}
      />

      <GenerateAirlineDialog
        open={generateOpen}
        onOpenChange={setGenerateOpen}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
