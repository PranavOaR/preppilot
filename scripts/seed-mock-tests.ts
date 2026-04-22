/**
 * seed-mock-tests.ts
 * Populates the mockTests collection with 4 company mock tests.
 *
 * Requires FIREBASE_SERVICE_ACCOUNT_JSON in .env.local:
 *   1. Firebase Console → Project Settings → Service Accounts
 *   2. Click "Generate new private key" → download JSON
 *   3. Add to .env.local:
 *      FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":...}'
 *
 * Run: npx ts-node --project tsconfig.json scripts/seed-mock-tests.ts
 */

import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
if (!serviceAccountJson) {
  console.error(`
ERROR: FIREBASE_SERVICE_ACCOUNT_JSON is not set in .env.local

To fix:
  1. Go to Firebase Console → Project Settings → Service Accounts
  2. Click "Generate new private key" and download the JSON file
  3. Add to .env.local:
     FIREBASE_SERVICE_ACCOUNT_JSON='<paste the entire JSON on one line>'
  4. Run the seed script again
`);
  process.exit(1);
}

const app = getApps().find((a) => a.name === "seed") ??
  initializeApp({ credential: cert(JSON.parse(serviceAccountJson)) }, "seed");
const db = getFirestore(app);

interface ProblemDoc {
  id: string;
  type: string;
  topic: string;
  difficulty: string;
  title: string;
  status?: string;
}

async function getProblems(): Promise<ProblemDoc[]> {
  const snap = await db.collection("problems").where("status", "==", "published").get();
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProblemDoc));
}

function pickByType(
  problems: ProblemDoc[],
  type: "aptitude" | "dsa",
  count: number,
  topics?: string[],
  difficulty?: string
): string[] {
  let pool = problems.filter((p) => p.type === type);
  if (topics && topics.length > 0) {
    const byTopic = pool.filter((p) => topics.some((t) => p.topic.includes(t)));
    if (byTopic.length >= Math.ceil(count / 2)) pool = byTopic;
  }
  if (difficulty) {
    const byDiff = pool.filter((p) => p.difficulty === difficulty);
    if (byDiff.length >= count) pool = byDiff;
  }
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((p) => p.id);
}

async function seed() {
  const problems = await getProblems();
  console.log(`Found ${problems.length} published problems`);

  const aptitude = problems.filter((p) => p.type === "aptitude");
  const dsa = problems.filter((p) => p.type === "dsa");
  console.log(`  Aptitude: ${aptitude.length}, DSA: ${dsa.length}`);

  if (aptitude.length === 0) {
    console.error("No aptitude problems found. Run seed-aptitude.ts first.");
    process.exit(1);
  }

  // ─── TCS NQT ───
  const tcsApt = Array.from(new Set([
    ...pickByType(problems, "aptitude", 10, ["numbers", "percentages", "profit-and-loss", "time-and-work", "average", "ratio-and-proportion", "time-speed-distance"]),
    ...pickByType(problems, "aptitude", 5, ["permutation-and-combination", "probability", "algebra"]),
    ...pickByType(problems, "aptitude", 5),
  ])).slice(0, 20);
  const tcsCoding = pickByType(problems, "dsa", 2, [], "easy");

  await db.collection("mockTests").doc("tcs-nqt-2024").set({
    company: "TCS",
    title: "TCS NQT 2024 Pattern",
    description: "National Qualifier Test with quantitative aptitude, verbal ability, reasoning, and two coding problems.",
    durationMinutes: 90,
    difficulty: "medium",
    tags: ["TCS", "NQT", "aptitude", "coding"],
    sections: [
      { label: "Quantitative Aptitude", type: "aptitude", problemIds: tcsApt.slice(0, 10), count: 10 },
      { label: "Verbal & Reasoning", type: "aptitude", problemIds: tcsApt.slice(10, 20), count: 10 },
      ...(tcsCoding.length > 0 ? [{ label: "Coding", type: "dsa", problemIds: tcsCoding, count: tcsCoding.length }] : []),
    ],
  });
  console.log("✓ TCS NQT seeded");

  // ─── Infosys InfyTQ ───
  const infyApt = Array.from(new Set(pickByType(problems, "aptitude", 20))).slice(0, 20);
  const infyCoding = pickByType(problems, "dsa", 2, [], "easy");

  await db.collection("mockTests").doc("infosys-infytq-2024").set({
    company: "Infosys",
    title: "Infosys InfyTQ Pattern",
    description: "Aptitude and reasoning focused test with two coding problems. Focus on logical thinking.",
    durationMinutes: 60,
    difficulty: "easy",
    tags: ["Infosys", "InfyTQ", "aptitude", "coding"],
    sections: [
      { label: "Aptitude & Reasoning", type: "aptitude", problemIds: infyApt, count: infyApt.length },
      ...(infyCoding.length > 0 ? [{ label: "Coding", type: "dsa", problemIds: infyCoding, count: infyCoding.length }] : []),
    ],
  });
  console.log("✓ Infosys InfyTQ seeded");

  // ─── Wipro Elite NLTH ───
  const wiproApt = Array.from(new Set(pickByType(problems, "aptitude", 20))).slice(0, 20);
  const wiproCoding = pickByType(problems, "dsa", 3, [], "easy");

  await db.collection("mockTests").doc("wipro-elite-2024").set({
    company: "Wipro",
    title: "Wipro Elite NLTH Pattern",
    description: "National Level Talent Hunt with aptitude and three coding challenges of increasing difficulty.",
    durationMinutes: 60,
    difficulty: "medium",
    tags: ["Wipro", "Elite", "NLTH", "aptitude", "coding"],
    sections: [
      { label: "Aptitude", type: "aptitude", problemIds: wiproApt, count: wiproApt.length },
      ...(wiproCoding.length > 0 ? [{ label: "Coding", type: "dsa", problemIds: wiproCoding, count: wiproCoding.length }] : []),
    ],
  });
  console.log("✓ Wipro Elite seeded");

  // ─── Zoho ───
  const zohoApt = Array.from(new Set(pickByType(problems, "aptitude", 30))).slice(0, 30);
  const zohoCoding = pickByType(problems, "dsa", 3, ["arrays", "strings", "hash-table", "dynamic-programming", "sorting"], "medium");

  await db.collection("mockTests").doc("zoho-developer-2024").set({
    company: "Zoho",
    title: "Zoho Developer Round",
    description: "Aptitude-heavy test with advanced coding. Zoho values deep problem-solving over memorization.",
    durationMinutes: 180,
    difficulty: "hard",
    tags: ["Zoho", "aptitude", "coding", "developer"],
    sections: [
      { label: "Quantitative Aptitude", type: "aptitude", problemIds: zohoApt.slice(0, 15), count: 15 },
      { label: "Logical Reasoning", type: "aptitude", problemIds: zohoApt.slice(15, 30), count: Math.max(0, zohoApt.length - 15) },
      ...(zohoCoding.length > 0 ? [{ label: "Programming", type: "dsa", problemIds: zohoCoding, count: zohoCoding.length }] : []),
    ],
  });
  console.log("✓ Zoho Developer seeded");

  console.log("\nAll mock tests seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
