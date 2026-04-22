"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProblemById, updateProblem } from "@/lib/db/problems";
import { ProblemForm } from "@/components/admin/problem-form";
import { AdminEditorialEditor } from "@/components/admin/editorial-editor";
import type { Problem } from "@/lib/types";

export default function EditProblemPage() {
  const params = useParams();
  const router = useRouter();
  const problemId = params.id as string;
  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const p = await getProblemById(problemId);
      setProblem(p);
      setLoading(false);
    }
    load();
  }, [problemId]);

  async function handleSubmit(data: any) {
    await updateProblem(problemId, data);
    router.push("/admin/problems");
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

  if (!problem) {
    return (
      <div className="p-8">
        <p className="text-on-surface-variant">Problem not found.</p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Edit Problem
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Editing: {problem.title}
        </p>
      </div>
      <ProblemForm
        initialData={problem}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
      <div className="mt-10">
        <AdminEditorialEditor problemId={problemId} />
      </div>
    </div>
  );
}
