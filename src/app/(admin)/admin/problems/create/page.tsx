"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { ProblemForm } from "@/components/admin/problem-form";
import { createProblem } from "@/lib/db/problems";

export default function CreateProblemPage() {
  const router = useRouter();
  const { user } = useAuth();

  async function handleSubmit(data: any) {
    if (!user) return;
    await createProblem({
      ...data,
      createdBy: user.uid,
    });
    router.push("/admin/problems");
  }

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="font-serif text-2xl text-on-surface font-medium tracking-tight">
          Create Problem
        </h1>
        <p className="text-on-surface-variant text-sm mt-1">
          Add a new DSA or Aptitude problem to the platform.
        </p>
      </div>
      <ProblemForm onSubmit={handleSubmit} submitLabel="Create Problem" />
    </div>
  );
}
