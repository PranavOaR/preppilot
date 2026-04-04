/**
 * seed-resources.ts
 * Patches existing DSA problems with curated learning resources.
 * Run: npx ts-node --project tsconfig.json scripts/seed-resources.ts
 */
import { initializeApp, getApps } from "firebase/app";
import {
  getFirestore,
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
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

interface ProblemResource {
  title: string;
  url: string;
  type: "video" | "article" | "similar";
}

// Keyed by problem slug
const resourceMap: Record<string, ProblemResource[]> = {
  "two-sum": [
    { title: "Two Sum — NeetCode Walkthrough", url: "https://www.youtube.com/watch?v=KLlXCFG5TnA", type: "video" },
    { title: "Two Sum — GeeksForGeeks", url: "https://www.geeksforgeeks.org/find-pair-with-given-sum-in-an-array/", type: "article" },
    { title: "Four Sum (harder variant)", url: "/practice/four-sum", type: "similar" },
  ],
  "best-time-to-buy-sell-stock": [
    { title: "Buy & Sell Stock — NeetCode", url: "https://www.youtube.com/watch?v=1pkOgXD63yU", type: "video" },
    { title: "Stock Buy Sell — GeeksForGeeks", url: "https://www.geeksforgeeks.org/best-time-to-buy-and-sell-stock/", type: "article" },
    { title: "Maximum Subarray (Kadane's)", url: "/practice/maximum-subarray", type: "similar" },
  ],
  "contains-duplicate": [
    { title: "Contains Duplicate — NeetCode", url: "https://www.youtube.com/watch?v=3OamzN90kPg", type: "video" },
    { title: "Duplicates in Array — GeeksForGeeks", url: "https://www.geeksforgeeks.org/find-duplicates-in-on-time-and-constant-extra-space/", type: "article" },
    { title: "Two Sum", url: "/practice/two-sum", type: "similar" },
  ],
  "maximum-subarray": [
    { title: "Kadane's Algorithm — NeetCode", url: "https://www.youtube.com/watch?v=5WZl3MMT0Eg", type: "video" },
    { title: "Kadane's Algorithm — GeeksForGeeks", url: "https://www.geeksforgeeks.org/largest-sum-contiguous-subarray/", type: "article" },
    { title: "Best Time to Buy & Sell Stock", url: "/practice/best-time-to-buy-sell-stock", type: "similar" },
  ],
  "valid-parentheses": [
    { title: "Valid Parentheses — NeetCode", url: "https://www.youtube.com/watch?v=WTzjTskDFMg", type: "video" },
    { title: "Balanced Parentheses — GeeksForGeeks", url: "https://www.geeksforgeeks.org/check-for-balanced-parentheses-in-an-expression/", type: "article" },
  ],
  "reverse-linked-list": [
    { title: "Reverse Linked List — NeetCode", url: "https://www.youtube.com/watch?v=G0_I-ZF0S38", type: "video" },
    { title: "Reverse a Linked List — GeeksForGeeks", url: "https://www.geeksforgeeks.org/reverse-a-linked-list/", type: "article" },
  ],
  "binary-search": [
    { title: "Binary Search — NeetCode", url: "https://www.youtube.com/watch?v=s4DPM8ct1pI", type: "video" },
    { title: "Binary Search Algorithm — GeeksForGeeks", url: "https://www.geeksforgeeks.org/binary-search/", type: "article" },
  ],
  "climbing-stairs": [
    { title: "Climbing Stairs — NeetCode", url: "https://www.youtube.com/watch?v=Y0lT9Fck7qI", type: "video" },
    { title: "Climbing Stairs (DP) — GeeksForGeeks", url: "https://www.geeksforgeeks.org/count-ways-reach-nth-stair/", type: "article" },
    { title: "Fibonacci Number", url: "/practice/fibonacci-number", type: "similar" },
  ],
  "invert-binary-tree": [
    { title: "Invert Binary Tree — NeetCode", url: "https://www.youtube.com/watch?v=OnSn2XEQ4MY", type: "video" },
    { title: "Mirror of a Tree — GeeksForGeeks", url: "https://www.geeksforgeeks.org/create-mirror-tree-from-the-given-binary-tree/", type: "article" },
  ],
  "number-of-islands": [
    { title: "Number of Islands — NeetCode", url: "https://www.youtube.com/watch?v=pV2kpPD66nE", type: "video" },
    { title: "Find number of islands — GeeksForGeeks", url: "https://www.geeksforgeeks.org/find-number-of-islands/", type: "article" },
    { title: "Max Area of Island", url: "/practice/max-area-of-island", type: "similar" },
  ],
};

async function getProblemIdBySlug(slug: string): Promise<string | null> {
  const q = query(collection(db, "problems"), where("slug", "==", slug));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return snap.docs[0].id;
}

async function seed() {
  const slugs = Object.keys(resourceMap);
  let patched = 0;
  let notFound = 0;

  for (const slug of slugs) {
    const id = await getProblemIdBySlug(slug);
    if (!id) {
      console.log(`  ⚠ Problem not found: ${slug}`);
      notFound++;
      continue;
    }
    await updateDoc(doc(db, "problems", id), {
      resources: resourceMap[slug],
    });
    console.log(`  ✓ Patched: ${slug} (${resourceMap[slug].length} resources)`);
    patched++;
  }

  console.log(`\nDone: ${patched} problems patched, ${notFound} not found.`);
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
