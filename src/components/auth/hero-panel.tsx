import { FeatureCard } from "./feature-card";

const features = [
  {
    icon: "terminal",
    title: "Algorithmic Precision",
    description:
      "Master data structures through an interface designed for deep, focused practice.",
  },
  {
    icon: "map",
    title: "Curated Roadmaps",
    description:
      "Follow structured paths from foundational logic to advanced system design.",
  },
  {
    icon: "timer",
    title: "Persistence Metrics",
    description:
      "Track your growth with high-fidelity performance analytics and streaks.",
  },
];

export function HeroPanel() {
  return (
    <div className="flex flex-col justify-between h-full p-12 lg:p-16">
      <header>
        <h1 className="font-serif text-4xl lg:text-5xl text-on-surface font-medium tracking-tight">
          PrepPilot
        </h1>
        <p className="text-on-surface-variant text-base mt-3 max-w-md">
          The technical atelier for crafting clean code.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 my-12">
        {features.map((feature) => (
          <FeatureCard key={feature.icon} {...feature} />
        ))}
      </div>

    </div>
  );
}
