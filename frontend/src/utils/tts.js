/**
 * VoxDesk AI — Browser-based Text-to-Speech (TTS)
 * Strictly zero cost. Uses browser window.speechSynthesis.
 * No external TTS provider or paid voice API is used.
 */

export function speakConfirmation(text, { onEnd, onError } = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    console.warn('SpeechSynthesis is not supported in this browser.');
    if (onError) onError(new Error('SpeechSynthesis not supported'));
    return false;
  }

  try {
    // Cancel any ongoing utterances
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    // Try to find an English voice (en-IN preferred, then en-*)
    const voices = window.speechSynthesis.getVoices();
    const voice = voices.find((v) => v.lang === 'en-IN') || voices.find((v) => v.lang && v.lang.startsWith('en'));
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || 'en-US';

    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = onError;

    window.speechSynthesis.speak(utterance);
    return true;
  } catch (err) {
    console.error('SpeechSynthesis error:', err);
    if (onError) onError(err);
    return false;
  }
}

export function stopSpeaking() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}

