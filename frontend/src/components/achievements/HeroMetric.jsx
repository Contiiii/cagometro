export default function HeroMetric({
  label,
  value,
  theme,
  bordered = false,
  isDark = false,
}) {
  return (
    <div
      className={`px-4 py-3 ${
        bordered
          ? isDark
            ? "border-x border-white/[0.08]"
            : "border-x border-zinc-900/[0.08]"
          : ""
      }`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.12em] ${theme.subtle}`}
      >
        {label}
      </p>

      <p className={`mt-1 text-xl font-black tracking-tight ${theme.text}`}>
        {value}
      </p>
    </div>
  );
}