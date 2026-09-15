import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import packageJson from "../package.json" with { type: "json" };

const SEVERITY_HEADS = {
  serious: "🔴",
  critical: "🚨",
  moderate: "🟠",
  minor: "🟡",
};

const ROUTES = [
  { path: "/", name: "home" },
  { path: "/report", name: "report" },
  { path: "/achievements", name: "achievements" },
  { path: "/teams", name: "teams" },
  { path: "/settings", name: "settings" },
  { path: "/login", name: "login" },
  { path: "/changelog", name: "changelog" },
  { path: "/privacy", name: "privacy" },
  { path: "/rotta-inesistente", name: "pagina 404" },
];

for (const route of ROUTES) {
  test(`a11y: nessuna violation serious/critical su ${route.name}`, async ({ page }) => {
    await page.addInitScript(
      (version) => {
        localStorage.setItem("cagometro_last_seen_version", version);
      },
      packageJson.version,
    );

    await page.goto(route.path);

    const results = await new AxeBuilder({ page }).analyze();

    const blocking = results.violations.filter((violation) =>
      ["serious", "critical"].includes(violation.impact),
    );

    const nonBlocking = results.violations.filter(
      (violation) => !["serious", "critical"].includes(violation.impact),
    );

    if (nonBlocking.length > 0) {
      console.log(
        `ℹ️  ${route.name}: ${nonBlocking.length} violation non bloccanti (` +
          nonBlocking
            .map(
              (v) =>
                `${SEVERITY_HEADS[v.impact]} ${v.id} (${v.nodes.length} nodi)`,
            )
            .join(", ") +
          ")",
      );
    }

    expect(blocking, blocking.map((v) => v.help).join("\n")).toEqual([]);
  });
}