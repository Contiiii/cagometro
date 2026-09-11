import { lazy, Suspense, useRef } from "react";
import { AnimatePresence } from "framer-motion";

import Header from "../Header";
import BottomNav from "../BottomNav";

import { useTeamUI } from "../../hooks/useTeamUI";
import { TeamSelectionProvider } from "../../context/TeamSelectionProvider";

import TeamHeroCard from "./TeamHeroCard";
import TeamWeeklyGoal from "./TeamWeeklyGoal";
import TeamLeaderboard from "./TeamLeaderboard";
import TeamActivityFeed from "./TeamActivityFeed";

const TeamMemberDetailsModal = lazy(
  () => import("./modals/TeamMemberDetailsModal"),
);
const TeamOnboardingModal = lazy(
  () => import("./modals/TeamOnboardingModal"),
);
const TeamInviteModal = lazy(() => import("./modals/TeamInviteModal"));
const TeamSettingsModal = lazy(
  () => import("./modals/TeamSettingsModal"),
);
const TeamMembersModal = lazy(() => import("./modals/TeamMembersModal"));
const TransferOwnershipModal = lazy(
  () => import("./modals/TransferOwnershipModal"),
);
const EditTeamModal = lazy(() => import("./modals/EditTeamModal"));
const ConfirmModal = lazy(() => import("./modals/ConfirmModal"));

export default function TeamsDashboard({
  team,
  members = [],
  leaderboard = [],
  activity = [],
  user,
  rankingMode,
  onRankingChange,
  data,
  actions,
  setSelectedMember,
}) {
  const { theme } = useTeamUI();

  const settingsTriggerRef = useRef(null);

  const confirm = actions.confirm;

  return (
    <TeamSelectionProvider
      value={{
        selectedData: data.selectedData,
        selectedPosition: data.selectedPosition,
        selectedMembership: data.selectedMembership,
        selectMember: setSelectedMember,
      }}
    >
      <div
        className={`min-h-screen overflow-x-hidden font-sans transition-colors duration-300 ${theme.app}`}
      >
        <div
          id="team-live-region"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        />
        <Header
          eyebrow="Squadra attiva"
          title={team?.team_name || "Squadra"}
        />

        <main className="mx-auto w-full max-w-5xl px-5 pb-36 pt-7 sm:px-8 sm:pt-10">
          <TeamHeroCard
            team={team}
            membersCount={members.length}
            totalLifetime={data.totalLifetime}
            currentUserPosition={data.currentUserPosition}
            invitesEnabled={Boolean(data.inviteCode) && actions.invitesEnabled}
            onOpenSettings={() => {
              settingsTriggerRef.current = document.activeElement;
              actions.setSettingsOpen(true);
            }}
            onOpenInvite={() => actions.setInviteOpen(true)}
          />

          <TeamWeeklyGoal totalWeekly={data.totalWeekly} weeklyGoal={data.weeklyGoal} />

          <TeamLeaderboard
            leaderboard={leaderboard}
            members={members}
            currentUserId={user?.id}
            rankingMode={rankingMode}
            onRankingChange={onRankingChange}
          />

          <TeamActivityFeed activity={activity} />
        </main>

        <BottomNav />

        <AnimatePresence>
          {data.selectedData && (
            <Suspense fallback={null}>
              <TeamMemberDetailsModal
                onClose={() => setSelectedMember(null)}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.onboardingOpen && (
            <Suspense fallback={null}>
              <TeamOnboardingModal
                onClose={() => actions.setOnboardingOpen(false)}
                team={team}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.inviteOpen && (
            <Suspense fallback={null}>
              <TeamInviteModal
                onClose={() => actions.setInviteOpen(false)}
                team={team}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.settingsOpen && (
            <Suspense fallback={null}>
              <TeamSettingsModal
                team={team}
                leaving={actions.leaving}
                invitesEnabled={actions.invitesEnabled}
                togglingInvites={actions.invitesToggling}
                onToggleInvites={actions.handleToggleInvites}
                onClose={() => actions.setSettingsOpen(false)}
                onEdit={() => {
                  actions.setSettingsOpen(false);
                  actions.setEditOpen(true);
                }}
                onManageMembers={() => {
                  actions.setSettingsOpen(false);
                  actions.setMembersOpen(true);
                }}
                onRegenerateInvite={actions.handleRegenerateInvite}
                onLeave={actions.handleLeaveTeam}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.membersOpen && (
            <Suspense fallback={null}>
              <TeamMembersModal
                team={team}
                members={members}
                leaderboard={leaderboard}
                currentUserId={user?.id}
                onClose={() => actions.setMembersOpen(false)}
                onTransferOwnership={actions.handleTransferOwnership}
                onRemoveMember={actions.handleRemoveMember}
                restoreFocusRef={settingsTriggerRef}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.transferOpen && (
            <Suspense fallback={null}>
              <TransferOwnershipModal
                members={members}
                onClose={() => actions.setTransferOpen(false)}
                onTransferOwnership={actions.handleTransferOwnership}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {actions.editOpen && (
            <Suspense fallback={null}>
              <EditTeamModal
                onClose={() => actions.setEditOpen(false)}
                team={team}
                restoreFocusRef={settingsTriggerRef}
                onSave={actions.handleUpdateTeam}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <Suspense fallback={null}>
          <ConfirmModal
            open={!!confirm.config}
            onClose={confirm.close}
            title={confirm.config?.title}
            description={confirm.config?.description}
            confirmText={confirm.config?.confirmText}
            onConfirm={confirm.config?.onConfirm}
            isDanger={confirm.config?.variant === "danger"}
          />
        </Suspense>
      </div>
    </TeamSelectionProvider>
  );
}