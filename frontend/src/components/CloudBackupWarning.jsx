import { CloudOff, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export default function CloudBackupWarning() {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const navigate = useNavigate();

  const isDark = resolvedTheme === "dark";

  if (user) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => navigate("/settings")}
      aria-label="Apri le impostazioni per attivare il backup cloud"
      className={`
        mt-4
        flex
        w-full
        items-center
        gap-3
        rounded-2xl
        border
        px-4
        py-3
        text-left
        transition
        active:scale-[0.98]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-pink-500
        ${
          isDark
            ? `
              border-white/[0.07]
              bg-white/[0.035]
              hover:bg-white/[0.055]
            `
            : `
              border-zinc-900/[0.07]
              bg-zinc-900/[0.035]
              hover:bg-zinc-900/[0.055]
            `
        }
      `}
    >
      <span
        className="
          grid
          h-10
          w-10
          shrink-0
          place-items-center
          rounded-xl
          bg-pink-500/10
          text-pink-500
        "
      >
        <CloudOff
          className="h-5 w-5"
          strokeWidth={2.2}
          aria-hidden="true"
        />
      </span>

      <span className="min-w-0 flex-1">
        <span
          className={`
            block
            text-sm
            font-bold
            ${isDark ? "text-zinc-100" : "text-zinc-900"}
          `}
        >
          Attiva il backup cloud
        </span>

        <span
          className={`
            mt-0.5
            block
            text-xs
            font-medium
            leading-relaxed
            ${isDark ? "text-zinc-400" : "text-zinc-500"}
          `}
        >
          Accedi con Google per proteggere e sincronizzare i tuoi progressi.
        </span>
      </span>

      <ChevronRight
        className={`
          h-4
          w-4
          shrink-0
          ${isDark ? "text-zinc-500" : "text-zinc-400"}
        `}
        strokeWidth={2.2}
        aria-hidden="true"
      />
    </button>
  );
}