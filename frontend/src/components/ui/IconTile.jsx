const SIZE_CLASSES = {
  xs: "h-8 w-8",
  sm: "h-9 w-9",
  md: "h-10 w-10",
  lg: "h-11 w-11",
  xl: "h-12 w-12",
  "2xl": "h-14 w-14",
  "3xl": "h-16 w-16",
};

const RADIUS_DEFAULTS = {
  xs: "rounded-xl",
  sm: "rounded-xl",
  md: "rounded-2xl",
  lg: "rounded-2xl",
  xl: "rounded-[1.1rem]",
  "2xl": "rounded-[1.3rem]",
  "3xl": "rounded-[1.4rem]",
};

export default function IconTile({
  size = "md",
  rounded,
  className = "",
  children,
  ...rest
}) {
  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.md;
  const radiusClasses =
    rounded || RADIUS_DEFAULTS[size] || RADIUS_DEFAULTS.md;

  return (
    <span
      className={`grid ${sizeClasses} shrink-0 place-items-center ${radiusClasses} ${className}`}
      {...rest}
    >
      {children}
    </span>
  );
}