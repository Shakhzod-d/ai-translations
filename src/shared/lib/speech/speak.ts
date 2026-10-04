/**
 * Pronunciation extension point. Uses the browser's speech synthesis today;
 * swap the implementation for a server-side TTS provider without touching the UI.
 */
export const speech = {
  isSupported: () => typeof window !== 'undefined' && 'speechSynthesis' in window,
  speak(text: string, lang = 'en-US') {
    if (!speech.isSupported()) return false;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
    return true;
  },
};
