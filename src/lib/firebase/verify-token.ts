/**
 * Server-side Firebase ID token verification without the Admin SDK.
 *
 * Verifies the JWT signature against Google's JWK public keys, checks
 * expiration, issuer, and audience — matching what Firebase Admin SDK does.
 */

interface JWTHeader { alg: string; kid: string; typ?: string }
interface JWTPayload {
  sub: string;     // uid
  iss: string;
  aud: string;
  exp: number;
  iat: number;
  auth_time?: number;
  [key: string]: unknown;
}

interface JWK {
  kty: string;
  kid: string;
  n: string;
  e: string;
  alg: string;
  use: string;
}

let cachedKeys: Record<string, CryptoKey> = {};
let cacheExpiry = 0;

const FIREBASE_PROJECT_ID =
  process.env.FIREBASE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
  "";
const GOOGLE_JWK_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com";

/** Fetch and cache Google's public keys (JWK format) for Firebase token verification. */
async function getPublicKeys(): Promise<Record<string, CryptoKey>> {
  if (Date.now() < cacheExpiry && Object.keys(cachedKeys).length > 0) {
    return cachedKeys;
  }

  const res = await fetch(GOOGLE_JWK_URL);
  if (!res.ok) {
    // Serve stale keys on transient failure rather than throwing — avoids
    // mass-logout if googleapis.com is briefly unavailable.
    if (Object.keys(cachedKeys).length > 0) return cachedKeys;
    throw new Error("Failed to fetch Google public keys");
  }

  // Cache based on Cache-Control max-age
  const cc = res.headers.get("cache-control") || "";
  const maxAgeMatch = cc.match(/max-age=(\d+)/);
  const maxAge = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) : 3600;
  cacheExpiry = Date.now() + maxAge * 1000;

  const jwks: { keys: JWK[] } = await res.json();
  const keys: Record<string, CryptoKey> = {};

  for (const jwk of jwks.keys) {
    keys[jwk.kid] = await crypto.subtle.importKey(
      "jwk",
      { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"]
    );
  }

  cachedKeys = keys;
  return keys;
}

function base64UrlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, "+").replace(/_/g, "/");
  const pad = b64.length % 4;
  const padded = pad ? b64 + "=".repeat(4 - pad) : b64;
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export async function verifyIdToken(token: string): Promise<{ uid: string } | null> {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const header: JWTHeader = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[0])));
    const payload: JWTPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(parts[1])));

    // Check algorithm
    if (header.alg !== "RS256") return null;

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp < now) return null;
    if (payload.iat > now + 10) return null; // allow 10s clock skew

    // Check issuer and audience
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (!payload.sub || typeof payload.sub !== "string") return null;

    // Verify signature against Google's public keys
    const keys = await getPublicKeys();
    const publicKey = keys[header.kid];
    if (!publicKey) return null;

    const signedData = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
    const signature = base64UrlDecode(parts[2]);

    const valid = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      publicKey,
      signature.buffer as ArrayBuffer,
      signedData
    );

    if (!valid) return null;

    return { uid: payload.sub };
  } catch {
    return null;
  }
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}
