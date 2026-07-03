import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Compass, FlaskConical, PenLine, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HomeCategory, HomeFeature, HomeHero } from "@/types/home";
import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { categoryToneClass } from "./homeTone";

const categoryIcons: Record<HomeCategory["icon"], LucideIcon> = {
  book: BookOpen,
  compass: Compass,
  flask: FlaskConical,
  pen: PenLine,
  spark: Sparkles,
};

export function HeroSection({
  categories,
  feature,
  hero,
}: {
  categories: HomeCategory[];
  feature: HomeFeature;
  hero: HomeHero;
}) {
  return (
    <section className="home-container pb-10 pt-5 md:pb-14" id="home">
      <div className="home-hero-grid">
        <article className="home-hero-card" data-lab-animate>
          <div className="home-hero-copy">
            <p className="home-eyebrow">{hero.eyebrow}</p>
            <h1 className="mt-4 max-w-3xl font-lab-display text-4xl font-semibold leading-[1.08] text-[var(--text-strong)] md:text-6xl">
              {hero.title}
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-8 text-[var(--muted)]">{hero.description}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href={hero.primaryAction.href} icon={<BookOpen size={16} />} variant="primary">
                {hero.primaryAction.label}
              </ButtonLink>
              <ButtonLink href={hero.secondaryAction.href} icon={<ArrowRight size={16} />} variant="secondary">
                {hero.secondaryAction.label}
              </ButtonLink>
            </div>
          </div>

          <figure className="home-hero-figure">
            <Image alt={hero.coverAlt} className="object-cover" fill priority sizes="(min-width: 1024px) 310px, 100vw" src={hero.coverImage} unoptimized />
            <figcaption className="home-hero-caption">
              {hero.notes.map((note) => (
                <span key={note}>{note}</span>
              ))}
            </figcaption>
          </figure>
        </article>

        <aside className="home-feature-card" data-lab-animate>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-lab-mono text-xs font-semibold text-[var(--muted)]">{feature.label}</p>
              <h2 className="mt-3 font-lab-display text-3xl font-semibold leading-tight text-[var(--text-strong)]">{feature.title}</h2>
            </div>
            <span className="home-feature-meta">{feature.meta}</span>
          </div>
          <p className="mt-7 text-sm leading-7 text-[var(--muted)]">{feature.description}</p>
          <div className="mt-8 grid grid-cols-3 gap-3">
            {feature.stats.map((stat) => (
              <div className="home-stat" key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </aside>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon];

          return (
            <Link className={cn("home-category-card", categoryToneClass[category.tone])} href={category.href} key={category.label} data-lab-animate>
              <span>
                <span className="block font-lab-display text-xl font-semibold text-[var(--text-strong)]">{category.label}</span>
                <span className="mt-1 block font-lab-mono text-xs text-[var(--muted)]">{category.detail}</span>
              </span>
              <Icon className="opacity-80" size={24} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
