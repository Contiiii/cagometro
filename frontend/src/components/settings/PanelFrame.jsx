export default function PanelFrame({ eyebrow, title, description, theme, children }) {
  return (
    <>
      <p
        className={`text-xs font-bold uppercase tracking-[0.14em] ${theme.subtle}`}
      >
        {eyebrow}
      </p>

      <h2
        className={`mt-2 text-[clamp(1.75rem,4vw,2.35rem)] font-black tracking-[-0.06em] ${theme.primaryText}`}
      >
        {title}
      </h2>

      <p className={`mt-2 max-w-[60ch] text-sm leading-relaxed ${theme.muted}`}>
        {description}
      </p>

      <div className="mt-7">{children}</div>
    </>
  );
}
