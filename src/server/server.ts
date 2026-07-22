import { createServer, type Server } from "node:http";
import { readFile } from "node:fs/promises";
import { join, extname } from "node:path";
import type { Orchestrator } from "../orchestrator/Orchestrator";
import type { Doelgroep } from "../kennisbank/types";

const GELDIGE_DOELGROEPEN: Doelgroep[] = ["zelf", "ouder-naaste", "professional", "algemeen"];
const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
};

export function maakServer(orchestrator: Orchestrator, publicMap: string): Server {
  return createServer((req, res) => {
    if (req.method === "POST" && req.url === "/api/chat") {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", async () => {
        try {
          const payload = JSON.parse(body) as { vraag?: unknown; doelgroep?: unknown };

          if (typeof payload.vraag !== "string" || payload.vraag.trim() === "") {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ fout: "Veld 'vraag' ontbreekt of is leeg." }));
            return;
          }
          if (!GELDIGE_DOELGROEPEN.includes(payload.doelgroep as Doelgroep)) {
            res.writeHead(400, { "Content-Type": "application/json" });
            res.end(
              JSON.stringify({
                fout: `Veld 'doelgroep' moet een van deze waarden zijn: ${GELDIGE_DOELGROEPEN.join(", ")}`,
              }),
            );
            return;
          }

          const antwoord = await orchestrator.beantwoord(
            payload.vraag,
            payload.doelgroep as Doelgroep,
          );
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end(JSON.stringify(antwoord));
        } catch {
          res.writeHead(500, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ fout: "Er ging iets mis bij het beantwoorden van de vraag." }));
        }
      });
      return;
    }

    const pad = req.url === "/" ? "/index.html" : (req.url ?? "/index.html");
    readFile(join(publicMap, pad))
      .then((bestand) => {
        const contentType = CONTENT_TYPES[extname(pad)] ?? "application/octet-stream";
        res.writeHead(200, { "Content-Type": contentType });
        res.end(bestand);
      })
      .catch(() => {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Niet gevonden");
      });
  });
}
