import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { joinTeam } from "../services/teamService";
import { useTeam } from "../hooks/useTeam";

export default function JoinTeamPage() {
  const { code } = useParams();

  const navigate = useNavigate();

  const {
    refreshTeam,
    refreshMembers,
    refreshLeaderboard,
    refreshActivity,
  } = useTeam();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function handleJoin() {
      try {
        await joinTeam(code);

        await Promise.all([
          refreshTeam(),
          refreshMembers(),
          refreshLeaderboard(),
          refreshActivity(),
        ]);

        toast.success("Sei entrato nella squadra");

        navigate("/teams");
      } catch (error) {
        console.error(error);

        toast.error(
          error?.message ||
            "Impossibile entrare nella squadra",
        );

        navigate("/teams");
      } finally {
        setLoading(false);
      }
    }

    if (code) {
      handleJoin();
    }
  }, [
    code,
    navigate,
    refreshActivity,
    refreshLeaderboard,
    refreshMembers,
    refreshTeam,
  ]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-xl font-bold">
          {loading
            ? "Accesso alla squadra..."
            : "Reindirizzamento..."}
        </h1>
      </div>
    </div>
  );
}