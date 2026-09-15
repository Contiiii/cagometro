export default function InfoRow({ label, value, theme, action }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-4">
      <span className={`text-sm font-bold ${theme.primaryText}`}>{label}</span>

      {action ? (
        <span className="flex items-center gap-2.5">
          {value !== null && value !== undefined && (
            <span className={`text-sm font-extrabold ${theme.muted}`}>
              {value}
            </span>
          )}

          {action}
        </span>
      ) : (
        <span className={`text-sm font-extrabold ${theme.muted}`}>{value}</span>
      )}
    </div>
  );
}
