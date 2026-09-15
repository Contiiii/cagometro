export function getTheme(isDark) {
  return isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "bg-zinc-900/80 border-white/[0.08]",
        softSurface: "bg-white/[0.035] border-white/[0.07]",
        primaryText: "text-zinc-50",
        muted: "text-zinc-400",
        subtle: "text-zinc-500",
        secondary:
          "bg-white/[0.055] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09]",
        header: "bg-[#0c0c0f]/80 border-white/[0.07]",
        input:
          "border-white/[0.10] bg-white/[0.05] text-zinc-100 placeholder:text-zinc-500",
        modal: "bg-[#17171b] border-white/[0.09]",
        elevated: "bg-[#17171b] border-white/[0.09]",
        overlay: "bg-zinc-950/60",
        dangerSoft: "border-rose-500/20 bg-rose-500/10 text-rose-300",
        focusOffset: "focus-visible:ring-offset-[#0c0c0f]",
        counterRing: "border-white/[0.07]",
        buttonShadow:
          "shadow-[0_16px_45px_color-mix(in_oklab,var(--accent)_30%,transparent)]",
        buttonOuter: "border-accent/30",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "bg-white/85 border-zinc-200/80",
        softSurface: "bg-zinc-900/[0.035] border-zinc-900/[0.07]",
        primaryText: "text-zinc-950",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        secondary:
          "bg-zinc-900/[0.045] border-zinc-900/[0.08] text-zinc-700 hover:bg-zinc-900/[0.08]",
        header: "bg-[#f8f5f3]/80 border-zinc-900/[0.07]",
        input:
          "border-zinc-900/[0.12] bg-zinc-900/[0.04] text-zinc-900 placeholder:text-zinc-400",
        modal: "bg-[#fffaf6] border-zinc-900/[0.09]",
        elevated: "bg-[#fff8f4] border-zinc-900/[0.08]",
        overlay: "bg-zinc-950/55",
        dangerSoft: "border-rose-500/20 bg-rose-500/10 text-rose-600",
        focusOffset: "focus-visible:ring-offset-[#f8f5f3]",
        counterRing: "border-zinc-900/[0.07]",
        buttonShadow:
          "shadow-[0_16px_45px_color-mix(in_oklab,var(--accent)_28%,transparent)]",
        buttonOuter: "border-accent/20",
      };
}

export function getAccentStyles(isDark) {
  return {
    pink: {
      solid: "bg-pink-500 text-white",
      soft: isDark
        ? "bg-pink-500/10 text-pink-500"
        : "bg-pink-500/10 text-pink-600",
      text: isDark ? "text-pink-500" : "text-pink-600",
      line: "bg-pink-500",
      ring: "stroke-pink-500",
      border: isDark
        ? "border-pink-500/20"
        : "border-pink-500/25",
    },

    amber: {
      solid: "bg-amber-500 text-zinc-950",
      soft: isDark
        ? "bg-amber-400/15 text-amber-500"
        : "bg-amber-400/15 text-amber-700",
      text: isDark ? "text-amber-500" : "text-amber-700",
      line: "bg-amber-500",
      ring: "stroke-amber-500",
      border: isDark
        ? "border-amber-500/20"
        : "border-amber-600/25",
    },

    emerald: {
      solid: "bg-emerald-500 text-white",
      soft: isDark
        ? "bg-emerald-500/10 text-emerald-500"
        : "bg-emerald-500/10 text-emerald-700",
      text: isDark ? "text-emerald-500" : "text-emerald-700",
      line: "bg-emerald-500",
      ring: "stroke-emerald-500",
      border: isDark
        ? "border-emerald-500/20"
        : "border-emerald-600/25",
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