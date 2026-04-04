/**
 * seed-mock-tests.ts
 * Populates the mockTests collection with 4 company mock tests.
 * Run: npx ts-node --project tsconfig.json scripts/seed-mock-tests.ts
 */
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, setDoc, query, where } from "firebase/firestore";

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

interface ProblemDoc {
  id: string;
  type: string;
  topic: string;
  difficulty: string;
  title: string;
}

async function getProblems(): Promise<ProblemDoc[]> {
  const snap = await getDocs(collection(db, "problems"));
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
  if (topics) pool = pool.filter((p) => topics.some((t) => p.topic.includes(t)));
  if (difficulty) pool = pool.filter((p) => p.difficulty === difficulty);
  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((p) => p.id);
}

async function seed() {
  const problems = await getProblems();
  console.log(`Found ${problems.length} problems`);

  const aptitudeProblems = problems.filter((p) => p.type === "aptitude");
  const dsaProblems = problems.filter((p) => p.type === "dsa");

  console.log(`  Aptitude: ${aptitudeProblems.length}, DSA: ${dsaProblems.length}`);

  // ─── TCS NQT ───
  const tcsQuant = pickByType(problems, "aptitude", 10, [
    "numbers", "percentages", "profit-and-loss", "time-and-work", "average",
    "ratio-and-proportion", "time-speed-distance",
  ]);
  const tcsVerbal = pickByType(problems, "aptitude", 5);
  const tcsReasoning = pickByType(problems, "aptitude", 5, [
    "permutation-and-combination", "probability", "algebra",
  ]);
  const tcsCoding = pickByType(problems, "dsa", 2, [], "easy");

  // Deduplicate aptitude picks
  const tcsAptAll = Array.from(new Set([...tcsQuant, ...tcsVerbal, ...tcsReasoning])).slice(0, 20);

  await setDoc(doc(db, "mockTests", "tcs-nqt-2024"), {
    company: "TCS",
    title: "TCS NQT 2024 Pattern",
    description: "National Qualifier Test pattern with quantitative aptitude, verbal ability, reasoning, and coding sections.",
    durationMinutes: 90,
    difficulty: "medium",
    tags: ["TCS", "NQT", "aptitude", "coding"],
    sections: [
      {
        label: "Quantitative Aptitude",
        type: "aptitude",
        problemIds: tcsAptAll.slice(0, 10),
        count: 10,
      },
      {
        label: "Verbal & Reasoning",
        type: "aptitude",
        problemIds: tcsAptAll.slice(10, 20),
        count: 10,
      },
      {
        label: "Coding",
        type: "dsa",
        problemIds: tcsCoding,
        count: 2,
      },
    ],
  });
  console.log("✓ TCS NQT seeded");

  // ─── Infosys InfyTQ ───
  const infyApt = Array.from(new Set(pickByType(problems, "aptitude", 20))).slice(0, 20);
  const infyCoding = pickByType(problems, "dsa", 2, [], "easy");

  await setDoc(doc(db, "mockTests", "infosys-infytq-2024"), {
    company: "Infosys",
    title: "Infosys InfyTQ Pattern",
    description: "Infosys placement test with aptitude and two coding problems. Focus on logical reasoning and problem-solving.",
    durationMinutes: 60,
    difficulty: "easy",
    tags: ["Infosys", "InfyTQ", "aptitude", "coding"],
    sections: [
      {
        label: "Aptitude & Reasoning",
        type: "aptitude",
        problemIds: infyApt,
        count: 20,
      },
      {
        label: "Coding",
        type: "dsa",
        problemIds: infyCoding,
        count: 2,
      },
    ],
  });
  console.log("✓ Infosys InfyTQ seeded");

  // ─── Wipro Elite ───
  const wiproApt = Array.from(new Set(pickByType(problems, "aptitude", 20))).slice(0, 20);
  const wiproCoding = pickByType(problems, "dsa", 3, [], "easy");

  await setDoc(doc(db, "mockTests", "wipro-elite-2024"), {
    company: "Wipro",
    title: "Wipro Elite NLTH Pattern",
    description: "Wipro Elite National Level Talent Hunt with aptitude and three coding challenges of increasing difficulty.",
    durationMinutes: 60,
    difficulty: "medium",
    tags: ["Wipro", "Elite", "NLTH", "aptitude", "coding"],
    sections: [
      {
        label: "Aptitude",
        type: "aptitude",
        problemIds: wiproApt,
        count: 20,
      },
      {
        label: "Coding",
        type: "dsa",
        problemIds: wiproCoding,
        count: 3,
      },
    ],
  });
  console.log("✓ Wipro Elite seeded");

  // ─── Zoho Aptitude Only ───
  const zohoApt = Array.from(new Set(pickByType(problems, "aptitude", 30))).slice(0, 30);

  await setDoc(doc(db, "mockTests", "zoho-aptitude-2024"), {
    company: "Zoho",
    title: "Zoho Aptitude Round",
    description: "Zoho aptitude-only test covering numbers, algebra, geometry, permutations, and probability over 60 minutes.",
    durationMinutes: 60,
    difficulty: "hard",
    tags: ["Zoho", "aptitude", "math"],
    sections: [
      {
        label: "Quantitative Aptitude",
        type: "aptitude",
        problemIds: zohoApt.slice(0, 15),
        count: 15,
      },
      {
        label: "Logical Reasoning",
        type: "aptitude",
        problemIds: zohoApt.slice(15, 30),
        count: 15,
      },
    ],
  });
  console.log("✓ Zoho Aptitude seeded");

  console.log("\nAll mock tests seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
