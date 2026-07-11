export function SectionIntro({
  index,
  title,
  description,
}: {
  index: string;
  title: string;
  description: string;
}) {
  return (
    <header className="lab-section-intro">
      <span className="lab-mono lab-section-index">{index}</span>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </header>
  );
}
