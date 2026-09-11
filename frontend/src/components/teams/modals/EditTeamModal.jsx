import { useId, useState } from "react";
import toast from "react-hot-toast";

import ModalShell from "./ModalShell";
import CloseButton from "./CloseButton";
import Panel from "../../ui/Panel";

import { useTeamUI } from "../../../hooks/useTeamUI";

const TEAM_EMOJIS = [
  "🏆",
  "💩",
  "🔥",
  "🚀",
  "⚡",
  "👑",
  "🎯",
  "🌋",
  "🍕",
  "🦍",
];

export default function EditTeamModal({
  onClose,
  team,
  onSave,
  restoreFocusRef,
}) {
  const { theme, isDark, prefersReducedMotion } = useTeamUI();

  const [name, setName] = useState(team?.team_name || "");
  const [description, setDescription] = useState(team?.description || "");
  const [emoji, setEmoji] = useState(team?.avatar_emoji || "🏆");
  const [saving, setSaving] = useState(false);

  const titleId = useId();

  const originalName = (team?.team_name || "").trim();
  const originalDescription = (team?.description || "").trim();
  const originalEmoji = team?.avatar_emoji || "🏆";

  const hasChanges =
    name.trim() !== originalName ||
    description.trim() !== originalDescription ||
    emoji !== originalEmoji;

  function handleClose() {
    if (!saving) {
      onClose();
    }
  }

  async function handleSave() {
    const normalizedName = name.trim();
    const normalizedDescription = description.trim();

    if (!normalizedName) {
      toast.error("Inserisci un nome squadra");
      return;
    }

    try {
      setSaving(true);

      await onSave({
        name: normalizedName,
        description: normalizedDescription,
        avatarEmoji: emoji,
      });

      toast.success("Squadra aggiornata");
      onClose();
    } catch (error) {
      // L'errore della mutazione è già stato loggato dall'hook.
      toast.error(
        error?.message || "Impossibile aggiornare la squadra",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <ModalShell
      theme={theme}
      prefersReducedMotion={prefersReducedMotion}
      onClose={handleClose}
      restoreFocusRef={restoreFocusRef}
      labelledBy={titleId}
    >
      <div className="p-6 sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={`text-sm font-semibold ${theme.muted}`}>
              Personalizzazione
            </p>

            <h2
              id={titleId}
              className={`mt-1 text-2xl font-black ${theme.primaryText}`}
            >
              Identità squadra
            </h2>
          </div>

          <CloseButton
            onClick={handleClose}
            theme={theme}
            isDark={isDark}
          />
        </div>

        <Panel theme={theme} radius="panel" padding="lg" className="mt-6">
          <div className="flex items-center gap-4">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-pink-500 text-3xl">
              {emoji}
            </div>

            <div className="min-w-0">
              <h3
                className={`break-words font-black ${theme.primaryText}`}
              >
                {name.trim() || "Nome squadra"}
              </h3>

              <p
                className={`mt-1 break-words text-sm leading-relaxed ${theme.muted}`}
              >
                {description.trim() || "Anteprima descrizione"}
              </p>
            </div>
          </div>
        </Panel>

        <div className="mt-5">
          <label
            htmlFor="edit-team-name"
            className={`block text-sm font-bold ${theme.primaryText}`}
          >
            Nome squadra
          </label>

          <input
            id="edit-team-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={40}
            disabled={saving}
            className={`mt-2 w-full rounded-2xl border px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${theme.input}`}
          />

          <div className="mt-2 flex justify-end">
            <span className={`text-xs ${theme.subtle}`}>
              {name.length}/40
            </span>
          </div>
        </div>

        <div className="mt-5">
          <label
            htmlFor="edit-team-description"
            className={`block text-sm font-bold ${theme.primaryText}`}
          >
            Descrizione
          </label>

          <textarea
            id="edit-team-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            maxLength={160}
            disabled={saving}
            className={`mt-2 w-full resize-none rounded-2xl border px-4 py-3 outline-none transition focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 disabled:cursor-not-allowed disabled:opacity-60 ${theme.input}`}
          />

          <div className="mt-2 flex justify-end">
            <span className={`text-xs ${theme.subtle}`}>
              {description.length}/160
            </span>
          </div>
        </div>

        <div className="mt-5">
          <p className={`text-sm font-bold ${theme.primaryText}`}>
            Avatar squadra
          </p>

          <div className="mt-3 grid grid-cols-5 gap-2">
            {TEAM_EMOJIS.map((item) => {
              const selected = emoji === item;

              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setEmoji(item)}
                  disabled={saving}
                  aria-label={`Seleziona avatar ${item}`}
                  aria-pressed={selected}
                  className={`h-12 rounded-2xl border text-2xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 disabled:cursor-not-allowed disabled:opacity-50 ${
                    selected
                      ? "border-pink-500 bg-pink-500/10 ring-2 ring-pink-500/20"
                      : theme.softSurface
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className={`flex-1 rounded-2xl border py-3 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50 ${theme.secondary}`}
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !hasChanges || !name.trim()}
            className="flex-1 rounded-2xl bg-pink-500 py-3 text-sm font-bold text-white transition hover:bg-pink-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Salvataggio..." : "Salva modifiche"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}