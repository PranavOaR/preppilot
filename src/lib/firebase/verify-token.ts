/**
 * Server-side Firebase ID token verification without the Admin SDK.
 * Uses the Firebase Auth REST API.
 */
export async function verifyIdToken(token: string): Promise<{ uid: string } | null> {
  try {
    const res = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: token }),
      }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (data.error || !data.users?.[0]) return null;
    return { uid: data.users[0].localId as string };
  } catch {
    return null;
  }
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  return auth?.startsWith("Bearer ") ? auth.slice(7) : null;
}
