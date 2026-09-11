export function getAchievementTheme(isDark) {
  return isDark
    ? {
        app: "bg-[#09090b] text-zinc-100",
        surface: "border-white/[0.08] bg-[#121216]",
        surfaceAlt: "border-white/[0.07] bg-white/[0.035]",
        text: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        sheet: "border-white/[0.09] bg-[#15161a]",
      }
    : {
        app: "bg-[#f6f1ec] text-zinc-900",
        surface: "border-zinc-900/[0.08] bg-[#fffdfa]",
        surfaceAlt: "border-zinc-900/[0.07] bg-zinc-900/[0.035]",
        text: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        sheet: "border-zinc-900/[0.09] bg-[#fffaf6]",
      };
}

export function getAchievementAccentStyles(isDark) {
  return {
    pink: {
      solid: "bg-pink-500 text-white",
      soft: "bg-pink-500/10 text-pink-500",
      text: "text-pink-500",
      line: "bg-pink-500",
      ring: "stroke-pink-500",
      border: "border-pink-500/20",
    },

    amber: {
      solid: "bg-amber-500 text-zinc-950",
      soft: "bg-amber-400/15 text-amber-500",
      text: "text-amber-500",
      line: "bg-amber-500",
      ring: "stroke-amber-500",
      border: "border-amber-500/20",
    },

    emerald: {
      solid: "bg-emerald-500 text-white",
      soft: "bg-emerald-500/10 text-emerald-500",
      text: "text-emerald-500",
      line: "bg-emerald-500",
      ring: "stroke-emerald-500",
      border: "border-emerald-500/20",
    },

    zinc: {
      solid: isDark
        ? "bg-zinc-700 text-zinc-200"
        : "bg-zinc-800 text-white",

      soft: isDark
        ? "bg-zinc-800 text-zinc-400"
        : "bg-zinc-900/10 text-zinc-500",

      text: isDark
        ? "text-zinc-400"
        : "text-zinc-500",

      line: "bg-zinc-500",
      ring: "stroke-zinc-500",

      border: isDark
        ? "border-white/[0.10]"
        : "border-zinc-900/[0.10]",
    },
  };
}