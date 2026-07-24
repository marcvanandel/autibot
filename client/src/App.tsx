import { useState } from "react";
import { Zijbalk } from "./components/Zijbalk";
import { Chatvenster } from "./components/Chatvenster";
import { stelVraag } from "./api";
import type { Doelgroep, GesprekItem } from "./types";

export function App() {
  const [doelgroep, setDoelgroep] = useState<Doelgroep | null>(null);
  const [gesprek, setGesprek] = useState<GesprekItem[]>([]);

  async function handleVraagVersturen(vraag: string) {
    if (!doelgroep) return;
    const id = crypto.randomUUID();
    setGesprek((huidig) => [...huidig, { id, vraag, bezig: true }]);

    const resultaat = await stelVraag(vraag, doelgroep);

    setGesprek((huidig) =>
      huidig.map((item) =>
        item.id === id
          ? "fout" in resultaat
            ? { ...item, bezig: false, fout: resultaat.fout }
            : { ...item, bezig: false, antwoord: resultaat }
          : item,
      ),
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Zijbalk doelgroep={doelgroep} onKiezen={setDoelgroep} />
      <Chatvenster doelgroep={doelgroep} gesprek={gesprek} onVraagVersturen={handleVraagVersturen} />
    </div>
  );
}
