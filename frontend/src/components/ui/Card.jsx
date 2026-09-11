const RADIUS = {
  hero: "rounded-[2rem]",
  panel: "rounded-[1.75rem]",
  chart: "rounded-[1.85rem]",
  goal: "rounded-[1.7rem]",
};

const PADDING = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-7",
  lg: "p-6 sm:p-10",
};

export default function Card({
  theme,
  tone = "surface",
  radius = "hero",
  padding = "md",
  as: Tag = "div",
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={`relative overflow-hidden border ${RADIUS[radius] ?? RADIUS.hero} ${theme[tone]} ${PADDING[padding] ?? ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}