import type { ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Compass, Globe, LibraryBig, MessageCircle, Settings } from "lucide-react";

const NAV = [
  { to: "/", label: "Discover", icon: Compass, end: true },
  { to: "/library", label: "Library", icon: LibraryBig, end: false },
  { to: "/genre", label: "Worlds", icon: Globe, end: false },
  { to: "/chat", label: "Companion", icon: MessageCircle, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

/** `/genre` hub + `/genre/:slug` — Shell gold yields so Enter / world accent own fuel. */
function isGenreSurface(pathname: string): boolean {
  return pathname === "/genre" || pathname.startsWith("/genre/");
}

/** In-world only (`/genre/:slug`) — hub keeps Companion; FAB owns Deepen/Talk. */
function isGenreWorldRoute(pathname: string): boolean {
  return pathname.startsWith("/genre/") && pathname.length > "/genre/".length;
}

function Logo() {
  return (
    <div className="flex items-center gap-2.5 px-2">
      <svg viewBox="0 0 100 100" className="h-7 w-7 shrink-0" aria-hidden>
        <path
          d="M50 8 L58 38 L88 46 L58 54 L50 88 L42 54 L12 46 L42 38 Z"
          fill="#e8b84b"
        />
      </svg>
      <span className="font-display text-[1.35rem] font-semibold tracking-wide text-mist-200">
        Lumina
      </span>
    </div>
  );
}

function navActiveClass(isActive: boolean, genreSurface: boolean, desktop: boolean) {
  if (!isActive) {
    return desktop
      ? "text-mist-300 hover:bg-white/[0.05] hover:text-mist-200"
      : "text-mist-300";
  }
  // Worlds hub + in-world: mist active — Enter (hub) / world-accent verbs own gold fuel.
  if (genreSurface) {
    return desktop
      ? "bg-white/[0.06] text-mist-200 ring-1 ring-white/10"
      : "text-mist-200";
  }
  return desktop
    ? "bg-gold-400/[0.12] text-gold-300 ring-1 ring-gold-400/20"
    : "text-gold-300";
}

function navLabel(to: string, label: string, inWorld: boolean): string {
  if (inWorld && to === "/chat") return "Archive chat";
  return label;
}

export function Shell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const genreSurface = isGenreSurface(pathname);
  const inWorld = isGenreWorldRoute(pathname);

  return (
    <div className="min-h-screen">
      <div className="grain" aria-hidden />

      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-8 border-r border-white/[0.06] bg-ink-950/70 px-4 py-7 backdrop-blur-xl md:flex">
        <Logo />
        <nav className="flex flex-col gap-1.5">
          {NAV.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              data-cuelume-toggle="tick"
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-[background-color,color,box-shadow] duration-200 ${navActiveClass(
                  isActive,
                  genreSurface,
                  true,
                )}`
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} aria-hidden />
              {navLabel(to, label, inWorld)}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 text-2xs leading-relaxed text-mist-300">
          Your private cinematic memory.
          <br />
          Stored locally, always yours.
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/[0.06] bg-ink-950/80 px-4 py-3 backdrop-blur-xl md:hidden">
        <Logo />
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-white/[0.06] bg-ink-950/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
        {NAV.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            data-cuelume-toggle="tick"
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors ${navActiveClass(
                isActive,
                genreSurface,
                false,
              )}`
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
            {navLabel(to, label, inWorld)}
          </NavLink>
        ))}
      </nav>

      <main className="pb-24 md:ml-60 md:pb-10">
        <div className="mx-auto w-full max-w-[1440px] px-4 pt-6 sm:px-6 lg:px-10">
          {children}
        </div>
      </main>
    </div>
  );
}
