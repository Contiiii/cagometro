import { useAuth } from "../hooks/useAuth";

export default function CloudBackupWarning() {
  const { user } = useAuth();

  if (user) return null;

  return (
    <div
      className="
        bg-amber-500/10
        border
        border-amber-500/20
        rounded-2xl
        p-4
        text-center
      "
    >
      <p className="font-semibold text-amber-400">
        ☁️ Salvataggi cloud non attivati
      </p>

      <p className="text-sm text-zinc-300 mt-1">
        Accedi con Google per salvare i progressi
        nel cloud e sincronizzarli tra dispositivi.
      </p>
    </div>
  );
}
``