import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Sparkles, Upload, Check, Plane } from 'lucide-react';
import { generateAirlineFromAI, saveAirline, saveAircraft } from '../lib/api';
import { toast } from 'sonner';
import { Airline, Aircraft } from '../types';

interface GenerateAirlineDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function GenerateAirlineDialog({
  open,
  onOpenChange,
  onSuccess,
}: GenerateAirlineDialogProps) {
  const [images, setImages] = useState<string[]>([]);
  const [hint, setHint] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedResult, setGeneratedResult] = useState<{
    airline: Omit<Airline, 'id'>;
    aircraft: Omit<Aircraft, 'id'>[];
  } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).slice(0, 6).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImages((prev) => [...prev, String(event.target?.result)].slice(0, 6));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleGenerate = async () => {
    if (images.length === 0 && !hint.trim()) {
      toast.error('Please upload at least one image or type a hint (e.g. airline name or livery description)');
      return;
    }

    setGenerating(true);
    try {
      const result = await generateAirlineFromAI(images, hint);
      setGeneratedResult(result);
      toast.success(`Identified: ${result.airline.name}!`);
    } catch {
      toast.error('Failed to generate airline data.');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (!generatedResult) return;
    setSaving(true);
    try {
      const airlineId = await saveAirline(generatedResult.airline);
      for (const ac of generatedResult.aircraft) {
        await saveAircraft({ ...ac, airline_id: airlineId });
      }
      toast.success(`Saved ${generatedResult.airline.name} and ${generatedResult.aircraft.length} aircraft to your encyclopedia!`);
      onOpenChange(false);
      setGeneratedResult(null);
      setImages([]);
      setHint('');
      onSuccess();
    } catch {
      toast.error('Could not save generated airline.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent onClose={() => onOpenChange(false)} className="max-w-xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <DialogTitle>AI Generate Airline</DialogTitle>
          </div>
          <DialogDescription>
            Upload photos of a livery, tail logo or aircraft, or provide a hint. The AI assistant will recognize the carrier, populate historical specs, and build fleet cards automatically.
          </DialogDescription>
        </DialogHeader>

        {!generatedResult ? (
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Photos of livery, logo or airframe (Max 6)</Label>
              <div className="border-2 border-dashed border-border/80 hover:border-primary/50 transition-colors rounded-xl p-6 text-center bg-surface-2/30">
                <input
                  type="file"
                  id="ai-photos"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="ai-photos"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <Upload className="h-8 w-8 text-primary/70" />
                  <span className="text-sm font-semibold">Click to upload livery images</span>
                  <span className="text-xs text-muted-foreground">PNG, JPG, WebP supported</span>
                </label>
              </div>

              {images.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-16 w-16 rounded-md overflow-hidden border border-border"
                    >
                      <img src={img} alt="upload preview" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="ai-hint">Hint / Details (Optional)</Label>
              <Input
                id="ai-hint"
                placeholder="e.g. KLM blue livery, or Japanese carrier with crane emblem"
                value={hint}
                onChange={(e) => setHint(e.target.value)}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerate} disabled={generating} className="bg-horizon font-semibold text-primary-foreground">
                <Sparkles className="mr-2 h-4 w-4" />
                {generating ? 'Analyzing & Generating…' : 'Generate Airline'}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4 animate-rise">
            <div className="panel p-4 bg-surface-2/40 border border-primary/30 flex items-start gap-4">
              {generatedResult.airline.logo_url && (
                <img
                  src={generatedResult.airline.logo_url}
                  alt={generatedResult.airline.name}
                  className="h-16 w-16 rounded-lg object-contain bg-background p-1 border border-border"
                />
              )}
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold font-display">{generatedResult.airline.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {generatedResult.airline.country} · Founded {generatedResult.airline.founded_year} · {generatedResult.airline.alliance || 'No alliance'}
                </p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {generatedResult.airline.description}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Generated Fleet Airframes ({generatedResult.aircraft.length})
              </p>
              <div className="space-y-2">
                {generatedResult.aircraft.map((ac, i) => (
                  <div key={i} className="panel p-3 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-primary" />
                      <span className="font-semibold">{ac.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {ac.manufacturer} · {ac.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setGeneratedResult(null)}>
                Back
              </Button>
              <Button onClick={handleSaveAll} disabled={saving} className="bg-horizon font-semibold text-primary-foreground">
                <Check className="mr-2 h-4 w-4" />
                {saving ? 'Saving to Index…' : 'Save to Collection'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
