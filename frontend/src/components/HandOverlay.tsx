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

/**
 * Compute the rendered region of a video inside a container
 * when CSS object-fit: cover is applied.
 *
 * Returns { offsetX, offsetY, renderedW, renderedH } in canvas pixels —
 * i.e. where the video image actually starts and how large it is drawn,
 * accounting for the crop that cover applies.
 */
function getCoverRect(
  containerW: number,
  containerH: number,
  videoW: number,
  videoH: number,
) {
  if (videoW === 0 || videoH === 0) {
    return { offsetX: 0, offsetY: 0, renderedW: containerW, renderedH: containerH };
  }

  const containerRatio = containerW / containerH;
  const videoRatio     = videoW / videoH;

  let renderedW: number;
  let renderedH: number;

  if (containerRatio > videoRatio) {
    // Container is wider → video is scaled to fill width, cropped top/bottom
    renderedW = containerW;
    renderedH = containerW / videoRatio;
  } else {
    // Container is taller → video is scaled to fill height, cropped left/right
    renderedH = containerH;
    renderedW = containerH * videoRatio;
  }

  const offsetX = (containerW - renderedW) / 2;
  const offsetY = (containerH - renderedH) / 2;

  return { offsetX, offsetY, renderedW, renderedH };
}

function drawHand(
  ctx: CanvasRenderingContext2D,
  canvasW: number,
  canvasH: number,
  videoW: number,
  videoH: number,
  lms: Landmark[],
) {
  ctx.clearRect(0, 0, canvasW, canvasH);
  if (lms.length === 0) return;

  // Get the actual rendered region of the video inside the canvas
  const { offsetX, offsetY, renderedW, renderedH } = getCoverRect(canvasW, canvasH, videoW, videoH);

  // Map normalized landmark coords → canvas pixels
  // MediaPipe landmarks are in [0,1] relative to the video frame.
  // The video is CSS-mirrored (scaleX(-1)), so X is already flipped visually.
  // We must mirror X in the same way: use (1 - lm.x) to match the flipped video.
  const px = (lm: Landmark) => offsetX + (1 - lm.x) * renderedW;
  const py = (lm: Landmark) => offsetY + lm.y * renderedH;

  // Connections
  const lineW = Math.max(2, canvasW / 250);
  ctx.strokeStyle = 'rgba(0, 210, 255, 0.85)';
  ctx.lineWidth   = lineW;
  ctx.lineCap     = 'round';
  ctx.lineJoin    = 'round';

  CONNECTIONS.forEach(([a, b]) => {
    if (!lms[a] || !lms[b]) return;
    ctx.beginPath();
    ctx.moveTo(px(lms[a]), py(lms[a]));
    ctx.lineTo(px(lms[b]), py(lms[b]));
    ctx.stroke();
  });

  // Dots
  const TIPS   = new Set([4, 8, 12, 16, 20]);
  const tipR   = Math.max(5, canvasW / 70);
  const jointR = Math.max(3, canvasW / 110);

  lms.forEach((lm, i) => {
    const x = px(lm);
    const y = py(lm);
    const r = TIPS.has(i) ? tipR : jointR;

    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = TIPS.has(i) ? '#3b82f6' : 'rgba(0, 210, 255, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth   = 1.5;
    ctx.stroke();
  });
}

export default function HandOverlay() {
  const { landmarks, stream } = useLetter();
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<Landmark[]>([]);
  const videoDimRef  = useRef<{ w: number; h: number }>({ w: 0, h: 0 });
  const rafRef       = useRef<number>(0);

  // Keep landmarks ref in sync
  useEffect(() => { landmarksRef.current = landmarks; }, [landmarks]);

  // Track actual video resolution from the stream
  useEffect(() => {
    if (!stream) return;
    const track    = stream.getVideoTracks()[0];
    if (!track) return;
    const settings = track.getSettings();
    if (settings.width && settings.height) {
      videoDimRef.current = { w: settings.width, h: settings.height };
    }
  }, [stream]);

  // Resize canvas to match its CSS display size
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = canvas.getBoundingClientRect();
      const w = Math.round(rect.width);
      const h = Math.round(rect.height);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width  = w;
        canvas.height = h;
      }
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // rAF draw loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      const { w, h } = videoDimRef.current;
      drawHand(ctx, canvas.width, canvas.height, w, h, landmarksRef.current);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-20"
    />
  );
}
