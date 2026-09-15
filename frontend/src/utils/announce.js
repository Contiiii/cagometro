export const GLOBAL_LIVE_REGION_ID = "global-live-region";

export function announce(message) {
  const region = document.getElementById(GLOBAL_LIVE_REGION_ID);

  if (!region) {
    return;
  }

  region.textContent = "";
  region.textContent = message;
}