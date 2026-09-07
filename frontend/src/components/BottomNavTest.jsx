import {
  BarChart3,
  Home,
  Trophy,
  UsersRound,
} from "lucide-react";

import {
  motion,
  useReducedMotion,
} from "framer-motion";

import {
  NavLink,
  useLocation,
} from "react-router-dom";

import { useTheme } from "../hooks/useTheme";

const NAV_ITEMS = [
  {
    label: "Home",
    path: "/",
    icon: Home,
  },
  {
    label: "Teams",
    path: "/teamstest",
    icon: UsersRound,
  },
  {
    label: "Report",
    path: "/reporttest",
    icon: BarChart3,
  },
  {
    label: "Traguardi",
    path: "/AchievementTest",
    icon: Trophy,
  },
];

export default function BottomNavTest() {
  const location = useLocation();
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme } = useTheme();

  const isDark = resolvedTheme === "dark";

  function isActive(path) {
    if (path === "/") {
      return location.pathname === "/";
    }

    return location.pathname.startsWith(path);
  }

  return (
    <nav
      aria-label="Navigazione principale"
      className="
        fixed
        inset-x-0
        bottom-0
        z-40
        px-3
        sm:px-5
      "
      style={{
        paddingBottom:
          "max(0.75rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className={`
          relative
          mx-auto
          grid
          max-w-[540px]
          grid-cols-4
          rounded-[1.65rem]
          border
          p-1.5
          shadow-[0_-8px_32px_rgba(0,0,0,0.08)]
          backdrop-blur-xl
          ${
            isDark
              ? "border-white/[0.09] bg-zinc-950/90"
              : "border-zinc-900/[0.09] bg-white/90"
          }
        `}
      >
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              aria-label={item.label}
              aria-current={active ? "page" : undefined}
              className={`
                relative
                isolate
                flex
                min-h-[58px]
                flex-col
                items-center
                justify-center
                gap-1
                overflow-hidden
                rounded-[1.15rem]
                px-1
                text-[11px]
                font-bold
                transition-colors
                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-pink-500
                ${
                  active
                    ? "text-pink-500"
                    : isDark
                      ? "text-zinc-500 hover:bg-white/[0.05] hover:text-zinc-200"
                      : "text-zinc-500 hover:bg-zinc-900/[0.05] hover:text-zinc-800"
                }
              `}
            >
              {active && (
                <motion.span
                  layoutId="bottom-nav-active"
                  className={`
                    absolute
                    inset-0
                    -z-10
                    rounded-[1.15rem]
                    ${
                      isDark
                        ? "bg-pink-500/[0.12]"
                        : "bg-pink-500/10"
                    }
                  `}
                  transition={{
                    type: "spring",
                    stiffness: 420,
                    damping: 32,
                    duration: prefersReducedMotion
                      ? 0
                      : undefined,
                  }}
                />
              )}

              <Icon
                className="h-5 w-5"
                strokeWidth={active ? 2.4 : 2}
                aria-hidden="true"
              />

              <span className="truncate">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}