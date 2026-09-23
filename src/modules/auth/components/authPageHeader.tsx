interface AuthPageHeaderProps {
  eyebrow: string;
  title: string;
  description: string;
}

export function AuthPageHeader({ eyebrow, title, description }: AuthPageHeaderProps) {
  return (
    <header>
      <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">{eyebrow}</p>

      <h1 className="mt-3 font-heading text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{title}</h1>

      <p className="mt-3 leading-relaxed text-muted-foreground">{description}</p>
    </header>
  );
}
