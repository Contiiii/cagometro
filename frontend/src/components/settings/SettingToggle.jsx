export default function SettingToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="font-medium text-zinc-950 dark:text-white">
          {label}
        </p>

        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`
          relative
          h-7
          w-12
          shrink-0
          rounded-full
          transition-colors
          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-pink-500
          focus-visible:ring-offset-2
          disabled:cursor-not-allowed
          disabled:opacity-50
          ${
            checked
              ? "bg-pink-600"
              : "bg-zinc-300 dark:bg-zinc-700"
          }
        `}
      >
        <span
          className={`
            absolute
            top-1
            h-5
            w-5
            rounded-full
            bg-white
            shadow-sm
            transition-transform
            ${
              checked
                ? "translate-x-6"
                : "translate-x-1"
            }
          `}
        />
      </button>
    </div>
  );
}