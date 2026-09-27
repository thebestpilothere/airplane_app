import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Airline } from '../types';
import { saveAirline } from '../lib/api';
import { toast } from 'sonner';

interface AddAirlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  airline?: Airline | null;
  onSuccess: () => void;
}

export function AddAirlineDialog({
  open,
  onOpenChange,
  airline,
  onSuccess,
}: AddAirlineDialogProps) {
  const [formData, setFormData] = useState<Partial<Airline>>({
    name: '',
    country: '',
    status: 'active',
    headquarters: '',
    founded_year: new Date().getFullYear(),
    alliance: '',
    iata_code: '',
    icao_code: '',
    callsign: '',
    fleet_size: 0,
    logo_url: '',
    description: '',
    history: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (airline) {
      setFormData(airline);
    } else {
      setFormData({
        name: '',
        country: '',
        status: 'active',
        headquarters: '',
        founded_year: 1990,
        alliance: '',
        iata_code: '',
        icao_code: '',
        callsign: '',
        fleet_size: 50,
        logo_url: '',
        description: '',
        history: '',
      });
    }
  }, [airline, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Please enter the airline name');
      return;
    }
    setSaving(true);
    try {
      await saveAirline(formData, airline?.id);
      toast.success(airline ? 'Airline updated successfully' : 'Airline added to index!');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('Failed to save airline.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{airline ? 'Edit Airline' : 'Add Airline'}</DialogTitle>
          <DialogDescription>
            {airline
              ? 'Update specifications, history, and codes for this airline.'
              : 'Add a new carrier to your personal encyclopedia index.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="al-name">Airline Name *</Label>
            <Input
              id="al-name"
              placeholder="e.g. Singapore Airlines"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="al-country">Country</Label>
              <Input
                id="al-country"
                placeholder="e.g. Singapore"
                value={formData.country || ''}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-status">Status</Label>
              <select
                id="al-status"
                value={formData.status || 'active'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'retired' })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active" className="bg-surface text-foreground">Active</option>
                <option value="retired" className="bg-surface text-foreground">Retired / Defunct</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="al-hq">Headquarters</Label>
              <Input
                id="al-hq"
                placeholder="e.g. Changi, Singapore"
                value={formData.headquarters || ''}
                onChange={(e) => setFormData({ ...formData, headquarters: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-founded">Founded Year</Label>
              <Input
                id="al-founded"
                type="number"
                placeholder="1972"
                value={formData.founded_year || ''}
                onChange={(e) =>
                  setFormData({ ...formData, founded_year: parseInt(e.target.value) || undefined })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="al-iata">IATA Code</Label>
              <Input
                id="al-iata"
                maxLength={3}
                placeholder="SQ"
                value={formData.iata_code || ''}
                onChange={(e) =>
                  setFormData({ ...formData, iata_code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-icao">ICAO Code</Label>
              <Input
                id="al-icao"
                maxLength={4}
                placeholder="SIA"
                value={formData.icao_code || ''}
                onChange={(e) =>
                  setFormData({ ...formData, icao_code: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-callsign">Callsign</Label>
              <Input
                id="al-callsign"
                placeholder="SINGAPORE"
                value={formData.callsign || ''}
                onChange={(e) =>
                  setFormData({ ...formData, callsign: e.target.value.toUpperCase() })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-fleet">Fleet Size</Label>
              <Input
                id="al-fleet"
                type="number"
                placeholder="150"
                value={formData.fleet_size || ''}
                onChange={(e) =>
                  setFormData({ ...formData, fleet_size: parseInt(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="al-alliance">Alliance</Label>
              <Input
                id="al-alliance"
                placeholder="e.g. Star Alliance, SkyTeam, oneworld"
                value={formData.alliance || ''}
                onChange={(e) => setFormData({ ...formData, alliance: e.target.value })}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="al-logo">Logo Image URL</Label>
              <Input
                id="al-logo"
                placeholder="https://..."
                value={formData.logo_url || ''}
                onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="al-desc">Short Description</Label>
            <Textarea
              id="al-desc"
              rows={2}
              placeholder="Brief overview of the carrier..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="al-history">Airline History</Label>
            <Textarea
              id="al-history"
              rows={3}
              placeholder="Historical background, key milestones..."
              value={formData.history || ''}
              onChange={(e) => setFormData({ ...formData, history: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Airline'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
