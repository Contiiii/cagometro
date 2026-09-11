const RADIUS = {
  default: "rounded-2xl",
  panel: "rounded-[1.5rem]",
  soft: "rounded-[1.4rem]",
};

const PADDING = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-5",
};

export default function Panel({
  theme,
  tone = "softSurface",
  radius = "default",
  padding = "md",
  className = "",
  children,
  ...rest
}) {
  return (
    <div
      className={`border ${RADIUS[radius] ?? RADIUS.default} ${
        theme[tone] ?? theme.softSurface
      } ${PADDING[padding] ?? ""} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}