// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";

import {
  announce,
  GLOBAL_LIVE_REGION_ID,
} from "../utils/announce";

function clearDom() {
  document.body.innerHTML = "";
}

afterEach(() => {
  clearDom();
});

describe("announce", () => {
  it("senza live region non fa nulla", () => {
    expect(() => announce("test")).not.toThrow();
  });

  it("scrive il messaggio nella live region globale", () => {
    document.body.innerHTML = `<div id="${GLOBAL_LIVE_REGION_ID}"></div>`;

    announce("Sincronizzazione ripristinata");

    const region = document.getElementById(GLOBAL_LIVE_REGION_ID);

    expect(region.textContent).toBe("Sincronizzazione ripristinata");
  });

  it("un nuovo annuncio sostituisce il precedente", () => {
    document.body.innerHTML = `<div id="${GLOBAL_LIVE_REGION_ID}"></div>`;

    announce("Primo");
    announce("Secondo");

    const region = document.getElementById(GLOBAL_LIVE_REGION_ID);

    expect(region.textContent).toBe("Secondo");
  });
});