import { devices, expect, test } from "@playwright/test";

const MOBILE_CONTEXT = (({ defaultBrowserType, ...rest }) => rest)(
  devices["Pixel 7"],
);

const IMAGES = [
  { path: "/icon-192.png", label: "icon 192", width: 192, height: 192 },
  { path: "/icon-512.png", label: "icon 512", width: 512, height: 512 },
  {
    path: "/maskable-icon-512.png",
    label: "icon maskable",
    width: 512,
    height: 512,
  },
  { path: "/apple-touch-icon-180.png", label: "apple touch", width: 180, height: 180 },
  {
    path: "/screenshot-mobile.png",
    label: "screenshot mobile",
    width: 1080,
    height: 1920,
  },
  {
    path: "/screenshot-desktop.png",
    label: "screenshot desktop",
    width: 1920,
    height: 1080,
  },
];

function parsePngSize(buffer) {
  const view = new DataView(buffer);
  if (view.getUint32(0) !== 0x89504e47) {
    throw new Error("non è un PNG");
  }
  return {
    width: view.getUint32(16),
    height: view.getUint32(20),
  };
}

async function getResourceSize(request, url) {
  const data = await (await request.get(url)).body();
  return parsePngSize(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
}

test.describe("PWA", () => {
  test("serve il manifest valido", async ({ page }) => {
    const response = await page.request.get("/manifest.webmanifest");
    expect(response.ok()).toBeTruthy();

    const manifest = await response.json();

    expect(manifest.name).toBe("Cagometro");
    expect(manifest.short_name).toBe("Cagometro");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.background_color).toBe("#000000");
    expect(manifest.theme_color).toBe("#000000");
    expect(manifest.icons.length).toBeGreaterThanOrEqual(2);
    expect(manifest.screenshots.length).toBeGreaterThanOrEqual(2);
  });

  test("registra il service worker", async ({ page }) => {
    const response = await page.request.get("/sw.js");
    expect(response.ok()).toBeTruthy();

    await page.goto("/");

    await expect
      .poll(() =>
        page.evaluate(async () => {
          await navigator.serviceWorker.ready;
          const registration = await navigator.serviceWorker.getRegistration();
          return !!registration?.active;
        }),
      )
      .toBe(true);
  });

  test.describe("installazione", () => {
    test.use(MOBILE_CONTEXT);

    test("offre l'installazione quando il browser la permette", async ({
      page,
    }) => {
      await page.goto("/settings");

      await page
        .getByRole("button", { name: "Aggiungi alla Home" })
        .click();

      await expect(
        page.getByRole("heading", { name: "Aggiungi Cagometro alla Home" }),
      ).toBeVisible();

      await page.evaluate(() => {
        window.dispatchEvent(
          new Event("beforeinstallprompt", { cancelable: true }),
        );
      });

      await expect(
        page.getByRole("button", { name: "Installa app" }),
      ).toBeVisible();
    });
  });

  for (const image of IMAGES) {
    test(`serve ${image.label} alle dimensioni dichiarate`, async ({ request }) => {
      const response = await request.get(image.path);
      expect(response.ok()).toBeTruthy();

      const size = await getResourceSize(request, image.path);
      expect(size).toEqual({ width: image.width, height: image.height });
    });
  }
});