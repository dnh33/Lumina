import type { ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { Compass, LibraryBig, Settings, Sparkles } from "lucide-react";

const NAV = [
  { to: "/", label: "Discover", icon: Compass, end: true },
  { to: "/library", label: "Library", icon: LibraryBig, end: false },
  { to: "/chat", label: "Companion", icon: Sparkles, end: false },
  { to: "/settings", label: "Settings", icon: Settings, end: false },
];

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

export function Shell({ children }: { children: ReactNode }) {
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
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.92rem] font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-gold-400/[0.12] text-gold-300 ring-1 ring-gold-400/20"
                    : "text-mist-400 hover:bg-white/[0.05] hover:text-mist-200"
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto px-3 text-2xs leading-relaxed text-mist-400">
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
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2.5 text-[0.65rem] font-medium transition-colors ${
                isActive ? "text-gold-300" : "text-mist-400"
              }`
            }
          >
            <Icon className="h-5 w-5" strokeWidth={1.8} />
            {label}
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
