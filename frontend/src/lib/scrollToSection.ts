type SectionScroller = (section: HTMLElement) => void;

let sectionScroller: SectionScroller | null = null;

export function registerSectionScroller(scroller: SectionScroller) {
  sectionScroller = scroller;
  return () => {
    sectionScroller = null;
  };
}

export function scrollToSection(sectionId: string) {
  const section = document.getElementById(sectionId);
  if (!section) {
    throw new Error(`首页区块不存在：${sectionId}`);
  }

  if (sectionScroller) {
    sectionScroller(section);
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  section.scrollIntoView({
    behavior: reduceMotion ? "auto" : "smooth",
    block: "start",
  });
}
