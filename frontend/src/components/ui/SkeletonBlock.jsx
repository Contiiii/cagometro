export default function SkeletonBlock({ className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-2xl bg-black/10 dark:bg-white/10 ${className}`}
    />
  );
}