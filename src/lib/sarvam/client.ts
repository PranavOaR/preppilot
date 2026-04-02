const SARVAM_API_URL = process.env.SARVAM_API_URL || "https://api.sarvam.ai";
const SARVAM_API_KEY = process.env.SARVAM_API_KEY || "";

export async function textToSpeech(
  text: string,
  language: string = "en-IN",
  speaker: string = "meera"
): Promise<ArrayBuffer> {
  const res = await fetch(`${SARVAM_API_URL}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-Subscription-Key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code: language,
      speaker,
      model: "bulbul:v2",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sarvam TTS failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  // Sarvam returns base64-encoded audio
  const base64Audio = data.audios?.[0];
  if (!base64Audio) throw new Error("No audio returned from Sarvam TTS");

  // Convert base64 to ArrayBuffer
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function speechToText(
  audioData: ArrayBuffer,
  language: string = "en-IN"
): Promise<string> {
  // Convert ArrayBuffer to base64
  const uint8 = new Uint8Array(audioData);
  let binary = "";
  for (let i = 0; i < uint8.length; i++) {
    binary += String.fromCharCode(uint8[i]);
  }
  const base64 = btoa(binary);

  const res = await fetch(`${SARVAM_API_URL}/speech-to-text-translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "API-Subscription-Key": SARVAM_API_KEY,
    },
    body: JSON.stringify({
      input: base64,
      source_language_code: language,
      model: "saaras:v2",
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Sarvam STT failed: ${res.status} ${err}`);
  }

  const data = await res.json();
  return data.transcript || "";
}
