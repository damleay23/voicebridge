import { useEffect, useRef, useCallback, useState } from 'react';
import { DetectionResult } from '../context/LetterContext';

const WS_URL = 'ws://localhost:8000/ws';
const FRAME_INTERVAL_MS = 100;

interface BackendState {
  connected: boolean;
  handDetected: boolean;
  cameraActive: boolean;
}

interface UseBackendOptions {
  onDetection: (result: DetectionResult) => void;
}

export function useBackend({ onDetection }: UseBackendOptions) {
  const wsRef        = useRef<WebSocket | null>(null);
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const canvasRef    = useRef<HTMLCanvasElement | null>(null);
  const intervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const [state, setState] = useState<BackendState>({
    connected: false,
    handDetected: false,
    cameraActive: false,
  });

  // ── WebSocket ──────────────────────────────────────────────
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => setState(s => ({ ...s, connected: true }));

    ws.onclose = () => {
      setState(s => ({ ...s, connected: false, handDetected: false }));
      setTimeout(connect, 3000);
    };

    ws.onerror = () => {};

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (!data.hand_detected) {
          setState(s => ({ ...s, handDetected: false }));
          onDetection({ letter: '', confidence: 0, detected: false });
          return;
        }
        setState(s => ({ ...s, handDetected: true }));
        onDetection({
          letter:     data.prediction,
          confidence: data.confidence,
          detected:   data.confirmed === true,
        });
      } catch {}
    };
  }, [onDetection]);

  // ── Cámara ─────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (streamRef.current) return; // ya activa
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setState(s => ({ ...s, cameraActive: true }));
    } catch (e) {
      console.warn('[Camera] Cannot access camera:', e);
    }
  }, []);

  const stopCamera = useCallback(() => {
    // Detener todos los tracks del stream
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setState(s => ({ ...s, cameraActive: false, handDetected: false }));
    // Parar envío de frames
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) {
      stopCamera();
    } else {
      startCamera().then(startSending);
    }
  }, [stopCamera, startCamera]);

  // ── Envío de frames ────────────────────────────────────────
  const startSending = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      const ws     = wsRef.current;
      const video  = videoRef.current;
      const canvas = canvasRef.current;
      if (!ws || ws.readyState !== WebSocket.OPEN) return;
      if (!video || video.readyState < 2 || !streamRef.current) return;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width  = video.videoWidth  || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0);
      const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
      ws.send(JSON.stringify({ frame: base64 }));
    }, FRAME_INTERVAL_MS);
  }, []);

  // ── Init ───────────────────────────────────────────────────
  useEffect(() => {
    connect();
    startCamera().then(startSending);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return { state, videoRef, canvasRef, toggleCamera };
}
