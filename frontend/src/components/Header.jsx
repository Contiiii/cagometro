import { Moon, Settings, Sun } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";

import poopIcon from "../assets/poop.png";

import { useTheme } from "../hooks/useTheme";
import { useProfile } from "../hooks/useProfile";
import { useAuth } from "../hooks/useAuth";

export default function Header({
  eyebrow = "Cagometro",
  title = "Il tuo archivio",
  showSettings = true,
}) {
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();

  const { resolvedTheme, setTheme } = useTheme();

  const { profile } = useProfile();

  const { user, login } = useAuth();

  const isDark = resolvedTheme === "dark";

  function toggleTheme() {
    setTheme(isDark ? "light" : "dark");
  }

  function handleAccountClick() {
    navigate("/settings");
  }

  const displayName = profile?.display_name || "Utente";

  return (
    <header
      className={`
    sticky
    top-0
    z-30
    border-b
    backdrop-blur-xl
    transition-colors
    duration-300
    ${
      isDark
        ? "border-white/[0.07] bg-[#0c0c0f]/80"
        : "border-zinc-900/[0.07] bg-[#f8f5f3]/80"
    }
  `}
      style={{
        paddingTop: "env(safe-area-inset-top)",
      }}
    >
      <div
        className="
          mx-auto
          flex
          h-[72px]
          w-full
          max-w-5xl
          items-center
          justify-between
          gap-4
          px-5
          sm:px-8
        "
      >
        <button
          type="button"
          onClick={() => navigate("/")}
          className="
            flex
            min-w-0
            items-center
            gap-3
            rounded-2xl
            text-left
            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-pink-500
          "
          aria-label="Vai alla Home"
        >
          <div
            className="
    grid
    h-10
    w-10
    shrink-0
    place-items-center
    rounded-2xl
    bg-pink-500
    shadow-[0_8px_20px_rgba(236,72,153,0.28)]
    overflow-hidden
  "
            aria-hidden="true"
          >
            <img
              src={poopIcon}
              alt=""
              className="h-6 w-6 object-contain select-none"
              draggable={false}
            />
          </div>

          <div className="min-w-0">
            <p
              className={`
    text-[11px]
    font-semibold
    uppercase
    tracking-[0.16em]
    ${isDark ? "text-zinc-500" : "text-zinc-600"}
  `}
            >
              {eyebrow}
            </p>

            <p
              className={`
    truncate
    text-[17px]
    font-bold
    tracking-tight
    ${isDark ? "text-zinc-50" : "text-zinc-950"}
  `}
            >
              {title}
            </p>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? "Attiva tema chiaro" : "Attiva tema scuro"}
            aria-pressed={isDark}
            className={`
  relative
  flex
  h-11
  w-[78px]
  items-center
  rounded-full
  border
  p-1
  transition-colors
  duration-300
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-pink-500
  ${
    isDark
      ? "border-white/[0.10] bg-white/[0.07]"
      : "border-zinc-900/[0.10] bg-zinc-900/[0.05]"
  }
`}
          >
            <Sun
              className="
    absolute
    left-2.5
    h-4
    w-4
    text-amber-500
  "
              aria-hidden="true"
            />

            <Moon
              className={`
    absolute
    right-2.5
    h-4
    w-4
    ${isDark ? "text-pink-300" : "text-zinc-400"}
  `}
              aria-hidden="true"
            />

            <motion.span
              initial={false}
              animate={{
                x: isDark ? 34 : 0,
              }}
              transition={{
                type: "spring",
                stiffness: 520,
                damping: 32,
                duration: prefersReducedMotion ? 0 : undefined,
              }}
              className={`
    relative
    z-10
    grid
    h-9
    w-9
    shrink-0
    place-items-center
    rounded-full
    shadow-sm
    ${isDark ? "bg-zinc-100 text-zinc-950" : "bg-white text-zinc-800"}
  `}
            >
              {isDark ? (
                <Moon className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Sun className="h-4 w-4" aria-hidden="true" />
              )}
            </motion.span>
          </button>

          {showSettings && !user && (
            <button
              type="button"
              onClick={login}
              className={`h-11 rounded-2xl border px-4 text-sm font-bold transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 ${
                isDark
                  ? "border-pink-500/20 bg-pink-500/10 text-pink-300"
                  : "border-pink-500/20 bg-pink-500/10 text-pink-600"
              }`}
            >
              Accedi
            </button>
          )}

          {showSettings && user && (
            <button
              type="button"
              onClick={handleAccountClick}
              aria-label={`Apri le impostazioni di ${displayName}`}
              className={`
  grid
  h-11
  w-11
  shrink-0
  place-items-center
  overflow-hidden
  rounded-2xl
  border
  transition
  active:scale-95
  focus-visible:outline-none
  focus-visible:ring-2
  focus-visible:ring-pink-500
  ${
    isDark
      ? "border-white/[0.10] bg-white/[0.07]"
      : "border-zinc-900/[0.10] bg-zinc-900/[0.05]"
  }
`}
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span
                  className={`
    text-sm
    font-black
    ${isDark ? "text-zinc-200" : "text-zinc-700"}
  `}
                >
                  {displayName.charAt(0).toUpperCase()}
                </span>
              )}
            </button>
          )}

          {!showSettings && (
            <div
              className={`
      grid
      h-11
      w-11
      place-items-center
      rounded-2xl
      border
      transition-colors
      duration-300
      ${
        isDark
          ? "border-white/[0.10] bg-white/[0.07] text-zinc-200"
          : "border-zinc-900/[0.10] bg-zinc-900/[0.05] text-zinc-700"
      }
    `}
              aria-hidden="true"
            >
              <Settings className="h-5 w-5" />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
