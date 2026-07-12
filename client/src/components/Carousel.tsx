import { useRef, type ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Props {
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

/** Horizontal, swipeable row with elegant edge fades and hover arrows. */
export function Carousel({ title, eyebrow, children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    ref.current?.scrollBy({
      left: dir * (ref.current.clientWidth * 0.8),
      behavior: "smooth",
    });
  };

  return (
    <section className="group/row relative mb-10">
      <div className="mb-3 flex items-end justify-between">
        <div>
          {eyebrow && <p className="eyebrow mb-0.5">{eyebrow}</p>}
          <h2 className="font-display text-xl font-semibold text-mist-200">
            {title}
          </h2>
        </div>
        <div className="hidden gap-1.5 opacity-0 transition-opacity duration-200 group-focus-within/row:opacity-100 group-hover/row:opacity-100 md:flex">
          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scrollBy(-1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-mist-300 ring-1 ring-white/10 transition hover:bg-gold-400 hover:text-ink-950"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scrollBy(1)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-mist-300 ring-1 ring-white/10 transition hover:bg-gold-400 hover:text-ink-950"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="no-scrollbar -mx-1 flex gap-4 overflow-x-auto scroll-smooth px-1 pb-2 [scroll-snap-type:x_proximity]"
      >
        {children}
      </div>
    </section>
  );
}
