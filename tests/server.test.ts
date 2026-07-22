import { afterEach, describe, expect, it, vi } from "vitest";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { maakServer } from "../src/server/server";
import type { Orchestrator } from "../src/orchestrator/Orchestrator";

const PUBLIC_MAP = join(__dirname, "..", "src", "server", "public");

describe("server", () => {
  let server: ReturnType<typeof maakServer> | undefined;

  afterEach(() => {
    server?.close();
  });

  it("geeft het antwoord van de Orchestrator terug als JSON op POST /api/chat", async () => {
    const fakeOrchestrator = {
      beantwoord: vi.fn().mockResolvedValue({ tekst: "Een antwoord.", bronnen: [] }),
    } as unknown as Orchestrator;

    server = maakServer(fakeOrchestrator, PUBLIC_MAP);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const poort = (server.address() as AddressInfo).port;

    const response = await fetch(`http://localhost:${poort}/api/chat`, {
      method: "POST",
      body: JSON.stringify({ vraag: "Een vraag", doelgroep: "algemeen" }),
    });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ tekst: "Een antwoord.", bronnen: [] });
    expect(fakeOrchestrator.beantwoord).toHaveBeenCalledWith("Een vraag", "algemeen");
  });

  it("geeft een 400 als 'doelgroep' ontbreekt of ongeldig is", async () => {
    const fakeOrchestrator = { beantwoord: vi.fn() } as unknown as Orchestrator;
    server = maakServer(fakeOrchestrator, PUBLIC_MAP);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const poort = (server.address() as AddressInfo).port;

    const response = await fetch(`http://localhost:${poort}/api/chat`, {
      method: "POST",
      body: JSON.stringify({ vraag: "Een vraag", doelgroep: "niet-bestaand" }),
    });

    expect(response.status).toBe(400);
    expect(fakeOrchestrator.beantwoord).not.toHaveBeenCalled();
  });

  it("serveert index.html op GET /", async () => {
    const fakeOrchestrator = { beantwoord: vi.fn() } as unknown as Orchestrator;
    server = maakServer(fakeOrchestrator, PUBLIC_MAP);
    await new Promise<void>((resolve) => server!.listen(0, resolve));
    const poort = (server.address() as AddressInfo).port;

    const response = await fetch(`http://localhost:${poort}/`);
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("<title>Autibot</title>");
  });
});
