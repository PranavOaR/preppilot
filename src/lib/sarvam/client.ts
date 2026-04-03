const SARVAM_API_URL = (process.env.SARVAM_API_URL || "https://api.sarvam.ai").replace(/\/$/, "");
const SARVAM_API_KEY = (process.env.SARVAM_API_KEY || "").trim();

export async function textToSpeech(
  text: string,
  language: string = "en-IN",
  speaker: string = "meera"
): Promise<ArrayBuffer> {
  const res = await fetch(`${SARVAM_API_URL}/text-to-speech`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Sarvam requires lowercase header name
      "api-subscription-key": SARVAM_API_KEY,
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
    console.error(`[Sarvam TTS] ${res.status}:`, err);
    throw new Error(`Sarvam TTS failed: ${res.status} — ${err}`);
  }

  const data = await res.json();
  const base64Audio = data.audios?.[0];
  if (!base64Audio) {
    console.error("[Sarvam TTS] Unexpected response:", JSON.stringify(data));
    throw new Error("No audio returned from Sarvam TTS");
  }

  // Use Node.js Buffer instead of browser-only atob
  const buf = Buffer.from(base64Audio, "base64");
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}
