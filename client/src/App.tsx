import { useState } from "react";
import { Zijbalk } from "./components/Zijbalk";
import type { Doelgroep } from "./types";

export function App() {
  const [doelgroep, setDoelgroep] = useState<Doelgroep | null>(null);

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Zijbalk doelgroep={doelgroep} onKiezen={setDoelgroep} />
      <main className="flex flex-1 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
        {doelgroep ? `Gekozen doelgroep: ${doelgroep}` : "Kies eerst een doelgroep"}
      </main>
    </div>
  );
}
