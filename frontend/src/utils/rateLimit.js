const FEEDBACK_COOLDOWN_KEY = "feedback_cooldown";
const FEEDBACK_COUNT_KEY = "feedback_count";
const FEEDBACK_DATE_KEY = "feedback_date";

const COOLDOWN_MS = 60_000;
const DAILY_CAP = 10;

export function canSubmitFeedback() {
  const now = Date.now();
  const last = Number(localStorage.getItem(FEEDBACK_COOLDOWN_KEY) || "0");

  if (now - last < COOLDOWN_MS) {
    return { ok: false, waitMs: COOLDOWN_MS - (now - last) };
  }

  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem(FEEDBACK_DATE_KEY) || "";
  let count = Number(localStorage.getItem(FEEDBACK_COUNT_KEY) || "0");

  if (savedDate !== today) {
    count = 0;
  }

  if (count >= DAILY_CAP) {
    return { ok: false, waitMs: 0 };
  }

  return { ok: true, waitMs: 0 };
}

export function recordFeedbackSubmission() {
  const now = Date.now();
  const today = new Date().toISOString().slice(0, 10);
  const savedDate = localStorage.getItem(FEEDBACK_DATE_KEY) || "";

  localStorage.setItem(FEEDBACK_COOLDOWN_KEY, String(now));

  let count = Number(localStorage.getItem(FEEDBACK_COUNT_KEY) || "0");
  if (savedDate !== today) {
    count = 0;
  }

  localStorage.setItem(FEEDBACK_COUNT_KEY, String(count + 1));
  localStorage.setItem(FEEDBACK_DATE_KEY, today);
}
