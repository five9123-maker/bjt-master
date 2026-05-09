'use client';

let voicesLoaded = false;
let jaVoice: SpeechSynthesisVoice | null = null;

function loadVoices(): Promise<void> {
  return new Promise((resolve) => {
    if (voicesLoaded) { resolve(); return; }
    const load = () => {
      const voices = window.speechSynthesis.getVoices();
      jaVoice = voices.find((v) => v.lang.startsWith('ja')) ?? null;
      voicesLoaded = true;
      resolve();
    };
    if (window.speechSynthesis.getVoices().length > 0) {
      load();
    } else {
      window.speechSynthesis.addEventListener('voiceschanged', load, { once: true });
    }
  });
}

export async function speak(text: string, rate = 1.0): Promise<void> {
  if (typeof window === 'undefined') return;
  await loadVoices();
  window.speechSynthesis.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = 'ja-JP';
  if (jaVoice) utt.voice = jaVoice;
  utt.rate = rate;
  window.speechSynthesis.speak(utt);
}
