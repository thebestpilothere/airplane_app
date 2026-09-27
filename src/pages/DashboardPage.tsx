import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAirlines, getAircraft, computeCollectionStats } from '../lib/api';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Library, Plane, Layers, Sparkles, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { Aircraft, Airline } from '../types';
import { cn } from '../lib/utils';

type CategoryKey = 'aircraft' | 'airlines' | 'manufacturers' | 'families';
type SortKey = 'most' | 'least' | 'recent' | 'alpha';

interface LeaderboardItem {
  key: string;
  label: string;
  count: number;
  subtitle?: string;
  image?: string;
  createdAt?: string;
}

function processPopularityData(aircraft: Aircraft[], airlines: Airline[]): Record<CategoryKey, LeaderboardItem[]> {
  const airlineMap = new Map(airlines.map((a) => [a.id, a.name]));

  const aggregate = (
    keyFn: (ac: Aircraft) => string,
    labelFn: (ac: Aircraft) => string,
    subFn?: (ac: Aircraft) => string
  ): LeaderboardItem[] => {
    const map = new Map<string, LeaderboardItem>();
    for (const ac of aircraft) {
      const key = keyFn(ac).trim();
      if (!key) continue;
      const count = Math.max(1, ac.sightings ?? 1);
      const existing = map.get(key.toLowerCase());
      if (existing) {
        existing.count += count;
        if (!existing.image && ac.image_url) existing.image = ac.image_url;
      } else {
        map.set(key.toLowerCase(), {
          key,
          label: labelFn(ac),
          count,
          subtitle: subFn?.(ac),
          image: ac.image_url,
          createdAt: ac.created_at,
        });
      }
    }
    return Array.from(map.values());
  };

  return {
    aircraft: aggregate(
      (a) => a.name,
      (a) => a.name,
      (a) => [airlineMap.get(a.airline_id ?? '') ?? 'Unassigned', a.manufacturer].join(' · ')
    ),
    airlines: aggregate(
      (a) => airlineMap.get(a.airline_id ?? '') ?? '',
      (a) => airlineMap.get(a.airline_id ?? '') ?? 'Unassigned',
      (a) => a.manufacturer
    ),
    manufacturers: aggregate(
      (a) => a.manufacturer,
      (a) => a.manufacturer,
      (a) => a.family ?? ''
    ),
    families: aggregate(
      (a) => a.family ?? '',
      (a) => a.family ?? '',
      (a) => a.manufacturer
    ),
  };
}

function sortLeaderboard(items: LeaderboardItem[], sort: SortKey): LeaderboardItem[] {
  const list = [...items];
  if (sort === 'most') return list.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  if (sort === 'least') return list.sort((a, b) => a.count - b.count || a.label.localeCompare(b.label));
  if (sort === 'alpha') return list.sort((a, b) => a.label.localeCompare(b.label));
  if (sort === 'recent') return list.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  return list;
}

const CATEGORY_TABS: { key: CategoryKey; label: string }[] = [
  { key: 'aircraft', label: 'Aircraft' },
  { key: 'airlines', label: 'Airlines' },
  { key: 'manufacturers', label: 'Manufacturers' },
  { key: 'families', label: 'Families' },
];

const SORT_BUTTONS: { key: SortKey; label: string }[] = [
  { key: 'most', label: 'Most seen' },
  { key: 'least', label: 'Least seen' },
  { key: 'recent', label: 'Recently added' },
  { key: 'alpha', label: 'Alphabetical' },
];

