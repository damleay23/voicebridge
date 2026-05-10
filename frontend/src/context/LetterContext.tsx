import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import * as tf from '@tensorflow/tfjs';
import { ALPHABET, LetterData } from '../data/alphabet';
import { ACHIEVEMENTS, AchievementStats } from '../data/achievements';
import { speak, phrases } from '../hooks/useVoice';
import { HandLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

const REQUIRED_CORRECT   = 5;
const XP_PER_CORRECT     = 10;
const XP_PER_COMPLETE    = 50;
const CONFIDENCE_THRESHOLD = 0.75;
const CONFIRM_STREAK     = 5;       // consecutive same predictions to confirm
const DETECTION_COOLDOWN = 3000;    // ms between confirmed detections

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
  wsConnected: boolean;   // kept for UI compat — now means "model ready"
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
  const [modelReady, setModelReady]             = useState(false);
  const [handDetected, setHandDetected]         = useState(false);
  const [landmarks, setLandmarks]               = useState<Landmark[]>([]);

  // Refs
  const activeIndexRef     = useRef(1);
  const completedRef       = useRef<string[]>([]);
  const attemptsRef        = useRef(0);
  const streamRef          = useRef<MediaStream | null>(null);
  const rafRef             = useRef<number>(0);
  const videoRef           = useRef<HTMLVideoElement>(document.createElement('video'));
  const landmarkerRef      = useRef<HandLandmarker | null>(null);
  const landmarkerReadyRef = useRef(false);
  const modelRef           = useRef<tf.LayersModel | null>(null);
  const classesRef         = useRef<string[]>([]);
  const streakBufRef       = useRef<string[]>([]);   // confirmation streak buffer
  const lastDetectionTs    = useRef<number>(0);

  const level           = calcLevel(xp);
  const progressPercent = Math.round((completedLetters.length / ALPHABET.length) * 100);

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

  // ── Core detection handler ────────────────────────────────
  const handleConfirmedDetection = useCallback((letter: string, confidence: number) => {
    const idx    = activeIndexRef.current;
    const target = ALPHABET[idx].letter;
    if (letter !== target) return;

    const now = Date.now();
    if (now - lastDetectionTs.current < DETECTION_COOLDOWN) return;
    lastDetectionTs.current = now;

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
    lastDetectionTs.current = 0;
    streakBufRef.current = [];
    setActiveIndex(idx);
    setCorrectAttempts(0);
    setDetection(MOCK_DETECTION);
  }, []);

  const setActiveLetter = useCallback((letter: LetterData) => {
    const idx = ALPHABET.findIndex(l => l.letter === letter.letter);
    if (idx !== -1) resetLetter(idx);
  }, [resetLetter]);

  const goToNext = useCallback(() => resetLetter((activeIndexRef.current + 1) % ALPHABET.length), [resetLetter]);
  const goToPrev = useCallback(() => resetLetter((activeIndexRef.current - 1 + ALPHABET.length) % ALPHABET.length), [resetLetter]);

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

  // ── Load TF.js model from /model/model.json ───────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        console.log('[TF] Loading model...');
        const m = await tf.loadLayersModel('/model/model.json');
        if (cancelled) return;
        modelRef.current = m;

        // Extract classes from userDefinedMetadata in model.json
        const resp = await fetch('/model/model.json');
        const json = await resp.json();
        const cls: string[] = json?.userDefinedMetadata?.classes ?? [];
        classesRef.current = cls;

        // Warm up — run one dummy inference so first real one is fast
        const dummy = tf.zeros([1, 63]);
        m.predict(dummy);
        dummy.dispose();

        setModelReady(true);
        console.log(`[TF] Model ready. Classes: ${cls.join(', ')}`);
      } catch (e) {
        console.error('[TF] Failed to load model:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Load MediaPipe HandLandmarker ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
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
          console.log('[MediaPipe] HandLandmarker ready');
        }
      } catch (e) {
        console.error('[MediaPipe] Failed to load:', e);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Camera ────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    if (streamRef.current) return;
    const tryGet = async (constraints: MediaStreamConstraints) => {
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      const video = videoRef.current;
      video.srcObject = s;
      video.muted = true;
      video.setAttribute('playsinline', 'true');
      await video.play();
      setStream(s);
      setCameraActive(true);
    };
    try {
      await tryGet({ video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: { ideal: 'user' }, frameRate: { ideal: 30 } } });
    } catch {
      try { await tryGet({ video: true }); } catch (e) { console.warn('[Camera] failed:', e); }
    }
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
    if (streamRef.current) stopCamera(); else startCamera();
  }, [startCamera, stopCamera]);

  // ── rAF loop: MediaPipe → TF.js classify (no WebSocket) ──
  useEffect(() => {
    let lastTs = -1;

    const loop = (now: number) => {
      rafRef.current = requestAnimationFrame(loop);

      const video = videoRef.current;
      const hl    = landmarkerRef.current;
      const model = modelRef.current;

      if (
        !hl || !landmarkerReadyRef.current ||
        !streamRef.current || video.readyState < 2 ||
        !model
      ) return;

      // ~20 fps
      if (now - lastTs < 50) return;
      lastTs = now;

      // MediaPipe hand detection
      const result = hl.detectForVideo(video, now);

      if (!result.landmarks || result.landmarks.length === 0) {
        setHandDetected(false);
        setDetection(MOCK_DETECTION);
        setLandmarks([]);
        streakBufRef.current = [];
        return;
      }

      const lms = result.landmarks[0];
      setHandDetected(true);
      setLandmarks(lms);

      // Cooldown — skip classification but keep overlay
      if (Date.now() - lastDetectionTs.current < DETECTION_COOLDOWN) return;

      // Flatten 21 landmarks → 63 floats
      const flat = lms.flatMap(lm => [lm.x, lm.y, lm.z]);

      // TF.js inference (synchronous — fast for this tiny model)
      const inputTensor = tf.tensor2d([flat], [1, 63]);
      const predTensor  = model.predict(inputTensor) as tf.Tensor;
      const predArray   = predTensor.dataSync();
      inputTensor.dispose();
      predTensor.dispose();

      const maxIdx    = predArray.indexOf(Math.max(...Array.from(predArray)));
      const confidence = predArray[maxIdx];
      const label     = classesRef.current[maxIdx] ?? '';

      // Update detection display
      setDetection({
        letter:     label,
        confidence: confidence,
        detected:   confidence >= CONFIDENCE_THRESHOLD,
      });

      // Confirmation streak logic (same as server.py)
      if (confidence >= CONFIDENCE_THRESHOLD) {
        const buf = streakBufRef.current;
        buf.push(label);
        if (buf.length > CONFIRM_STREAK) buf.shift();

        if (buf.length === CONFIRM_STREAK && new Set(buf).size === 1) {
          streakBufRef.current = [];
          handleConfirmedDetection(label, confidence);
        }
      } else {
        streakBufRef.current = [];
      }
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [handleConfirmedDetection]);

  // ── Auto-start camera on mount ────────────────────────────
  useEffect(() => {
    startCamera();
    return () => {
      cancelAnimationFrame(rafRef.current);
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
      stream, cameraActive,
      wsConnected: modelReady,  // reuse wsConnected field → now means "model ready"
      handDetected, toggleCamera, landmarks,
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
