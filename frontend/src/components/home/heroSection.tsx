import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BookOpen, Compass, FlaskConical, PenLine, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { HomeCategory, HomeHero } from "@/types/home";
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
  hero,
}: {
  categories: HomeCategory[];
  hero: HomeHero;
}) {
  return (
    <section className="home-container home-hero-section" id="home">
      <div className="home-hero-grid">
        <article className="home-hero-copy" data-lab-animate>
          <p className="home-eyebrow">
            <span />
            {hero.eyebrow}
          </p>
          <h1>{hero.title}</h1>
          <p className="home-hero-description">{hero.description}</p>
          <div className="home-hero-actions">
            <ButtonLink href={hero.primaryAction.href} icon={<ArrowRight size={16} />} variant="primary">
              {hero.primaryAction.label}
            </ButtonLink>
            <ButtonLink href={hero.secondaryAction.href} icon={<Compass size={15} />} variant="secondary">
              {hero.secondaryAction.label}
            </ButtonLink>
          </div>
        </article>

        <figure className="home-hero-figure" data-hero-motion data-lab-animate>
          <div className="home-hero-media">
            <Image
              alt={hero.coverAlt}
              className="object-cover"
              data-hero-motion-layer
              fill
              priority
              sizes="(min-width: 1024px) 540px, 100vw"
              src={hero.coverImage}
              unoptimized
            />
          </div>
          <span aria-hidden="true" className="home-hero-portal-frame" data-hero-portal-frame />
          <span aria-hidden="true" className="home-hero-glint" />
          <figcaption className="home-hero-caption" data-hero-motion-content>
            {hero.notes.map((note) => (
              <span key={note}>{note}</span>
            ))}
          </figcaption>
        </figure>
      </div>

      <div className="home-category-grid">
        {categories.map((category) => {
          const Icon = categoryIcons[category.icon];

          return (
            <Link className={cn("home-category-card", categoryToneClass[category.tone])} href={category.href} key={category.label} data-lab-animate>
              <span className="home-category-icon">
                <Icon size={22} />
              </span>
              <span className="min-w-0">
                <span className="home-category-title">{category.label}</span>
                <span className="home-category-detail">{category.detail}</span>
              </span>
              <ArrowRight className="home-category-arrow" size={16} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
