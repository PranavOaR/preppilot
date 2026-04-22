import type { Metadata } from "next";
import { getProblemBySlug } from "@/lib/db/problems";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const problem = await getProblemBySlug(params.slug);
  if (!problem) return { title: "Problem Not Found" };

  const diffMap = { easy: "Easy", medium: "Medium", hard: "Hard" };
  const typeLabel = problem.type === "dsa" ? "DSA" : "Aptitude";
  const companies = problem.companies.slice(0, 3).join(", ");

  return {
    title: `${problem.title} — ${typeLabel} ${diffMap[problem.difficulty]}`,
    description:
      `Practice "${problem.title}" — a ${diffMap[problem.difficulty].toLowerCase()} ${typeLabel} problem` +
      (companies ? ` asked by ${companies}` : "") +
      `. Improve your placement preparation on PrepPilot.`,
    openGraph: {
      title: `${problem.title} | PrepPilot`,
      description: problem.description.slice(0, 200),
    },
  };
}

export default function ProblemLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
