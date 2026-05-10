// Text-to-Speech
// Primary: ElevenLabs (Rachel voice) — requires VITE_ELEVENLABS_API_KEY
// Fallback: Web Speech API (native browser, no key needed)

const API_KEY  = import.meta.env.VITE_ELEVENLABS_API_KEY as string | undefined;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const API_URL  = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

// ── Web Speech API fallback ────────────────────────────────
function speakNative(text: string): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = 'en-US';
  utter.rate  = 1.0;
  utter.pitch = 1.0;
  // Try to pick a natural English voice if available
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v =>
    v.lang === 'en-US' && (v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Karen'))
  ) ?? voices.find(v => v.lang.startsWith('en'));
  if (preferred) utter.voice = preferred;
  window.speechSynthesis.speak(utter);
}

// ── ElevenLabs ─────────────────────────────────────────────
async function fetchAudio(text: string): Promise<string> {
  if (audioCache.has(text)) return audioCache.get(text)!;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY!,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_turbo_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    console.warn('[ElevenLabs] Error:', response.status, await response.text());
    throw new Error(`ElevenLabs error: ${response.status}`);
  }

  const blob = await response.blob();
  const url  = URL.createObjectURL(blob);
  audioCache.set(text, url);
  return url;
}

// ── Main speak function ────────────────────────────────────
export async function speak(text: string): Promise<void> {
  // No ElevenLabs key → use native Web Speech API
  if (!API_KEY) {
    speakNative(text);
    return;
  }

  // ElevenLabs available → use it, fall back to native on error
  try {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
    const url   = await fetchAudio(text);
    const audio = new Audio(url);
    currentAudio = audio;
    await audio.play();
  } catch (e) {
    console.warn('[Voice] ElevenLabs failed, falling back to Web Speech:', e);
    speakNative(text);
  }
}

// ── Phrases ────────────────────────────────────────────────
export const phrases = {
  letterDetected: (letter: string) =>
    `Letter ${letter}.`,

  letterUnlocked: (letter: string) =>
    `Excellent! You unlocked letter ${letter}. Keep going!`,

  examLetterCorrect: (letter: string) =>
    `Letter ${letter}, correct!`,

  wordCompleted: (word: string) =>
    `Great job! You spelled ${word}!`,

  examFinished: (score: number) =>
    score === 100
      ? `Perfect! You finished the exam with a perfect score!`
      : `Well done! You finished the exam with a score of ${score} percent.`,
};
