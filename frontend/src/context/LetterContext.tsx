import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { ALPHABET, LetterData } from '../data/alphabet';
import { ACHIEVEMENTS, AchievementStats } from '../data/achievements';
import { speak, phrases } from '../hooks/useVoice';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const REQUIRED_CORRECT = 5;
const XP_PER_CORRECT   = 10;
const XP_PER_COMPLETE  = 50;
const WS_URL           = 'ws://localhost:3000/ws';

export interface DetectionResult {
  letter: string;
  confidence: number;
  detected: boolean;
}

export interface Landmark {
  x: number;
  y: number;
  z: number;
}

export interface Notification {
  id: string;
  type: 'letter' | 'achievement' | 'exam';
  title: string;
  subtitle: string;
  icon: string;
}

function calcLevel(xp: number): string {
  if (xp < 200)  return 'Beginner';
  if (xp < 600)  return 'Basic';
  if (xp < 1200) return 'Intermediate';
  if (xp < 2000) return 'Advanced';
  return 'Expert';
}

interface LetterContextType {
  activeLetter: LetterData;
  setActiveLetter: (letter: LetterData) => void;
  completedLetters: string[];
  goToNext: () => void;
  goToPrev: () => void;
  detection: DetectionResult;
  correctAttempts: number;
  requiredCorrect: number;
  xp: number;
  streak: number;
  level: string;
  progressPercent: number;
  unlockedAchievements: string[];
  examsCompleted: number;
  examsPerfect: number;
  onExamCompleted: (score: number) => void;
  notifications: Notification[];
  dismissNotification: (id: string) => void;
  stream: MediaStream | null;
  cameraActive: boolean;
  wsConnected: boolean;
  handDetected: boolean;
  toggleCamera: () => void;
  landmarks: Landmark[];
}

const LetterContext = createContext<LetterContextType | null>(null);
const MOCK_DETECTION: DetectionResult = { letter: '', confidence: 0, detected: false };

