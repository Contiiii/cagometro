export default function StatCard({
  label,
  value,
  theme,
  tone = "soft",
  size = "sm",
  className = "",
}) {
  const valueClasses =
    size === "lg"
      ? "mt-2 text-2xl font-black tracking-tight"
      : "mt-1 text-sm font-black";

  return (
    <div
      className={`min-w-0 rounded-2xl border p-3 ${theme[tone] ?? theme.soft} ${className}`}
    >
      <p
        className={`text-[10px] font-bold uppercase tracking-[0.11em] ${theme.subtle}`}
      >
        {label}
      </p>
      <p className={`${valueClasses} truncate ${theme.text}`} title={String(value)}>
        {value}
      </p>
    </div>
  );
}