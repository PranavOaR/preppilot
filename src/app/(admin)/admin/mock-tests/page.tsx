"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase/client";
import type { MockTest } from "@/lib/types";

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: "bg-green-400/10 text-green-400",
  medium: "bg-yellow-400/10 text-yellow-400",
  hard: "bg-error-container/30 text-error-brand",
};

export default function AdminMockTestsPage() {
  const [tests, setTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  async function loadTests() {
    const snap = await getDocs(collection(db, "mockTests"));
    const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as MockTest);
    data.sort((a, b) => a.company.localeCompare(b.company));
    setTests(data);
  }

  useEffect(() => {
    loadTests().finally(() => setLoading(false));
  }, []);

  async function handleDelete(testId: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(testId);
    try {
      await deleteDoc(doc(db, "mockTests", testId));
      setTests((prev) => prev.filter((t) => t.id !== testId));
    } finally {
      setDeleting(null);
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <span className="material-symbols-outlined text-outline text-4xl animate-spin">
          progress_activity
        </span>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
            Mock Tests
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Manage company mock test templates.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-on-surface-variant text-sm">{tests.length} tests</span>
          <Link
            href="/admin/mock-tests/create"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium gradient-primary text-on-primary hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[18px]">add</span>
            New Test
          </Link>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-xl bg-surface-container-low subtle-border p-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-outline mb-4 block">quiz</span>
          <p className="text-on-surface-variant text-sm">
            No mock tests yet. Run the seed script or create one manually.
          </p>
          <code className="mt-4 block text-xs text-outline bg-surface-container px-4 py-2 rounded-lg inline-block">
            npx ts-node --project tsconfig.json scripts/seed-mock-tests.ts
          </code>
        </div>
      ) : (
        <div className="rounded-xl bg-surface-container-low subtle-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Title</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Company</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Difficulty</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Duration</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Questions</th>
                <th className="text-left text-on-surface-variant text-xs font-medium uppercase tracking-wider px-4 py-3">Sections</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => {
                const totalQ = test.sections.reduce((s, sec) => s + (sec.problemIds?.length ?? sec.count), 0);
                return (
                  <tr key={test.id} className="border-b border-outline-variant/5 hover:bg-surface-container transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-on-surface text-sm font-medium">{test.title}</p>
                      <p className="text-outline text-xs font-mono mt-0.5">{test.id}</p>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-sm">{test.company}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-medium capitalize ${DIFFICULTY_STYLES[test.difficulty]}`}>
                        {test.difficulty}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant text-sm">{test.durationMinutes} min</td>
                    <td className="px-4 py-3 text-on-surface text-sm font-mono">{totalQ}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {test.sections.map((s) => (
                          <span key={s.label} className="text-[10px] px-1.5 py-0.5 rounded bg-surface-container text-on-surface-variant">
                            {s.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/admin/mock-tests/${test.id}/edit`}
                          className="text-primary-brand hover:underline text-sm"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(test.id, test.title)}
                          disabled={deleting === test.id}
                          className="text-error-brand hover:underline text-sm disabled:opacity-50"
                        >
                          {deleting === test.id ? "..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
