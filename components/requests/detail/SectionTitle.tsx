export function SectionTitle({ title, description }: { title: string; description?: string }) {
  return (
    <div>
      <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
}
