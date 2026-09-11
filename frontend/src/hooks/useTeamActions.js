import { useState } from "react";

import {
  createTeam,
  joinTeam,
  leaveTeam,
  createTeamActivity,
  transferOwnership,
  removeTeamMember,
  regenerateInviteCode,
  toggleTeamInvites,
  updateTeam,
} from "../services/teamService";

import { useAuth } from "./useAuth";
import { reportError } from "../utils/reportError";

export function useTeamActions({
  team = null,
  isLastMember = false,
  selectedMember = null,
  setSelectedMember = () => {},
  notify,
  refreshDashboard,
  refreshTeam,
  refreshMembers,
  refreshLeaderboard,
  refreshActivity,
}) {
  const { user } = useAuth();

  const userId = user?.id ?? null;

  const [inviteOpen, setInviteOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [invitesToggling, setInvitesToggling] = useState(false);
  const [invitesEnabled, setInvitesEnabled] = useState(
    () => team?.invites_enabled !== false,
  );
  const [previousServerInvitesEnabled, setPreviousServerInvitesEnabled] =
    useState(team?.invites_enabled);

  if (team?.invites_enabled !== previousServerInvitesEnabled) {
    setPreviousServerInvitesEnabled(team?.invites_enabled);

    if (typeof team?.invites_enabled === "boolean") {
      setInvitesEnabled(team.invites_enabled);
    }
  }

  const [leaving, setLeaving] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState(null);
  const [editOpen, setEditOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  function openConfirm(config) {
    setConfirmConfig(config);
  }

  function closeConfirm() {
    setConfirmConfig(null);
  }

  async function handleCreateTeam(payload) {
    const name = payload.name?.trim();

    if (!name) {
      notify("Inserisci un nome squadra", "error");
      throw new Error("Nome squadra mancante");
    }

    try {
      await createTeam({
        name,
        description: payload.description?.trim() || null,
        avatarEmoji: "🏆",
      });

      // Nota: privacy/accent non vengono inviati perché la RPC create_team
      // non li supporta (campi visivi, gestione separata).
      const refreshResults = await Promise.allSettled([
        refreshTeam(),
        refreshMembers(),
      ]);

      const hasRefreshFailure = refreshResults.some(
        (result) => result.status === "rejected",
      );

      if (hasRefreshFailure) {
reportError(
            refreshResults
              .filter((result) => result.status === "rejected")
              .map((result) => result.reason),
            {
              feature: "team-create-refresh",
              userId,
              message: "Squadra creata, ma aggiornamento dati fallito:",
            },
          );
      }

      if (!localStorage.getItem("cagometro.teamOnboardingSeen")) {
        localStorage.setItem("cagometro.teamOnboardingSeen", "1");
        setOnboardingOpen(true);
      }

      notify(
        hasRefreshFailure
          ? "Squadra creata, ma alcuni dati non sono stati aggiornati"
          : "Squadra creata",
        hasRefreshFailure ? "error" : "success",
      );
    } catch (error) {
      reportError(error, {
            feature: "team-create",
            userId,
            message: "Errore durante la creazione della squadra:",
          });
      notify(
        error?.message || "Non è stato possibile creare la squadra",
        "error",
      );
      throw error;
    }
  }

  async function handleJoinTeam(code, teamName = null) {
    await joinTeam(code);

    notify(teamName ? `Sei entrato in ${teamName}.` : "Sei entrato nella squadra");

    try {
      await createTeamActivity("member_joined");
    } catch (error) {
reportError(error, {
              feature: "team-join-activity",
              userId,
              message: "Ingresso riuscito, ma registrazione attività fallita:",
            });
    }

    try {
      const result = await refreshDashboard();

      if (result?.hasErrors) {
        notify(
          "Ingresso riuscito, ma alcuni dati non sono stati aggiornati",
          "error",
        );
      }
    } catch (error) {
reportError(error, {
              feature: "team-join-dashboard",
              userId,
              message: "Ingresso riuscito, ma aggiornamento dashboard fallito:",
            });

      notify(
        "Sei entrato nella squadra. Ricarica la pagina per aggiornare i dati.",
        "error",
      );
    }
  }

  function handleLeaveTeam() {
    openConfirm({
      type: "leave-team",
      title: isLastMember ? "Sciogli squadra" : "Lascia squadra",
      description: isLastMember
        ? "Sei l'unico membro della squadra. Abbandonandola la squadra verrà eliminata definitivamente."
        : "Vuoi davvero lasciare la squadra?",
      confirmText: isLastMember ? "Sciogli squadra" : "Lascia",
      variant: "danger",
      onConfirm: async () => {
        try {
          setLeaving(true);

          // Il log member_left non è atomico con leave_team(): viene eseguito
          // prima dell'uscita perché create_team_activity richiede una
          // membership attiva. Se leaveTeam() fallisce dopo questo log può
          // restare un evento member_left non corrispondente. Soluzione
          // definitiva: spostare il log dentro la RPC leave_team() nella
          // stessa transazione (nessuna modifica DB in questa task).
          try {
            await createTeamActivity("member_left");
          } catch (error) {
reportError(error, {
            feature: "team-leave-activity",
            userId,
            message: "Registrazione attività member_left fallita:",
          });
          }

          await leaveTeam();

          setSelectedMember(null);
          setInviteOpen(false);
          setSettingsOpen(false);
          setMembersOpen(false);
          setTransferOpen(false);
          setOnboardingOpen(false);

          try {
            const result = await refreshDashboard();

            if (result?.hasErrors) {
              notify(
                isLastMember
                  ? "Squadra sciolta, ma alcuni dati non sono stati aggiornati"
                  : "Sei uscito, ma alcuni dati non sono stati aggiornati",
                "error",
              );
              return;
            }
          } catch (error) {
            reportError(error, {
              feature: "team-leave-refresh",
              userId,
              message: "Uscita riuscita, ma aggiornamento dati fallito:",
            });

            notify(
              isLastMember
                ? "Squadra sciolta. Ricarica la pagina per aggiornare i dati."
                : "Sei uscito. Ricarica la pagina per aggiornare i dati.",
              "error",
            );
            return;
          }

          notify(
            isLastMember
              ? "Squadra sciolta con successo"
              : "Hai lasciato la squadra",
          );
        } catch (error) {
          reportError(error, {
            feature: "team-leave",
            userId,
            message: "Errore durante l'uscita dalla squadra:",
          });
          throw error;
        } finally {
          setLeaving(false);
        }
      },
    });
  }

  async function handleTransferOwnership(member) {
    openConfirm({
      type: "transfer-ownership",
      title: "Trasferisci proprietà",
      description: `${member.display_name} diventerà il nuovo proprietario della squadra.`,
      confirmText: "Trasferisci",
      variant: "warning",
      onConfirm: async () => {
        try {
          await transferOwnership(member.user_id);

          try {
            await createTeamActivity("ownership_transferred", null, {
              target_user_id: member.user_id,
              target_display_name: member.display_name,
            });
          } catch (error) {
            reportError(error, {
              feature: "team-transfer-activity",
              userId,
              message:
                "Proprietà trasferita, ma registrazione attività fallita:",
            });
          }

          const refreshResults = await Promise.allSettled([
            refreshTeam(),
            refreshMembers(),
            refreshActivity(),
          ]);

          const hasRefreshFailure = refreshResults.some(
            (result) => result.status === "rejected",
          );

          if (hasRefreshFailure) {
            reportError(
              refreshResults
                .filter((result) => result.status === "rejected")
                .map((result) => result.reason),
              {
                feature: "team-transfer-refresh",
                userId,
                message: "Proprietà trasferita, ma aggiornamento dati fallito:",
              },
            );
          }

          notify(
            hasRefreshFailure
              ? `${member.display_name} è ora il proprietario, ma alcuni dati non sono stati aggiornati`
              : `${member.display_name} è ora il proprietario`,
            hasRefreshFailure ? "error" : "success",
          );

          setMembersOpen(false);
          setSettingsOpen(false);
          setSelectedMember(null);
          setTransferOpen(false);
        } catch (error) {
          reportError(error, {
            feature: "team-transfer",
            userId,
            message: "Trasferimento proprietà fallito:",
          });
          throw error;
        }
      },
    });
  }

  async function handleRemoveMember(member) {
    openConfirm({
      type: "remove-member",
      title: "Rimuovi membro",
      description: `Vuoi rimuovere ${member.display_name} dalla squadra?`,
      confirmText: "Rimuovi",
      variant: "danger",
      onConfirm: async () => {
        try {
          await removeTeamMember(member.user_id);

          try {
            await createTeamActivity("member_removed", null, {
              target_user_id: member.user_id,
              target_display_name: member.display_name,
            });
          } catch (error) {
            reportError(error, {
              feature: "team-member-remove-activity",
              userId,
              message: "Membro rimosso, ma registrazione attività fallita:",
            });
          }

          const refreshResults = await Promise.allSettled([
            refreshMembers(),
            refreshLeaderboard(),
            refreshActivity(),
          ]);

          const hasRefreshFailure = refreshResults.some(
            (result) => result.status === "rejected",
          );

          if (hasRefreshFailure) {
            reportError(
              refreshResults
                .filter((result) => result.status === "rejected")
                .map((result) => result.reason),
              {
                feature: "team-member-remove-refresh",
                userId,
                message: "Membro rimosso, ma aggiornamento dati fallito:",
              },
            );
          }

          notify(
            hasRefreshFailure
              ? `${member.display_name} è stato rimosso, ma alcuni dati non sono stati aggiornati`
              : `${member.display_name} è stato rimosso`,
            hasRefreshFailure ? "error" : "success",
          );

          if (selectedMember === member.user_id) {
            setSelectedMember(null);
          }
        } catch (error) {
          reportError(error, {
            feature: "team-member-remove",
            userId,
            message: "Rimozione membro fallita:",
          });
          throw error;
        }
      },
    });
  }

  function handleRegenerateInvite() {
    setSettingsOpen(false);

    openConfirm({
      type: "regenerate-invite",
      title: "Rigenera codice invito",
      description:
        "Il codice attuale e tutti i link già condivisi smetteranno di funzionare.",
      confirmText: "Rigenera",
      variant: "warning",
      onConfirm: async () => {
        try {
          await regenerateInviteCode();
        } catch (error) {
reportError(error, {
              feature: "team-invite-regenerate",
              userId,
              message:
                "Errore durante la rigenerazione del codice invito:",
            });
          throw error;
        }

        try {
          await refreshTeam();

          notify("Nuovo codice invito generato");
        } catch (error) {
reportError(error, {
              feature: "team-invite-regenerate-refresh",
              userId,
              message: "Codice rigenerato, ma aggiornamento dati fallito:",
            });

          notify(
            "Codice rigenerato. Ricarica la pagina per aggiornare i dati.",
            "error",
          );
        }
      },
    });
  }

  async function handleUpdateTeam(payload) {
    try {
      await updateTeam({
        name: payload.name?.trim(),
        description: payload.description?.trim() || null,
        avatarEmoji: payload.avatarEmoji,
      });
    } catch (error) {
      reportError(error, {
        feature: "team-update",
        userId,
        message: "Errore durante l'aggiornamento della squadra:",
      });
      throw error;
    }

    try {
      await refreshTeam();
    } catch (error) {
      reportError(error, {
        feature: "team-update-refresh",
        userId,
        message: "Squadra aggiornata, ma dati non aggiornati:",
      });

      notify(
        "Squadra aggiornata, ma alcuni dati non sono stati aggiornati",
        "error",
      );
    }
  }

  async function handleToggleInvites(nextEnabled) {
    if (invitesToggling) return;

    const previousEnabled = invitesEnabled;

    setInvitesEnabled(nextEnabled);
    setInvitesToggling(true);

    try {
      try {
        await toggleTeamInvites(nextEnabled);
      } catch (error) {
        reportError(error, {
          feature: "team-invites-toggle",
          userId,
          message: "Errore aggiornamento stato inviti:",
        });

        setInvitesEnabled(previousEnabled);

        notify(
          "Non è stato possibile aggiornare lo stato degli inviti",
          "error",
        );

        return;
      }

      try {
        await refreshTeam();

        notify(
          nextEnabled
            ? "Inviti riabilitati: il codice è di nuovo attivo"
            : "Inviti disabilitati",
        );
      } catch (error) {
        reportError(error, {
          feature: "team-invites-toggle-refresh",
          userId,
          message: "Stato inviti aggiornato, ma dati non aggiornati:",
        });

        notify(
          nextEnabled
            ? "Inviti riabilitati, ma alcuni dati non sono stati aggiornati"
            : "Inviti disabilitati, ma alcuni dati non sono stati aggiornati",
          "error",
        );
      }
    } finally {
      setInvitesToggling(false);
    }
  }

  return {
    handleCreateTeam,
    handleJoinTeam,
    handleLeaveTeam,
    handleTransferOwnership,
    handleRemoveMember,
    handleRegenerateInvite,
    handleUpdateTeam,
    handleToggleInvites,
    inviteOpen,
    setInviteOpen,
    settingsOpen,
    setSettingsOpen,
    membersOpen,
    setMembersOpen,
    transferOpen,
    setTransferOpen,
    editOpen,
    setEditOpen,
    onboardingOpen,
    setOnboardingOpen,
    leaving,
    invitesToggling,
    invitesEnabled,
    confirm: {
      config: confirmConfig,
      open: openConfirm,
      close: closeConfirm,
    },
  };
}