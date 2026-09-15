import { test, expect } from "@playwright/test";

import packageJson from "../package.json" with { type: "json" };

function localDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const ALL_ACHIEVEMENTS = [
  "prima-cacca",
  "abitudinario",
  "veterano",
  "costante",
  "leggenda",
  "first-team",
  "weekly-100",
  "lifetime-500",
  "lifetime-1000",
  "ten-members",
  "goal-completed",
];

async function prepareOfflineState(page, todayCount = 2) {
  await page.addInitScript(
    ({ version, achievements, entries }) => {
      localStorage.setItem("cagometro_last_seen_version", version);
      localStorage.setItem("shownAchievements", JSON.stringify(achievements));
      localStorage.setItem("entries_anonymous", JSON.stringify(entries));
    },
    {
      version: packageJson.version,
      achievements: ALL_ACHIEVEMENTS,
      entries: { [localDateKey()]: todayCount },
    },
  );
}

test.describe("Home offline", () => {
  test("registra, incrementa il contatore e annulla", async ({ page }) => {
    await prepareOfflineState(page, 0);

    await page.goto("/");

    const counter = page.getByLabel(/registrazioni effettuate oggi/);

    await expect(counter).toHaveText("0");

    await page.getByRole("button", { name: "Aggiungi una registrazione" }).click();

    await expect(counter).toHaveText("1");
    await expect(page.getByText("Registrazione aggiunta. Missione compiuta.")).toBeVisible();

    await page
      .getByRole("button", { name: "Annulla ultima registrazione" })
      .click();

    await expect(counter).toHaveText("0");
  });

  test("mostra lo streak aggiornato dopo la registrazione", async ({ page }) => {
    await prepareOfflineState(page, 0);

    await page.goto("/");

    await page.getByRole("button", { name: "Aggiungi una registrazione" }).click();

    await expect(page.getByText("1 giorno di fila")).toBeVisible();
  });
});