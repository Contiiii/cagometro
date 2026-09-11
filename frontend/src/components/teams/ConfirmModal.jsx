import { useId, useState } from "react";
import { AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

import ModalShell from "./ModalShell";

import { useTeamUI } from "../../hooks/useTeamUI";

export default function ConfirmModal({
  open,
  onClose,
  title,
  description,
  confirmText = "Conferma",
  onConfirm,
  isDanger = false,
}) {
  const { theme, prefersReducedMotion } = useTeamUI();

  const [loading, setLoading] = useState(false);

  const titleId = useId();
  const descriptionId = useId();

  function handleClose() {
    if (!loading) {
      onClose();
    }
  }

  async function handleConfirm() {
    if (!onConfirm || loading) return;

    try {
      setLoading(true);

      await onConfirm();

      onClose();
    } catch (error) {
      toast.error(
        error?.message || "Impossibile completare l’operazione",
      );
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={handleClose}
      labelledBy={titleId}
      describedBy={descriptionId}
    >
      <div className="p-6">
        <div
          className={`mb-5 grid h-12 w-12 place-items-center rounded-2xl ${
            isDanger
              ? "bg-rose-500/10 text-rose-500"
              : "bg-amber-500/10 text-amber-500"
          }`}
        >
          <AlertTriangle
            className="h-6 w-6"
            strokeWidth={2.4}
          />
        </div>

        <h2
          id={titleId}
          className={`text-xl font-black ${theme.primaryText}`}
        >
          {title}
        </h2>

        <p
          id={descriptionId}
          className={`mt-3 text-sm leading-relaxed ${theme.muted}`}
        >
          {description}
        </p>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={handleClose}
            className={`flex-1 rounded-2xl border py-3 text-sm font-bold ${
              theme.secondary
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            Annulla
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={`flex-1 rounded-2xl py-3 text-sm font-bold text-white ${
              isDanger ? "bg-rose-500" : "bg-pink-500"
            } disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {loading ? "Attendere..." : confirmText}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}