import React, { useState } from 'react';
import { Plane, Download, Pencil, Trash2, Check } from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Aircraft } from '../types';
import { toggleAircraftCollected, deleteAircraft } from '../lib/api';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

interface AircraftCardProps {
  aircraft: Aircraft;
  airlineName?: string;
  onEdit?: (aircraft: Aircraft) => void;
  onRefresh?: () => void;
}

export function AircraftCard({
  aircraft,
  airlineName,
  onEdit,
  onRefresh,
}: AircraftCardProps) {
  const [downloading, setDownloading] = useState(false);
  const [loadingToggle, setLoadingToggle] = useState(false);

  const handleToggleCollected = async () => {
    setLoadingToggle(true);
    try {
      await toggleAircraftCollected(aircraft.id, !aircraft.collected);
      toast.success(
        aircraft.collected
          ? `Removed ${aircraft.name} from collected.`
          : `Marked ${aircraft.name} as collected!`
      );
      onRefresh?.();
    } catch {
      toast.error('Could not update the collection status.');
    } finally {
      setLoadingToggle(false);
    }
  };

  const handleDownload = async () => {
    if (!aircraft.image_url) return;
    setDownloading(true);
    const filename = `${aircraft.name.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`;
    try {
      const res = await fetch(aircraft.image_url);
      if (!res.ok) throw new Error('fetch failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(aircraft.image_url, '_blank', 'noopener');
    } finally {
      setDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete ${aircraft.name}?`)) return;
    try {
      await deleteAircraft(aircraft.id);
      toast.success('Aircraft removed');
      onRefresh?.();
    } catch {
      toast.error('Could not delete this aircraft.');
    }
  };

  return (
    <article className="panel hover-lift animate-rise flex flex-col overflow-hidden transition-all duration-300">
      {/* Media Aspect container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-surface-2">
        {aircraft.image_url ? (
          <img
            src={aircraft.image_url}
            alt={aircraft.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
          />
        ) : (
          <div className="grid-radar flex h-full w-full items-center justify-center">
            <Plane className="h-10 w-10 text-primary/50" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <Badge variant={aircraft.status === 'active' ? 'default' : 'secondary'}>
            {aircraft.status === 'active' ? 'Active' : 'Retired'}
          </Badge>
          <Badge variant="outline" className="bg-background/70 backdrop-blur">
            {aircraft.role === 'cargo' ? 'Cargo' : 'Passenger'}
          </Badge>
        </div>
      </div>

      {/* Details container */}
      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="min-w-0">
          <h3 className="truncate text-base font-semibold">{aircraft.name}</h3>
          <p className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
            {aircraft.manufacturer}
            {aircraft.family ? ` · ${aircraft.family}` : ''}
            {aircraft.generation ? ` · ${aircraft.generation}` : ''}
          </p>
          {airlineName && <p className="mt-1 text-xs text-primary font-medium">{airlineName}</p>}
        </div>

        {aircraft.description && (
          <p className="line-clamp-3 text-sm text-muted-foreground leading-relaxed">
            {aircraft.description}
          </p>
        )}

        <div className="mt-auto flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            size="sm"
            variant={aircraft.collected ? 'default' : 'outline'}
            className={cn(
              'flex-1 text-xs font-semibold',
              aircraft.collected && 'bg-horizon text-primary-foreground hover:opacity-90'
            )}
            onClick={handleToggleCollected}
            disabled={loadingToggle}
          >
            <Check className="mr-1 h-3.5 w-3.5" />
            {aircraft.collected ? 'Collected' : 'Not collected'}
          </Button>

          {aircraft.image_url && (
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={handleDownload}
              disabled={downloading}
              title="Download image"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
          )}

          {onEdit && (
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 shrink-0"
              onClick={() => onEdit(aircraft)}
              title="Edit aircraft"
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            title="Delete aircraft"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}
