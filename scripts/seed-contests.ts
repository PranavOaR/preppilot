/**
 * Seed script for contests collection.
 *
 * IMPORTANT: Before running this script you must temporarily relax the
 * Firestore security rules for the "contests" collection:
 *
 *   match /contests/{doc} {
 *     allow read, write: if true;
 *   }
 *
 * Remember to revert the rule after seeding.
 *
 * Run with:  npx tsx scripts/seed-contests.ts
 */

import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  Timestamp,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAJpHav3xhdRHoVMvNu2tiV5wR7al1Xptg",
  authDomain: "prepp-e0147.firebaseapp.com",
  projectId: "prepp-e0147",
  storageBucket: "prepp-e0147.firebasestorage.app",
  messagingSenderId: "884696227865",
  appId: "1:884696227865:web:8d53dd13b71ec2c1ae0a88",
};

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fetchProblemIds(
  type: "dsa" | "aptitude",
  count: number
): Promise<string[]> {
  const q = query(collection(db, "problems"), where("type", "==", type));
  const snap = await getDocs(q);
  const ids = snap.docs.map((d) => d.id);
  return ids.slice(0, count);
}

async function main() {
  console.log("Fetching existing problem IDs...");

  const dsaIds = await fetchProblemIds("dsa", 8);
  const aptitudeIds = await fetchProblemIds("aptitude", 5);

  if (dsaIds.length < 5) {
    console.error(
      `Need at least 5 DSA problems but only found ${dsaIds.length}. Run seed-problems.ts first.`
    );
    process.exit(1);
  }
  if (aptitudeIds.length < 5) {
    console.error(
      `Need at least 5 aptitude problems but only found ${aptitudeIds.length}. Run seed-aptitude.ts first.`
    );
    process.exit(1);
  }

  const now = new Date();

  const contests = [
    {
      title: "DSA Sprint Challenge",
      description:
        "Race through 5 data-structure and algorithm problems. Speed and accuracy both count!",
      startTime: Timestamp.fromDate(
        new Date(now.getTime() - 1 * 60 * 60 * 1000) // started 1 hour ago
      ),
      endTime: Timestamp.fromDate(
        new Date(now.getTime() + 2 * 60 * 60 * 1000) // ends in 2 hours
      ),
      duration: 180, // minutes
      problemIds: dsaIds.slice(0, 5),
      status: "active" as const,
      createdBy: "seed-script",
      createdAt: Timestamp.fromDate(
        new Date(now.getTime() - 2 * 60 * 60 * 1000)
      ),
    },
    {
      title: "Aptitude Blitz",
      description:
        "Test your quantitative and logical reasoning skills against the clock.",
      startTime: Timestamp.fromDate(
        new Date(now.getTime() + 24 * 60 * 60 * 1000) // starts tomorrow
      ),
      endTime: Timestamp.fromDate(
        new Date(now.getTime() + 26 * 60 * 60 * 1000) // 2 hours after start
      ),
      duration: 120,
      problemIds: aptitudeIds.slice(0, 5),
      status: "upcoming" as const,
      createdBy: "seed-script",
      createdAt: Timestamp.fromDate(now),
    },
    {
      title: "Weekly Coding Marathon",
      description:
        "A mix of DSA and aptitude problems for the weekly leaderboard showdown.",
      startTime: Timestamp.fromDate(
        new Date(now.getTime() - 48 * 60 * 60 * 1000) // started 2 days ago
      ),
      endTime: Timestamp.fromDate(
        new Date(now.getTime() - 24 * 60 * 60 * 1000) // ended yesterday
      ),
      duration: 240,
      problemIds: [
        ...dsaIds.slice(0, 5),
        ...aptitudeIds.slice(0, 3),
      ],
      status: "completed" as const,
      createdBy: "seed-script",
      createdAt: Timestamp.fromDate(
        new Date(now.getTime() - 72 * 60 * 60 * 1000)
      ),
    },
  ];

  console.log("Seeding contests...");

  for (const contest of contests) {
    const ref = await addDoc(collection(db, "contests"), contest);
    console.log(`  Created "${contest.title}" -> ${ref.id}`);
  }

  console.log("Done! 3 contests seeded.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
