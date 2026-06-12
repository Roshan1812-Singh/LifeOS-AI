import * as Speech from "expo-speech";

/**
 * Reads text aloud using the device text-to-speech engine. Used to speak the
 * assistant's replies for a hands-free experience.
 */
export function speak(text: string): void {
  if (!text) {
    return;
  }
  Speech.stop();
  Speech.speak(text, { rate: 1.0, pitch: 1.0 });
}

export function stopSpeaking(): void {
  Speech.stop();
}
