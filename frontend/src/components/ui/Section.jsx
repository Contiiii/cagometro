const SPACING = {
  none: "",
  sm: "mt-5",
  md: "mt-7",
  lg: "mt-8",
};

export default function Section({
  as: Tag = "section",
  spacing = "sm",
  className = "",
  children,
  ...rest
}) {
  return (
    <Tag
      className={`mx-auto max-w-3xl ${SPACING[spacing] ?? ""} ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}