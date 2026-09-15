/**
 * Sorts a leaderboard array by score descending, with alphabetical tiebreaker.
 *
 * @param {Array} entries - Array of { user_id, display_name, weekly_total, lifetime_total }
 * @param {"week"|"all"} rankingMode - Which score field to sort by
 * @returns {Array} Sorted copy of the input array
 */
export function rankLeaderboard(entries, rankingMode) {
  return [...entries].sort((a, b) => {
    const aScore =
      rankingMode === "week"
        ? Number(a.weekly_total || 0)
        : Number(a.lifetime_total || 0);

    const bScore =
      rankingMode === "week"
        ? Number(b.weekly_total || 0)
        : Number(b.lifetime_total || 0);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    return String(a.display_name || "").localeCompare(
      String(b.display_name || ""),
      "it",
    );
  });
}
