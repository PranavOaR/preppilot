export const SUPPORTED_LANGUAGES = [
  { code: "en-IN", label: "English (India)" },
  { code: "hi-IN", label: "Hindi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "te-IN", label: "Telugu" },
  { code: "kn-IN", label: "Kannada" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "bn-IN", label: "Bengali" },
  { code: "mr-IN", label: "Marathi" },
  { code: "gu-IN", label: "Gujarati" },
] as const;

// Valid speaker IDs for Sarvam bulbul:v2 model
// Female: anushka, manisha, vidya, arya
// Male:   abhilash, karun, hitesh
export const SPEAKERS = [
  { id: "anushka", label: "Anushka", gender: "female" },
  { id: "abhilash", label: "Abhilash", gender: "male" },
] as const;

export type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]["code"];
export type SpeakerId = (typeof SPEAKERS)[number]["id"];
