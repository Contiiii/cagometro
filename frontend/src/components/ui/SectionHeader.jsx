export default function SectionHeader({
  title,
  aside,
  theme,
  className = "",
}) {
  return (
    <div className={`flex items-end justify-between gap-4 ${className}`}>
      <h2
        className={`text-2xl font-black tracking-[-0.055em] ${theme.primaryText}`}
      >
        {title}
      </h2>

      {aside}
    </div>
  );
}