export function DashboardPage() {
  const { data: airlines = [] } = useQuery({
    queryKey: ['airlines'],
    queryFn: getAirlines,
  });

  const { data: aircraft = [] } = useQuery({
    queryKey: ['aircraft'],
    queryFn: getAircraft,
  });

  const stats = useMemo(() => computeCollectionStats(airlines, aircraft), [airlines, aircraft]);

  const [activeCategory, setActiveCategory] = useState<CategoryKey>('aircraft');
  const [activeSort, setActiveSort] = useState<SortKey>('most');

  const groupedData = useMemo(() => processPopularityData(aircraft, airlines), [aircraft, airlines]);
  const sortedItems = useMemo(
    () => sortLeaderboard(groupedData[activeCategory], activeSort).slice(0, 10),
    [groupedData, activeCategory, activeSort]
  );

  const chartData = useMemo(
    () =>
      sortLeaderboard(groupedData[activeCategory], 'most')
        .slice(0, 6)
        .map((item) => ({ name: item.label, count: item.count })),
    [groupedData, activeCategory]
  );

  const statCards = [
    { icon: Library, label: 'Airlines collected', value: stats.airlines },
    { icon: Plane, label: 'Aircraft types', value: stats.types },
    { icon: Layers, label: 'Aircraft families', value: stats.families },
    { icon: TrendingUp, label: 'Completion', value: `${stats.completion}%` },
  ];

  return (
    <div className="space-y-8 animate-rise pb-12">
      {/* Flight deck Hero banner */}
      <section className="panel relative overflow-hidden">
        <img
          src="/assets/hero-sky.jpg"
          alt="Airliner wing"
          className="absolute inset-0 h-full w-full object-cover opacity-45 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/35 pointer-events-none" />

        <div className="relative p-6 sm:p-10 lg:p-12">
          <p className="font-display text-xs uppercase tracking-[0.35em] text-primary">Flight deck</p>
          <h1 className="mt-4 max-w-2xl text-3xl font-bold sm:text-5xl">
            Welcome back to your <span className="text-horizon">encyclopedia</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm text-muted-foreground sm:text-base leading-relaxed">
            {aircraft.length === 0
              ? 'Your logbook is empty — add your first airline to start cataloguing.'
              : `You've catalogued ${stats.aircraftCollected} of ${stats.aircraftTotal} aircraft across ${stats.airlines} airlines.`}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="outline" className="font-medium">
              <Link to="/assistant">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                AI Aviation Assistant
              </Link>
            </Button>
            <Button asChild variant="ghost">
              <Link to="/airlines">Browse airline index →</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 4 Stat Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => (
          <div key={card.label} className="panel hover-lift p-6 transition-all">
            <card.icon className="h-5 w-5 text-primary" />
            <p className="mt-4 font-display text-3xl font-bold">{card.value}</p>
            <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
              {card.label}
            </p>
          </div>
        ))}
      </section>

      {/* Collection completion progress */}
      <section className="panel p-6">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
          <h2 className="truncate text-sm font-semibold uppercase tracking-widest text-muted-foreground">
            Collection completion
          </h2>
          <span className="font-display text-lg font-bold text-primary">{stats.completion}%</span>
        </div>
        <Progress value={stats.completion} className="mt-4" />
        <p className="mt-3 text-sm text-muted-foreground">
          {stats.aircraftCollected} collected · {stats.aircraftTotal - stats.aircraftCollected} still to find
        </p>
      </section>

      {/* Aircraft Popularity Section */}
      {aircraft.length > 0 && (
        <section className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-semibold">Aircraft popularity</h2>
              <p className="text-sm text-muted-foreground">
                Your most spotted airframes, carriers and builders.
              </p>
            </div>

            <div className="flex flex-wrap gap-1">
              {SORT_BUTTONS.map((btn) => (
                <Button
                  key={btn.key}
                  size="sm"
                  variant={activeSort === btn.key ? 'default' : 'outline'}
                  onClick={() => setActiveSort(btn.key)}
                  className="text-xs"
                >
                  {btn.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Category Tabs */}
          <Tabs value={activeCategory} onValueChange={(val) => setActiveCategory(val as CategoryKey)}>
            <TabsList className="bg-surface-2 p-1">
              {CATEGORY_TABS.map((tab) => (
                <TabsTrigger key={tab.key} value={tab.key}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Recharts Bar Chart */}
          {chartData.length > 0 && (
            <div className="panel p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                Top {activeCategory} by frequency
              </p>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ left: 10, right: 30, top: 10, bottom: 10 }}>
                    <XAxis type="number" stroke="var(--muted-foreground)" fontSize={11} allowDecimals={false} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={140}
                      stroke="var(--muted-foreground)"
                      fontSize={11}
                      tickFormatter={(val) => (val.length > 18 ? val.slice(0, 18) + '…' : val)}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--surface-2)' }}
                      contentStyle={{
                        background: 'var(--popover)',
                        border: '1px solid var(--border)',
                        borderRadius: 8,
                        color: 'var(--popover-foreground)',
                        fontSize: 12,
                      }}
                    />
                    <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                      {chartData.map((_, index) => (
                        <Cell key={index} fill={`var(--chart-${(index % 5) + 1})`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Ranked List */}
          <ol className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {sortedItems.map((item, idx) => (
              <li key={item.key}>
                <div className="panel hover-lift flex items-center gap-3 p-3 transition-all">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-lg font-display text-sm font-bold',
                      idx === 0
                        ? 'bg-horizon text-primary-foreground'
                        : 'bg-surface-2 text-muted-foreground'
                    )}
                  >
                    {idx + 1}
                  </span>

                  <span className="grid h-12 w-16 shrink-0 place-items-center overflow-hidden rounded-lg border border-border bg-surface-2">
                    {item.image ? (
                      <img src={item.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    ) : (
                      <Plane className="h-4 w-4 text-primary/60" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{item.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">{item.subtitle}</span>
                  </span>

                  <span className="text-right">
                    <span className="block font-display text-lg font-bold text-primary">{item.count}</span>
                    <span className="block text-[10px] uppercase tracking-widest text-muted-foreground">
                      sightings
                    </span>
                  </span>
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
