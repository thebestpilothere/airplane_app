import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Aircraft, MANUFACTURERS } from '../types';
import { saveAircraft } from '../lib/api';
import { toast } from 'sonner';

interface AddAircraftDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  airlineId: string;
  aircraft?: Aircraft | null;
  onSuccess: () => void;
}

export function AddAircraftDialog({
  open,
  onOpenChange,
  airlineId,
  aircraft,
  onSuccess,
}: AddAircraftDialogProps) {
  const [formData, setFormData] = useState<Partial<Aircraft>>({
    name: '',
    manufacturer: 'Airbus',
    family: '',
    generation: '',
    role: 'passenger',
    status: 'active',
    collected: false,
    image_url: '',
    description: '',
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (aircraft) {
      setFormData(aircraft);
    } else {
      setFormData({
        name: '',
        manufacturer: 'Airbus',
        family: '',
        generation: '',
        role: 'passenger',
        status: 'active',
        collected: false,
        image_url: '',
        description: '',
      });
    }
  }, [aircraft, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim()) {
      toast.error('Aircraft name is required.');
      return;
    }

    setSaving(true);
    try {
      await saveAircraft({ ...formData, airline_id: airlineId }, aircraft?.id);
      toast.success(aircraft ? 'Aircraft updated.' : 'Aircraft added to fleet!');
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error('Failed to save aircraft.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)}>
        <DialogHeader>
          <DialogTitle>{aircraft ? 'Edit Aircraft' : 'Add Aircraft to Fleet'}</DialogTitle>
          <DialogDescription>
            {aircraft
              ? 'Update technical specs and collection state.'
              : 'Add an airframe to this carrier’s catalogue.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="ac-name">Aircraft Name *</Label>
            <Input
              id="ac-name"
              placeholder="e.g. Boeing 777-300ER"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ac-mfg">Manufacturer</Label>
              <select
                id="ac-mfg"
                value={formData.manufacturer || 'Airbus'}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                {MANUFACTURERS.map((m) => (
                  <option key={m} value={m} className="bg-surface text-foreground">
                    {m}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ac-family">Family</Label>
              <Input
                id="ac-family"
                placeholder="e.g. 777, A350, A320"
                value={formData.family || ''}
                onChange={(e) => setFormData({ ...formData, family: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="grid gap-2">
              <Label htmlFor="ac-gen">Generation</Label>
              <Input
                id="ac-gen"
                placeholder="e.g. neo, MAX, XWB"
                value={formData.generation || ''}
                onChange={(e) => setFormData({ ...formData, generation: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ac-role">Role</Label>
              <select
                id="ac-role"
                value={formData.role || 'passenger'}
                onChange={(e) =>
                  setFormData({ ...formData, role: e.target.value as 'passenger' | 'cargo' })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="passenger" className="bg-surface text-foreground">Passenger</option>
                <option value="cargo" className="bg-surface text-foreground">Cargo</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ac-status">Fleet Status</Label>
              <select
                id="ac-status"
                value={formData.status || 'active'}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as 'active' | 'retired' })
                }
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="active" className="bg-surface text-foreground">Active</option>
                <option value="retired" className="bg-surface text-foreground">Retired</option>
              </select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ac-img">Photo URL</Label>
            <Input
              id="ac-img"
              placeholder="https://..."
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
            />
          </div>

          <div className="flex items-center gap-2 py-1">
            <input
              type="checkbox"
              id="ac-collected"
              checked={formData.collected || false}
              onChange={(e) => setFormData({ ...formData, collected: e.target.checked })}
              className="h-4 w-4 rounded border-input bg-transparent text-primary focus:ring-primary"
            />
            <Label htmlFor="ac-collected" className="cursor-pointer text-sm text-foreground normal-case">
              Mark as collected in your flight journal
            </Label>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ac-desc">Description</Label>
            <Textarea
              id="ac-desc"
              rows={3}
              placeholder="Technical specs, engine variant, seat configuration..."
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving…' : 'Save Aircraft'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
