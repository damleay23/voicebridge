import { useEffect, useRef } from 'react';
import { useLetter, Landmark } from '../context/LetterContext';

const CONNECTIONS: [number, number][] = [
  [0,1],[1,2],[2,3],[3,4],
  [0,5],[5,6],[6,7],[7,8],
  [0,9],[9,10],[10,11],[11,12],
  [0,13],[13,14],[14,15],[15,16],
  [0,17],[17,18],[18,19],[19,20],
  [5,9],[9,13],[13,17],
];

function drawHand(ctx: CanvasRenderingContext2D, w: number, h: number, lms: Landmark[]) {
  ctx.clearRect(0, 0, w, h);
  if (lms.length === 0) return;

  const px = (lm: Landmark) => (1 - lm.x) * w;
  const py = (lm: Landmark) => lm.y * h;

  // Connections
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.75)';
  ctx.lineWidth = 2;
  CONNECTIONS.forEach(([a, b]) => {
    if (!lms[a] || !lms[b]) return;
    ctx.beginPath();
    ctx.moveTo(px(lms[a]), py(lms[a]));
    ctx.lineTo(px(lms[b]), py(lms[b]));
    ctx.stroke();
  });

  // Dots
  const TIPS = new Set([4, 8, 12, 16, 20]);
  lms.forEach((lm, i) => {
    ctx.beginPath();
    ctx.arc(px(lm), py(lm), TIPS.has(i) ? 6 : 4, 0, Math.PI * 2);
    ctx.fillStyle = TIPS.has(i) ? '#3b82f6' : 'rgba(0,210,255,0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

export default function HandOverlay() {
  const { landmarks } = useLetter();
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<Landmark[]>([]);
  const rafRef     = useRef<number>(0);

  // Keep ref in sync without triggering re-renders
  useEffect(() => {
    landmarksRef.current = landmarks;
  }, [landmarks]);

  // Single rAF loop — runs independently of React renders
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      drawHand(ctx, canvas.width, canvas.height, landmarksRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={640}
      height={480}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
}
