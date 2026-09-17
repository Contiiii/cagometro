// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import QuotaPanel from "./QuotaPanel";
import { fetchQuotaSnapshot } from "../../services/quotaService";

vi.mock("../../services/quotaService", () => ({
  fetchQuotaSnapshot: vi.fn(),
}));

const THEME = {
  primaryText: "text-zinc-100",
  muted: "text-zinc-400",
  subtle: "text-zinc-500",
  softSurface: "bg-white/5",
};

function renderPanel(snapshot, options = {}) {
  vi.mocked(fetchQuotaSnapshot).mockResolvedValue(snapshot);

  return render(
    <QuotaPanel
      theme={THEME}
      accentColor="#22c55e"
      cloudEnabled={options.cloudEnabled ?? true}
    />,
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.mocked(fetchQuotaSnapshot).mockReset();
});

describe("QuotaPanel", () => {
  it("mostra i dati non disponibili quando il cloud è spento", async () => {
    renderPanel(null, { cloudEnabled: false });

    expect(await screen.findByText("Dati non disponibili")).toBeTruthy();
    expect(fetchQuotaSnapshot).not.toHaveBeenCalled();
  });

  it("mostra i dati non disponibili se non c'è snapshot", async () => {
    renderPanel(null);

    expect(await screen.findByText("Dati non disponibili")).toBeTruthy();
  });

  it("mostra le barre di consumo del piano con i valori dello snapshot", async () => {
    renderPanel({
      recordedAt: "2026-09-16T10:00:00.000Z",
      usage: {
        database_size_bytes: 100 * 1024 * 1024,
        storage_bytes: 512 * 1024 * 1024,
        mau: 5000,
      },
      limits: {},
    });

    expect(await screen.findByText("Consumo del piano")).toBeTruthy();

    expect(screen.getByText("Database")).toBeTruthy();
    expect(screen.getByText("100 MB")).toBeTruthy();
    expect(screen.getByText("di 500 MB")).toBeTruthy();
    expect(screen.getByText("20%")).toBeTruthy();

    expect(screen.getAllByText("Storage").length).toBe(2);
    expect(screen.getByText("512 MB")).toBeTruthy();
    expect(screen.getByText("di 1 GB")).toBeTruthy();
    expect(screen.getByText("50%")).toBeTruthy();

    expect(screen.getByText("Utenti attivi / mese")).toBeTruthy();
    expect(screen.getByText("5000")).toBeTruthy();
    expect(screen.getByText("di 50.000")).toBeTruthy();
  });

  it("evidenzia il consumo quando una metrica supera l'80%", async () => {
    renderPanel({
      recordedAt: "2026-09-16T10:00:00.000Z",
      usage: {
        database_size_bytes: 450 * 1024 * 1024,
      },
      limits: {},
    });

    expect(await screen.findByText("90%")).toBeTruthy();
  });

  it("mostra l'indicatore Edge functions e Realtime", async () => {
    renderPanel({
      recordedAt: "2026-09-16T10:00:00.000Z",
      usage: {
        edge_total_invocations: 5,
        total_realtime_requests: 42,
      },
      limits: {},
    });

    expect(await screen.findByText("Edge functions")).toBeTruthy();
    expect(screen.getByText("5 invocazioni")).toBeTruthy();
    expect(screen.getByText(/richieste \/ 7 giorni/)).toBeTruthy();
    expect(screen.getAllByText("42").length).toBe(2);
  });

  it("segnala l'egress come non misurabile via API", async () => {
    renderPanel({
      recordedAt: "2026-09-16T10:00:00.000Z",
      usage: {},
      limits: {},
    });

    expect(await screen.findByText("Egress")).toBeTruthy();
    expect(
      screen.getByText("Non misurabile via API: controlla la dashboard Supabase."),
    ).toBeTruthy();
  });

  it("gestisce uno snapshot senza metriche di consumo", async () => {
    renderPanel({
      recordedAt: "2026-09-16T10:00:00.000Z",
      requests: 120,
      usage: {
        total_auth_requests: 30,
        total_rest_requests: 40,
        total_realtime_requests: 20,
        total_storage_requests: 30,
      },
      limits: {},
    });

    expect(
      await screen.findByText("120 negli ultimi 7 giorni"),
    ).toBeTruthy();
    expect(screen.queryByText("Consumo del piano")).toBeNull();
  });
});