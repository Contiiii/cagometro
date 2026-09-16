import { WifiOff } from "lucide-react";

import { useOnlineStatus } from "../hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      className="
        flex
        items-center
        justify-center
        gap-2
        border-b
        border-amber-400/30
        bg-amber-500/15
        px-4
        py-2
        text-center
        text-[13px]
        font-semibold
        text-amber-600
        dark:text-amber-400
      "
    >
      <WifiOff className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>Sei offline — ti mostro l'ultimo stato salvato</span>
    </div>
  );
}