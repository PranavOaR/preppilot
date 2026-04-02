interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="rounded-lg bg-surface-container-high p-6 subtle-border">
      <span className="material-symbols-outlined text-primary-brand text-2xl mb-4 block">
        {icon}
      </span>
      <h3 className="font-serif text-on-surface text-lg font-medium mb-2">
        {title}
      </h3>
      <p className="text-on-surface-variant text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
