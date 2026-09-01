import { useAuth } from "../hooks/useAuth";
import { useEntries } from "../hooks/useEntries";

export default function SyncStatus() {
  const { user } = useAuth();
  const { syncStatus } = useEntries();

  if (!user) return null;

  if (syncStatus === "error") {
    return (
      <p className="text-[10px] font-medium text-red-400">
        ● Errore sync
      </p>
    );
  }

  return (
    <p className="text-[10px] font-medium text-emerald-400">
      ● Cloud attivo
    </p>
  );
}