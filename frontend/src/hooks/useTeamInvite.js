import { useState } from "react";
import toast from "react-hot-toast";

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
      console.error(
        "Errore durante la copia dell'invito:",
        error,
      );

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
          title: `Unisciti a ${team?.team_name || "questa squadra"}`,
          text: `Entra nella squadra ${
            team?.team_name || ""
          } su Cagometro.`,
          url: inviteLink,
        });

        return;
      } catch (error) {
        if (error?.name === "AbortError") {
          return;
        }

        console.error(
          "Errore durante la condivisione:",
          error,
        );
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