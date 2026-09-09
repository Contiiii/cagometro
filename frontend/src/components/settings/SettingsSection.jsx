export default function SettingsSection({
  title,
  description,
  children,
}) {
  return (
    <section
      className="
        rounded-3xl
        border
        border-zinc-200
        bg-white
        p-5
        dark:border-zinc-800
        dark:bg-zinc-900
      "
    >
      <div className="mb-3">
        <h2 className="text-lg font-bold text-zinc-950 dark:text-white">
          {title}
        </h2>

        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {children}
      </div>
    </section>
  );
}