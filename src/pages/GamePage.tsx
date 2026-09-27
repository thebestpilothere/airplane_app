import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../components/ui/button';

const WIDTH = 800;
const HEIGHT = 500;
const RUNWAY = { x1: 290, x2: 510, y: 250 };
const RUNWAY_THRESHOLDS = [
  { x: RUNWAY.x1, y: RUNWAY.y, dir: 0 },
  { x: RUNWAY.x2, y: RUNWAY.y, dir: Math.PI },
];
const THRESHOLD_RADIUS = 20;
const COLLISION_DIST = 18;
const PROXIMITY_ALERT_DIST = 50;

interface PlaneEntity {
  id: number;
  x: number;
  y: number;
  a: number; // heading in radians
  speed: number;
  path: { x: number; y: number }[];
  landing: { dir: number; t: number } | null;
  hue: number;
}

export function GamePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameState, setGameState] = useState<'ready' | 'playing' | 'over'>('ready');
  const [landedCount, setLandedCount] = useState(0);
  const [bestScore, setBestScore] = useState(0);

  const gameStateRef = useRef<'ready' | 'playing' | 'over'>('ready');
  const planesRef = useRef<PlaneEntity[]>([]);
  const selectedPlaneRef = useRef<PlaneEntity | null>(null);

  useEffect(() => {
    const savedBest = Number(localStorage.getItem('landing-best') || 0);
    setBestScore(savedBest);
  }, []);

  const startGame = () => {
    planesRef.current = [];
    selectedPlaneRef.current = null;
    setLandedCount(0);
    gameStateRef.current = 'playing';
    setGameState('playing');
    canvasRef.current?.dispatchEvent(new Event('restart'));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    let lastTime = performance.now();
    let spawnTimer = 1;
    let elapsed = 0;
    let planeIdCounter = 1;
    let score = 0;

    const spawnPlane = () => {
      const edge = Math.floor(Math.random() * 4);
      let sx = 0;
      let sy = 0;
      if (edge === 0) { sx = Math.random() * WIDTH; sy = -20; }
      else if (edge === 1) { sx = WIDTH + 20; sy = Math.random() * HEIGHT; }
      else if (edge === 2) { sx = Math.random() * WIDTH; sy = HEIGHT + 20; }
      else { sx = -20; sy = Math.random() * HEIGHT; }

      const targetX = WIDTH / 2 + (Math.random() - 0.5) * 300;
      const targetY = HEIGHT / 2 + (Math.random() - 0.5) * 200;

      planesRef.current.push({
        id: planeIdCounter++,
        x: sx,
        y: sy,
        a: Math.atan2(targetY - sy, targetX - sx),
        speed: 28 + Math.random() * 12 + Math.min(elapsed * 0.3, 25),
        path: [],
        landing: null,
        hue: Math.floor(Math.random() * 360),
      });
    };

    const gameOver = () => {
      gameStateRef.current = 'over';
      setGameState('over');
      const currentBest = Number(localStorage.getItem('landing-best') || 0);
      if (score > currentBest) {
        localStorage.setItem('landing-best', String(score));
        setBestScore(score);
      }
    };

    const updatePhysics = (dt: number) => {
      elapsed += dt;
      spawnTimer -= dt;
      if (spawnTimer <= 0) {
        spawnPlane();
        spawnTimer = Math.max(2.2, 6 - elapsed * 0.04) * (0.7 + Math.random() * 0.6);
      }

      const planes = planesRef.current;
      for (const p of planes) {
        if (p.landing) {
          p.landing.t += dt;
          p.a = p.landing.dir;
          p.x += Math.cos(p.a) * p.speed * 0.8 * dt;
          continue;
        }

        if (p.path.length) {
          const wp = p.path[0];
          let diff = Math.atan2(wp.y - p.y, wp.x - p.x) - p.a;
          diff = Math.atan2(Math.sin(diff), Math.cos(diff));
          p.a += Math.max(-4 * dt, Math.min(4 * dt, diff)) * 1.5;
          if (Math.hypot(wp.x - p.x, wp.y - p.y) < 6) {
            p.path.shift();
          }
        }

        p.x += Math.cos(p.a) * p.speed * dt;
        p.y += Math.sin(p.a) * p.speed * dt;

        // Bounce near airspace borders
        if ((p.x < 10 && Math.cos(p.a) < 0) || (p.x > WIDTH - 10 && Math.cos(p.a) > 0)) {
          if (p.x > -5 && p.x < WIDTH + 5) p.a = Math.PI - p.a;
        }
        if ((p.y < 10 && Math.sin(p.a) < 0) || (p.y > HEIGHT - 10 && Math.sin(p.a) > 0)) {
          if (p.y > -5 && p.y < HEIGHT + 5) p.a = -p.a;
        }

        // Check landing thresholds
        for (const th of RUNWAY_THRESHOLDS) {
          if (Math.hypot(p.x - th.x, p.y - th.y) < THRESHOLD_RADIUS && selectedPlaneRef.current !== p) {
            const lastWp = p.path[p.path.length - 1];
            if ((!lastWp || Math.hypot(lastWp.x - th.x, lastWp.y - th.y) < THRESHOLD_RADIUS * 1.5) &&
                p.path.length <= 3 &&
                (!p.path.length || Math.cos(p.a - th.dir) > 0.5)) {
              p.landing = { dir: th.dir, t: 0 };
              p.path = [];
              p.y = th.y;
            }
          }
        }
      }

      // Filter landed planes
      const prevLen = planes.length;
      planesRef.current = planes.filter((p) => !(p.landing && p.landing.t > 2.2));
      const newlyLanded = prevLen - planesRef.current.length;
      if (newlyLanded > 0) {
        score += newlyLanded;
        setLandedCount(score);
      }

      // Collision checks between active aircraft
      const activePlanes = planesRef.current.filter((p) => !p.landing);
      for (let i = 0; i < activePlanes.length; i++) {
        for (let j = i + 1; j < activePlanes.length; j++) {
          if (Math.hypot(activePlanes[i].x - activePlanes[j].x, activePlanes[i].y - activePlanes[j].y) < COLLISION_DIST) {
            gameOver();
            return;
          }
        }
      }
    };

    const drawPlane = (p: PlaneEntity, isProximityAlert: boolean) => {
      const scale = p.landing ? Math.max(0.4, 1 - p.landing.t * 0.3) : 1;

      // Draw flight path line
      if (p.path.length) {
        ctx.strokeStyle = `hsla(${p.hue}, 90%, 65%, 0.6)`;
        ctx.setLineDash([6, 6]);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        for (const pt of p.path) ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Proximity alarm circle
      if (isProximityAlert) {
        ctx.strokeStyle = '#ff4d4d';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 22, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Render plane sprite
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.a);
      ctx.scale(scale, scale);
      ctx.fillStyle = `hsl(${p.hue}, 85%, 65%)`;

      // Fuselage & Nose
      ctx.beginPath();
      ctx.moveTo(14, 0);
      ctx.lineTo(-10, -3);
      ctx.lineTo(-10, 3);
      ctx.closePath();
      ctx.fill();

      // Wings
      ctx.fillRect(-2, -12, 5, 24);
      // Horizontal stabilizer
      ctx.fillRect(-11, -6, 3, 12);
      ctx.restore();
    };

    const render = () => {
      // Background
      ctx.fillStyle = '#0a0f14';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);

      // Radar Range Rings
      ctx.strokeStyle = '#7d8a99';
      ctx.globalAlpha = 0.12;
      for (let r = 80; r < 500; r += 80) {
        ctx.beginPath();
        ctx.arc(WIDTH / 2, HEIGHT / 2, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Runway
      ctx.fillStyle = 'hsl(210, 10%, 22%)';
      ctx.fillRect(RUNWAY.x1, RUNWAY.y - 14, RUNWAY.x2 - RUNWAY.x1, 28);
      ctx.strokeStyle = '#e6edf3';
      ctx.setLineDash([14, 10]);
      ctx.beginPath();
      ctx.moveTo(RUNWAY.x1 + 20, RUNWAY.y);
      ctx.lineTo(RUNWAY.x2 - 20, RUNWAY.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Amber Runway Touchdown Thresholds
      for (const th of RUNWAY_THRESHOLDS) {
        ctx.strokeStyle = '#ffb800';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(th.x, th.y, THRESHOLD_RADIUS, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw all aircraft
      const airborne = planesRef.current.filter((p) => !p.landing);
      for (const p of planesRef.current) {
        const proximityAlert =
          !p.landing &&
          airborne.some((other) => other !== p && Math.hypot(other.x - p.x, other.y - p.y) < PROXIMITY_ALERT_DIST);
        drawPlane(p, proximityAlert);
      }
    };

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (gameStateRef.current === 'playing') {
        if (elapsed === 0 && planesRef.current.length === 0) {
          score = 0;
          spawnTimer = 0.5;
        }
        updatePhysics(dt);
      } else if (gameStateRef.current === 'ready') {
        elapsed = 0;
      }

      render();
      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);

    const getCanvasPos = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return {
        x: ((e.clientX - rect.left) / rect.width) * WIDTH,
        y: ((e.clientY - rect.top) / rect.height) * HEIGHT,
      };
    };

    const onPointerDown = (e: PointerEvent) => {
      if (gameStateRef.current !== 'playing') return;
      const pos = getCanvasPos(e);
      let closest: PlaneEntity | null = null;
      let minD = 30;

      for (const p of planesRef.current) {
        if (p.landing) continue;
        const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
        if (dist < minD) {
          minD = dist;
          closest = p;
        }
      }

      if (closest) {
        selectedPlaneRef.current = closest;
        closest.path = [];
        canvas.setPointerCapture(e.pointerId);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const target = selectedPlaneRef.current;
      if (!target) return;
      const pos = getCanvasPos(e);
      const lastPoint = target.path[target.path.length - 1] ?? target;
      if (Math.hypot(pos.x - lastPoint.x, pos.y - lastPoint.y) > 8) {
        target.path.push(pos);
      }
    };

    const onPointerUp = () => {
      selectedPlaneRef.current = null;
    };

    canvas.addEventListener('pointerdown', onPointerDown);
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerup', onPointerUp);
    canvas.addEventListener('pointercancel', onPointerUp);

    const onRestart = () => {
      elapsed = 0;
      score = 0;
      spawnTimer = 0.5;
    };
    canvas.addEventListener('restart', onRestart);

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('pointerdown', onPointerDown);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerup', onPointerUp);
      canvas.removeEventListener('pointercancel', onPointerUp);
      canvas.removeEventListener('restart', onRestart);
    };
  }, []);

  return (
    <div className="space-y-6 animate-rise pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-primary">Mini game</p>
          <h1 className="mt-2 text-3xl font-bold">Airport Landing</h1>
          <p className="mt-2 max-w-xl text-sm text-muted-foreground leading-relaxed">
            Drag from a plane to draw its flight path and end it in an amber circle at either end of the runway. Don't let planes collide!
          </p>
        </div>

        <div className="flex gap-6 font-display">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Landed</p>
            <p className="text-3xl font-bold text-primary">{landedCount}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Best</p>
            <p className="text-3xl font-bold text-beacon">{bestScore}</p>
          </div>
        </div>
      </div>

      <div className="panel relative overflow-hidden p-2">
        <canvas
          ref={canvasRef}
          width={WIDTH}
          height={HEIGHT}
          className="block w-full touch-none rounded-md"
          style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
        />

        {gameState !== 'playing' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/75 backdrop-blur-sm animate-fade-in">
            <h2 className="font-display text-2xl font-bold">
              {gameState === 'over' ? 'Airspace Collision!' : 'Ready for arrivals?'}
            </h2>
            {gameState === 'over' && (
              <p className="text-muted-foreground">
                You safely guided {landedCount} plane{landedCount === 1 ? '' : 's'} onto the tarmac.
              </p>
            )}
            <Button size="lg" onClick={startGame} className="bg-horizon font-semibold text-primary-foreground">
              {gameState === 'over' ? 'Play again' : 'Start radar'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
