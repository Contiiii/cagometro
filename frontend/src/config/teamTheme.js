export function getTeamTheme(isDark) {
  return isDark
    ? {
        app: "bg-[#0c0c0f] text-zinc-100",
        surface: "bg-zinc-900/80 border-white/[0.08]",
        softSurface: "bg-white/[0.035] border-white/[0.07]",
        muted: "text-zinc-400",
        subtle: "text-zinc-400",
        primaryText: "text-zinc-50",
        header: "bg-[#0c0c0f]/80 border-white/[0.07]",
        nav: "bg-zinc-950/80 border-white/[0.09]",
        navInactive:
          "text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.05]",
        secondary:
          "bg-white/[0.055] border-white/[0.08] text-zinc-300 hover:bg-white/[0.09]",
        sheet: "bg-[#17171b] border-white/[0.09]",
        input:
          "border-white/[0.10] bg-white/[0.05] text-zinc-100 placeholder:text-zinc-500",
        focusOffset: "focus-visible:ring-offset-[#0c0c0f]",
      }
    : {
        app: "bg-[#f8f5f3] text-zinc-900",
        surface: "bg-white/85 border-zinc-200/80",
        softSurface: "bg-zinc-900/[0.035] border-zinc-900/[0.07]",
        muted: "text-zinc-600",
        subtle: "text-zinc-500",
        primaryText: "text-zinc-950",
        header: "bg-[#f8f5f3]/80 border-zinc-900/[0.07]",
        nav: "bg-white/85 border-zinc-900/[0.09]",
        navInactive:
          "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-900/[0.05]",
        secondary:
          "bg-zinc-900/[0.045] border-zinc-900/[0.08] text-zinc-700 hover:bg-zinc-900/[0.08]",
        sheet: "bg-[#fdfbf9] border-zinc-900/[0.09]",
        input:
          "border-zinc-900/[0.12] bg-zinc-900/[0.04] text-zinc-900 placeholder:text-zinc-400",
        focusOffset: "focus-visible:ring-offset-[#f8f5f3]",
      };
}