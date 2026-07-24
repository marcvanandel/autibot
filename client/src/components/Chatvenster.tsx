import { useEffect, useRef, useState } from "react";
import type { Doelgroep, GesprekItem } from "../types";
import { Bericht } from "./Bericht";

interface ChatvensterProps {
  doelgroep: Doelgroep | null;
  gesprek: GesprekItem[];
  onVraagVersturen: (vraag: string) => void;
}

export function Chatvenster({ doelgroep, gesprek, onVraagVersturen }: ChatvensterProps) {
  const [invoer, setInvoer] = useState("");
  const bezig = gesprek.some((item) => item.bezig);
  const bodemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodemRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [gesprek]);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const vraag = invoer.trim();
    if (!vraag || !doelgroep || bezig) return;
    onVraagVersturen(vraag);
    setInvoer("");
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto p-4">
        {gesprek.map((item) => (
          <Bericht key={item.id} item={item} />
        ))}
        <div ref={bodemRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-gray-200 p-4 dark:border-gray-800">
        <input
          type="text"
          value={invoer}
          onChange={(event) => setInvoer(event.target.value)}
          disabled={!doelgroep}
          placeholder={doelgroep ? "Stel je vraag over autisme..." : "Kies eerst een doelgroep"}
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:disabled:bg-gray-900"
        />
        <button
          type="submit"
          disabled={!doelgroep || bezig}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          Vraag
        </button>
      </form>
    </div>
  );
}
