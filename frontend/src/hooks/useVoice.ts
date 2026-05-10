// ElevenLabs Text-to-Speech — Rachel voice
// Voice ID: 21m00Tcm4TlvDq8ikWAM

const API_KEY  = import.meta.env.VITE_ELEVENLABS_API_KEY as string;
const VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel
const API_URL  = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`;

const audioCache = new Map<string, string>();
let currentAudio: HTMLAudioElement | null = null;

async function fetchAudio(text: string): Promise<string> {
  if (audioCache.has(text)) return audioCache.get(text)!;

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'xi-api-key': API_KEY,
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

export async function speak(text: string): Promise<void> {
  if (!API_KEY) { console.warn('[Voice] No API key set'); return; }
  try {
    if (currentAudio) { currentAudio.pause(); currentAudio.currentTime = 0; }
    const url   = await fetchAudio(text);
    const audio = new Audio(url);
    currentAudio = audio;
    await audio.play();
  } catch (e) {
    console.warn('[Voice] Could not play audio:', e);
  }
}

// ── Phrases ────────────────────────────────────────────────
export const phrases = {
  // Al detectar la seña de una letra (cada intento correcto confirmado)
  letterDetected: (letter: string) =>
    `Letter ${letter}.`,

  // Al completar la letra (5 intentos correctos) y desbloquear la siguiente
  letterUnlocked: (letter: string) =>
    `Excellent! You unlocked letter ${letter}. Keep going!`,

  // Al completar una letra en examen
  examLetterCorrect: (letter: string) =>
    `Letter ${letter}, correct!`,

  // Al completar una palabra en Practice o Exam
  wordCompleted: (word: string) =>
    `Great job! You spelled ${word}!`,

  // Al terminar el examen
  examFinished: (score: number) =>
    score === 100
      ? `Perfect! You finished the exam with a perfect score!`
      : `Well done! You finished the exam with a score of ${score} percent.`,
};
