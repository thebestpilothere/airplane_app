import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAirlineById, getAircraftByAirline, deleteAirline } from '../lib/api';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, Pencil, Trash2, Plus, Plane, Building2, Calendar, Globe } from 'lucide-react';
import { AircraftCard } from '../components/AircraftCard';
import { AddAirlineDialog } from '../components/AddAirlineDialog';
import { AddAircraftDialog } from '../components/AddAircraftDialog';
import { Aircraft } from '../types';
import { toast } from 'sonner';

export function AirlineDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [editAirlineOpen, setEditAirlineOpen] = useState(false);
  const [addAircraftOpen, setAddAircraftOpen] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<Aircraft | null>(null);

  const {
    data: airline,
    isLoading: loadingAirline,
    refetch: refetchAirline,
  } = useQuery({
    queryKey: ['airline', id],
    queryFn: () => getAirlineById(id!),
    enabled: !!id,
  });

  const {
    data: fleet = [],
    isLoading: loadingFleet,
    refetch: refetchFleet,
  } = useQuery({
    queryKey: ['fleet', id],
    queryFn: () => getAircraftByAirline(id!),
    enabled: !!id,
  });

  const activeFleet = fleet.filter((a) => a.status === 'active');
  const retiredFleet = fleet.filter((a) => a.status === 'retired');

  const handleDeleteAirline = async () => {
    if (!airline) return;
    if (!window.confirm(`Delete ${airline.name} and all its aircraft?`)) return;
    try {
      await deleteAirline(airline.id);
      toast.success('Airline deleted');
      navigate('/airlines');
    } catch {
      toast.error('Could not delete airline');
    }
  };

  const handleEditAircraft = (ac: Aircraft) => {
    setSelectedAircraft(ac);
    setAddAircraftOpen(true);
  };

  const handleRefresh = () => {
    refetchAirline();
    refetchFleet();
  };

  if (loadingAirline) {
    return <p className="text-sm text-muted-foreground p-8">Loading airline details…</p>;
  }

  if (!airline) {
    return (
      <div className="panel p-12 text-center space-y-4">
        <h2 className="text-xl font-bold">Airline not found</h2>
        <Button asChild>
          <Link to="/airlines">Return to Airline Index</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-rise pb-16">
      {/* Back button */}
      <div>
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link to="/airlines">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to airline index
          </Link>
        </Button>
      </div>

      {/* Airline Header Card */}
      <section className="panel p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-border bg-surface-2 p-2">
              {airline.logo_url ? (
                <img
                  src={airline.logo_url}
                  alt={airline.name}
                  className="h-full w-full object-contain"
                />
              ) : (
                <span className="font-display text-xl font-bold text-primary">
                  {airline.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold font-display">{airline.name}</h1>
                <Badge variant={airline.status === 'active' ? 'default' : 'secondary'}>
                  {airline.status === 'active' ? 'Active' : 'Retired'}
                </Badge>
                {airline.alliance && airline.alliance !== 'None' && (
                  <Badge variant="outline">{airline.alliance}</Badge>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 mt-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  {airline.country}
                </span>
                {airline.headquarters && (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3.5 w-3.5" />
                    {airline.headquarters}
                  </span>
                )}
                {airline.founded_year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" />
                    Founded {airline.founded_year}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-3 font-mono text-xs">
                {airline.iata_code && (
                  <span className="bg-surface-2 px-2 py-0.5 rounded border border-border">
                    IATA: {airline.iata_code}
                  </span>
                )}
                {airline.icao_code && (
                  <span className="bg-surface-2 px-2 py-0.5 rounded border border-border">
                    ICAO: {airline.icao_code}
                  </span>
                )}
                {airline.callsign && (
                  <span className="bg-surface-2 px-2 py-0.5 rounded border border-border">
                    CALL: {airline.callsign}
                  </span>
                )}
                {airline.fleet_size ? (
                  <span className="bg-surface-2 px-2 py-0.5 rounded border border-border">
                    Fleet: ~{airline.fleet_size}
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditAirlineOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" />
              Edit airline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDeleteAirline}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          </div>
        </div>

        {airline.description && (
          <p className="mt-6 text-sm text-muted-foreground border-t border-border/40 pt-4 leading-relaxed">
            {airline.description}
          </p>
        )}
      </section>

      {/* Airline History */}
      {airline.history && (
        <section className="panel p-6">
          <h2 className="text-xs uppercase font-semibold tracking-widest text-primary mb-3">
            Carrier History
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
            {airline.history}
          </p>
        </section>
      )}

      {/* Fleet Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border">
        <div>
          <h2 className="text-xl font-bold font-display">Airframe Catalogue</h2>
          <p className="text-sm text-muted-foreground">
            {fleet.length} total aircraft catalogued for this carrier.
          </p>
        </div>
        <Button onClick={() => { setSelectedAircraft(null); setAddAircraftOpen(true); }}>
          <Plus className="mr-2 h-4 w-4" />
          Add aircraft
        </Button>
      </div>

      {/* Active Fleet */}
      <section className="space-y-4">
        <h3 className="text-sm uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-2">
          <Plane className="h-4 w-4 text-primary" />
          Active Fleet ({activeFleet.length})
        </h3>
        {activeFleet.length === 0 ? (
          <p className="text-xs text-muted-foreground italic">No active airframes listed.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeFleet.map((ac) => (
              <AircraftCard
                key={ac.id}
                aircraft={ac}
                airlineName={airline.name}
                onEdit={handleEditAircraft}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        )}
      </section>

      {/* Retired Fleet */}
      {retiredFleet.length > 0 && (
        <section className="space-y-4 pt-4">
          <h3 className="text-sm uppercase tracking-wider font-semibold text-muted-foreground flex items-center gap-2">
            <Plane className="h-4 w-4 text-muted-foreground" />
            Retired & Historical Fleet ({retiredFleet.length})
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {retiredFleet.map((ac) => (
              <AircraftCard
                key={ac.id}
                aircraft={ac}
                airlineName={airline.name}
                onEdit={handleEditAircraft}
                onRefresh={handleRefresh}
              />
            ))}
          </div>
        </section>
      )}

      {/* Dialogs */}
      <AddAirlineDialog
        open={editAirlineOpen}
        onOpenChange={setEditAirlineOpen}
        airline={airline}
        onSuccess={handleRefresh}
      />

      <AddAircraftDialog
        open={addAircraftOpen}
        onOpenChange={setAddAircraftOpen}
        airlineId={airline.id}
        aircraft={selectedAircraft}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
