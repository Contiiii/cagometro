import { useState } from "react";

import { useNavigate } from "react-router-dom";

import {
  createTeam,
  joinTeam,
  leaveTeam,
  transferOwnership,
  removeTeamMember,
  regenerateInviteCode,
  toggleTeamInvites,
  updateTeam,
} from "../services/teamService";

import { useAuth } from "./useAuth";
import { usePush } from "./usePush";
import { useSettings } from "./useSettings";
import { sendMyPushNotification } from "../services/pushService";
import { reportError } from "../utils/reportError";
import { getFriendlyErrorMessage } from "../utils/friendlyError";
import { MAX_TEAMS_PER_USER } from "../config/team";

export function useTeamActions({
  team = null,
  isLastMember = false,
  atTeamLimit = false,
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
  const { isSubscribed: pushSubscribed } = usePush();
  const { teamMemberAlerts } = useSettings();
  const navigate = useNavigate();

  const userId = user?.id ?? null;

  const currentTeamId = team?.team_id ?? null;

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

    if (atTeamLimit) {
      notify(`Hai raggiunto il limite massimo di ${MAX_TEAMS_PER_USER} squadre`, "error");
      throw new Error(`Hai raggiunto il limite massimo di ${MAX_TEAMS_PER_USER} squadre`);
    }

    let teamId;

    try {
      teamId = await createTeam({
        name,
        description: payload.description?.trim() || null,
        avatarEmoji: "🏆",
        maxMembers: payload.maxMembers,
      });
    } catch (error) {
      reportError(error, {
        feature: "team-create",
        userId,
        message: "Errore durante la creazione della squadra:",
      });
      notify(
        getFriendlyErrorMessage(
          error,
          "Non è stato possibile creare la squadra",
        ),
        "error",
      );
      throw error;
    }

    if (!localStorage.getItem("cagometro.teamOnboardingSeen")) {
      localStorage.setItem("cagometro.teamOnboardingSeen", "1");
      setOnboardingOpen(true);
    }

    try {
      await refreshDashboard();

      notify("Squadra creata");
    } catch (error) {
      reportError(error, {
        feature: "team-create-refresh",
        userId,
        message: "Squadra creata, ma aggiornamento dashboard fallito:",
      });

      notify("Squadra creata, ma alcuni dati non sono stati aggiornati", "error");
    }

    navigate(`/teams/${teamId}`);
  }

  async function handleJoinTeam(code, teamName = null) {
    if (atTeamLimit) {
      notify(`Hai raggiunto il limite massimo di ${MAX_TEAMS_PER_USER} squadre`, "error");
      throw new Error(`Hai raggiunto il limite massimo di ${MAX_TEAMS_PER_USER} squadre`);
    }

    const teamId = await joinTeam(code);

    if (pushSubscribed && teamMemberAlerts) {
      sendMyPushNotification({
        type: "team",
        title: "Benvenuto nella squadra!",
        body: teamName
          ? `Sei entrato in ${teamName}.`
          : "Sei entrato nella squadra.",
        url: `/teams/${teamId}`,
      }).catch((error) => {
        reportError(error, {
          feature: "team-join-welcome-push",
          userId,
          message: "Errore invio notifica di benvenuto:",
        });
      });
    }

    notify(teamName ? `Sei entrato in ${teamName}.` : "Sei entrato nella squadra");

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

    navigate(`/teams/${teamId}`);
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

          // member_left è loggato dalla RPC leave_team(), nella stessa
          // transazione dell'uscita (nessuna chiamata client extra).
          await leaveTeam(currentTeamId);

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
          }

          notify(
            isLastMember
              ? "Squadra sciolta con successo"
              : "Hai lasciato la squadra",
          );
          navigate("/teams");
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
          await transferOwnership(member.user_id, currentTeamId);

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
          await removeTeamMember(member.user_id, currentTeamId);

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
          await regenerateInviteCode(currentTeamId);
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
        maxMembers: payload.maxMembers,
      }, currentTeamId);
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
        await toggleTeamInvites(nextEnabled, currentTeamId);
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