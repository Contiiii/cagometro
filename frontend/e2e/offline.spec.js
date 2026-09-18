import { test, expect } from "@playwright/test";

async function waitForServiceWorkerControl(page) {
  await page.goto("/");

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });

  // Il primo load registra lo SW; un reload lo rende "controlling".
  await page.reload();

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
}

test.describe("Fallback offline", () => {
  test("naviga a una rotta secondaria senza connessione servendo la shell", async ({
    page,
    context,
  }) => {
    await waitForServiceWorkerControl(page);

    try {
      await context.setOffline(true);

      await page.goto("/settings");

      await expect(
        page.getByText(/Profilo|Come vuoi vederla/).first(),
      ).toBeVisible();
    } finally {
      await context.setOffline(false);
    }
  });
});