import { useState } from "react";
import toast from "react-hot-toast";
import { reportError } from "../utils/reportError";

export default function useTeamInvite(team) {
  const [copied, setCopied] = useState(false);

  const inviteCode = team?.invite_code ?? "";

  const inviteLink = inviteCode
    ? `${window.location.origin}/join/${inviteCode}`
    : "";

  async function copyInvite() {
    if (!inviteLink) {
      toast.error("Codice invito non disponibile");
      return;
    }

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2200);
    } catch (error) {
      reportError(error, {
        feature: "team-invite-copy",
        message: "Errore durante la copia dell'invito:",
      });

      toast.error("Non è stato possibile copiare il link");
    }
  }

  async function shareInvite() {
    if (!inviteLink) {
      toast.error("Codice invito non disponibile");
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Unisciti a ${team?.team_name || "questa squadra"}!`,
          text: `Ti ho invitato a ${
            team?.team_name || "una squadra"
          } su Cagometro 🏋️ Clicca il link per unirti al team!`,
          url: inviteLink,
        });

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        reportError(error, {
          feature: "team-invite-share",
          message: "Errore durante la condivisione:",
        });
      }
    }

    await copyInvite();
  }

  return {
    inviteCode,
    inviteLink,
    copied,
    copyInvite,
    shareInvite,
  };
}