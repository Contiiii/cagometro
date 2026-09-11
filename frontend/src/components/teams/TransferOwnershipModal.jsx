import { useId } from "react";
import { Crown } from "lucide-react";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";
import Panel from "../ui/Panel";

import { useTeamUI } from "../../hooks/useTeamUI";

import { getAvatarGradient, getInitials } from "../../utils/avatar";

export default function TransferOwnershipModal({
  members,
  onClose,
  onTransferOwnership,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const titleId = useId();

  const candidates = members.filter(
    (member) => member.role !== "owner" && !member.left_at && !member.removed_at,
  );

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={onClose}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Gestione squadra
            </p>

            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black tracking-tight ${theme.primaryText}`}
            >
              Trasferisci proprietà
            </h2>
          </div>

          <CloseButton onClick={onClose} theme={theme} isDark={isDark} />
        </div>

        {candidates.length === 0 ? (
          <div className="mt-7 rounded-[1.4rem] border p-4 text-center">
            <Crown className={`mx-auto h-6 w-6 ${theme.subtle}`} strokeWidth={1.8} />

            <p className={`mt-3 text-sm font-bold ${theme.primaryText}`}>
              Nessun membro disponibile
            </p>

            <p className={`mt-1 text-xs ${theme.muted}`}>
              Serve almeno un altro membro per trasferire la proprietà.
            </p>
          </div>
        ) : (
          <div className="mt-6 max-h-[60vh] space-y-3 overflow-y-auto overscroll-contain pr-1">
            {candidates.map((member) => (
              <Panel theme={theme} key={member.user_id}>
                <div className="flex items-center gap-3">
                  <div
                    className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${getAvatarGradient(
                      member.user_id,
                    )} text-xs font-black text-white`}
                  >
                    {getInitials(member.display_name || "Utente")}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className={`truncate font-extrabold ${theme.primaryText}`}>
                      {member.display_name || "Utente"}
                    </p>

                    <p className={`text-xs ${theme.muted}`}>Membro</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onTransferOwnership(member)}
                  aria-label={`Rendi proprietario ${member.display_name || "membro"}`}
                  className="mt-4 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-400/10 text-xs font-bold text-amber-700 transition dark:text-amber-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  <Crown className="h-4 w-4" strokeWidth={2.2} />
                  Rendi proprietario
                </button>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </ModalShell>
  );
}