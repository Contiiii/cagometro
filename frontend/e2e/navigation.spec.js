import { test, expect } from "@playwright/test";

test.describe("Navigazione", () => {
  const routes = [
    { path: "/", matcher: /Ogni click/ },
    { path: "/report", matcher: /Il tuo ritmo/ },
    { path: "/achievements", matcher: /I tuoi traguardi/ },
    { path: "/teams", matcher: /Squadre/ },
    { path: "/settings", matcher: /Profilo|Come vuoi vederla/ },
    { path: "/login", matcher: /Salva i tuoi progressi/ },
    { path: "/changelog", matcher: /Ogni aggiornamento di Cagometro/ },
    { path: "/privacy", matcher: /Informativa privacy/ },
  ];

  for (const route of routes) {
    test(`carica ${route.path}`, async ({ page }) => {
      await page.goto(route.path);
      await expect(page).toHaveURL(new RegExp(`${route.path}$`));
      await expect(page.getByText(route.matcher).first()).toBeVisible();
    });
  }

  test("mostra la pagina 404 per rotte sconosciute", async ({ page }) => {
    await page.goto("/rotta-inesistente");

    await expect(page.getByRole("heading", { level: 1 })).toHaveText("404");
    await expect(page.getByText("Pagina non trovata")).toBeVisible();
  });
});