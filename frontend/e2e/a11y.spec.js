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

for (const route of ROUTES) {
  test(`a11y: contrasto colore AA 4.5:1 su ${route.name}`, async ({ page }) => {
    await page.addInitScript(
      (version) => {
        localStorage.setItem("cagometro_last_seen_version", version);
      },
      packageJson.version,
    );

    await page.goto(route.path);

    const contrastRun = await new AxeBuilder({ page })
      .withRules(["color-contrast"])
      .analyze();

    const failures = contrastRun.violations.flatMap((violation) =>
      (violation.nodes ?? []).map(
        (node) =>
          `${violation.impact} ${violation.help} → ${node.html}`,
      ),
    );

    const unresolved = contrastRun.incomplete.flatMap((violation) =>
      (violation.nodes ?? []).map(
        (node) =>
          `${violation.impact} ${violation.help} → ${node.html}`,
      ),
    );

    if (unresolved.length > 0) {
      console.log(
        `⚠️  ${route.name}: ${unresolved.length} contrasti non verificabili ` +
          `(sfondo translucido/non in DOM), campionati: ` +
          unresolved.slice(0, 5).join(" | "),
      );
    }

    expect(
      failures,
      `Contrasti sotto AA su ${route.name}:\n` + failures.join("\n"),
    ).toEqual([]);
  });
}