export function LetterProvider({ children }: { children: ReactNode }) {
  // ── State ─────────────────────────────────────────────────
  const [activeIndex, setActiveIndex]           = useState(1);
  const [completedLetters, setCompletedLetters] = useState<string[]>([]);
  const [correctAttempts, setCorrectAttempts]   = useState(0);
  const [detection, setDetection]               = useState<DetectionResult>(MOCK_DETECTION);
  const [xp, setXp]                             = useState(0);
  const [streak, setStreak]                     = useState(0);
  const [unlockedAchievements, setUnlocked]     = useState<string[]>([]);
  const [examsCompleted, setExamsCompleted]     = useState(0);
  const [examsPerfect, setExamsPerfect]         = useState(0);
  const [notifications, setNotifications]       = useState<Notification[]>([]);
  const [stream, setStream]                     = useState<MediaStream | null>(null);
  const [cameraActive, setCameraActive]         = useState(false);
  const [wsConnected, setWsConnected]           = useState(false);
  const [handDetected, setHandDetected]         = useState(false);
  const [landmarks, setLandmarks]               = useState<Landmark[]>([]); 

  // Refs for mutable values that don't need re-renders
  const activeIndexRef     = useRef(1);
  const completedRef       = useRef<string[]>([]);
  const attemptsRef        = useRef(0);
  const wsRef              = useRef<WebSocket | null>(null);
  const streamRef          = useRef<MediaStream | null>(null);
  const rafRef             = useRef<number>(0);
  const videoRef           = useRef<HTMLVideoElement>(document.createElement('video'));
  const landmarkerRef      = useRef<HandLandmarker | null>(null);
  const landmarkerReadyRef = useRef(false);
  // Cooldown: timestamp (ms) de la última detección confirmada
  const lastDetectionTs    = useRef<number>(0);
  const DETECTION_COOLDOWN = 3000; // 3 segundos entre detecciones

  const level           = calcLevel(xp);
  const progressPercent = Math.round((completedLetters.length / ALPHABET.length) * 100);

  // Keep refs in sync with state
  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);
  useEffect(() => { completedRef.current = completedLetters; }, [completedLetters]);
  useEffect(() => { attemptsRef.current = correctAttempts; }, [correctAttempts]);

  // ── Notifications ─────────────────────────────────────────
  const pushNotification = useCallback((n: Notification) => {
    setNotifications(prev => [n, ...prev].slice(0, 5));
    setTimeout(() => setNotifications(prev => prev.filter(x => x.id !== n.id)), 4000);
  }, []);

  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // ── Achievements ──────────────────────────────────────────
  const checkAchievements = useCallback((stats: AchievementStats) => {
    setUnlocked(prev => {
      const newUnlocked = [...prev];
      ACHIEVEMENTS.forEach(a => {
        if (!newUnlocked.includes(a.id) && a.check(stats)) {
          newUnlocked.push(a.id);
          pushNotification({
            id: `ach-${a.id}-${Date.now()}`,
            type: 'achievement',
            title: 'Achievement unlocked!',
            subtitle: `${a.icon} ${a.title} — ${a.description}`,
            icon: a.icon,
          });
        }
      });
      return newUnlocked;
    });
  }, [pushNotification]);

  // ── Core detection handler (single source of truth) ───────
  const handleConfirmedDetection = useCallback((letter: string, confidence: number) => {
    const idx    = activeIndexRef.current;
    const target = ALPHABET[idx].letter;
    if (letter !== target) return;

    // Cooldown: ignorar si no han pasado 3 segundos desde la última detección
    const now = Date.now();
    if (now - lastDetectionTs.current < DETECTION_COOLDOWN) return;
    lastDetectionTs.current = now;

    // 🔊 Say the letter
    speak(phrases.letterDetected(letter));

    const nextAttempts = attemptsRef.current + 1;
    attemptsRef.current = Math.min(nextAttempts, REQUIRED_CORRECT);
    setCorrectAttempts(Math.min(nextAttempts, REQUIRED_CORRECT));
    setXp(prev => prev + XP_PER_CORRECT);

    if (nextAttempts >= REQUIRED_CORRECT) {
      const already = completedRef.current.includes(letter);
      if (!already) {
        const newCompleted = [...completedRef.current, letter];
        completedRef.current = newCompleted;
        setCompletedLetters(newCompleted);
        setXp(prev => prev + XP_PER_COMPLETE);
        setStreak(prev => prev + 1);
        pushNotification({
          id: `letter-${letter}-${Date.now()}`,
          type: 'letter',
          title: `Letter "${letter}" unlocked!`,
          subtitle: `You completed all ${REQUIRED_CORRECT} attempts correctly.`,
          icon: '✋',
        });
        // 🔊 Unlock message (delayed so it doesn't overlap with letter name)
        setTimeout(() => speak(phrases.letterUnlocked(letter)), 1200);
        checkAchievements({
          completedLetters: newCompleted,
          xp: xp + XP_PER_CORRECT + XP_PER_COMPLETE,
          streak: streak + 1,
          examsCompleted,
          examsPerfect,
        });
      }
    }
  }, [xp, streak, examsCompleted, examsPerfect, pushNotification, checkAchievements]);

  // ── Letter navigation ─────────────────────────────────────
  const resetLetter = useCallback((idx: number) => {
    activeIndexRef.current = idx;
    attemptsRef.current = 0;
    lastDetectionTs.current = 0; // reset cooldown al cambiar de letra
    setActiveIndex(idx);
    setCorrectAttempts(0);
    setDetection(MOCK_DETECTION);
  }, []);

  const setActiveLetter = useCallback((letter: LetterData) => {
    const idx = ALPHABET.findIndex(l => l.letter === letter.letter);
    if (idx !== -1) resetLetter(idx);
  }, [resetLetter]);

  const goToNext = useCallback(() => {
    const next = (activeIndexRef.current + 1) % ALPHABET.length;
    resetLetter(next);
  }, [resetLetter]);

  const goToPrev = useCallback(() => {
    const next = (activeIndexRef.current - 1 + ALPHABET.length) % ALPHABET.length;
    resetLetter(next);
  }, [resetLetter]);

  // ── Exam ──────────────────────────────────────────────────
  const onExamCompleted = useCallback((score: number) => {
    const newExams   = examsCompleted + 1;
    const newPerfect = score === 100 ? examsPerfect + 1 : examsPerfect;
    setExamsCompleted(newExams);
    if (score === 100) setExamsPerfect(newPerfect);
    pushNotification({
      id: `exam-${Date.now()}`,
      type: 'exam',
      title: score === 100 ? 'Perfect exam! 💯' : 'Exam completed!',
      subtitle: `You scored ${score}%`,
      icon: score === 100 ? '💯' : '📝',
    });
    checkAchievements({ completedLetters, xp, streak, examsCompleted: newExams, examsPerfect: newPerfect });
  }, [examsCompleted, examsPerfect, completedLetters, xp, streak, checkAchievements, pushNotification]);

  // ── WebSocket ─────────────────────────────────────────────
  const connectWS = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;
    ws.onopen  = () => setWsConnected(true);
    ws.onclose = () => {
      setWsConnected(false);
      setHandDetected(false);
      setTimeout(connectWS, 3000);
    };
    ws.onerror = () => {};
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (!data.hand_detected) {
          setDetection(MOCK_DETECTION);
          return;
        }
        const result: DetectionResult = {
          letter:     data.prediction,
          confidence: data.confidence,
          detected:   data.confirmed === true,
        };
        setDetection(result);
        if (data.confirmed) {
          handleConfirmedDetection(data.prediction, data.confidence);
        }
      } catch {}
    };
  }, [handleConfirmedDetection]);

  // ── MediaPipe HandLandmarker (carga una sola vez) ────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm'
      );
      const hl = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 1,
      });
      if (!cancelled) {
        landmarkerRef.current = hl;
        landmarkerReadyRef.current = true;
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Camera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
      });
      streamRef.current = s;
      const video = videoRef.current;
      video.srcObject = s;
      video.muted = true;
      await video.play();
      setStream(s);
      setCameraActive(true);
    } catch (e) { console.warn('[Camera]', e); }
  }, []);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    videoRef.current.srcObject = null;
    setStream(null);
    setCameraActive(false);
    setHandDetected(false);
    setDetection(MOCK_DETECTION);
    setLandmarks([]);
  }, []);

  const toggleCamera = useCallback(() => {
    if (streamRef.current) stopCamera();
    else startCamera();
  }, [startCamera, stopCamera]);

  // ── rAF loop: MediaPipe → landmarks → WS ─────────────────
  // Runs as long as the component is mounted; sends only when camera + WS are ready.
  useEffect(() => {
    let lastTs = -1;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);

      const ws      = wsRef.current;
      const video   = videoRef.current;
      const hl      = landmarkerRef.current;

      // Only process when everything is ready
      if (
        !hl ||
        !landmarkerReadyRef.current ||
        !streamRef.current ||
        video.readyState < 2 ||
        !ws ||
        ws.readyState !== WebSocket.OPEN
      ) return;

      // Throttle to ~20 fps (50 ms between frames)
      if (now - lastTs < 50) return;
      lastTs = now;

      // Run MediaPipe directly on the video element — no canvas, no JPEG
      const result = hl.detectForVideo(video, now);

      if (!result.landmarks || result.landmarks.length === 0) {
        setHandDetected(false);
        setDetection(MOCK_DETECTION);
        setLandmarks([]);
        ws.send(JSON.stringify({ hand_detected: false }));
        return;
      }

      const lms = result.landmarks[0]; // 21 landmarks [{x,y,z}, ...]
      setHandDetected(true);
      setLandmarks(lms);

      // Si estamos en cooldown post-detección, no enviar al servidor
      if (Date.now() - lastDetectionTs.current < DETECTION_COOLDOWN) return;

      // Flatten to 63 numbers — same format as the Python training code
      const flat = lms.flatMap(lm => [lm.x, lm.y, lm.z]);
      ws.send(JSON.stringify({ landmarks: flat }));
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  useEffect(() => {
    connectWS();
    startCamera();
    return () => {
      cancelAnimationFrame(rafRef.current);
      wsRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <LetterContext.Provider value={{
      activeLetter: ALPHABET[activeIndex],
      setActiveLetter, completedLetters,
      goToNext, goToPrev,
      detection, correctAttempts, requiredCorrect: REQUIRED_CORRECT,
      xp, streak, level, progressPercent,
      unlockedAchievements, examsCompleted, examsPerfect, onExamCompleted,
      notifications, dismissNotification,
      stream, cameraActive, wsConnected, handDetected, toggleCamera, landmarks,
    }}>
      {children}
    </LetterContext.Provider>
  );
}

export function useLetter() {
  const ctx = useContext(LetterContext);
  if (!ctx) throw new Error('useLetter must be used within LetterProvider');
  return ctx;
}