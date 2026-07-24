# 0008. React/Vite/Tailwind voor de chat-UI

Datum: 2026-07-23
Status: Geaccepteerd

## Context

De eerste chat-UI van Autibot is een minimale vanilla-HTML/JS-pagina (`src/server/public/index.html` + `app.js`), functioneel maar visueel kaal. Voor een ChatGPT-achtige look (zijbalk, berichten-bubbels, invoerbalk onderaan) is een herbouw van de front-end nodig. Overwogen alternatieven: Next.js met een bestaand chat-template (bijv. Vercel's ai-chatbot), en het vanilla JS/CSS verder herstijlen zonder framework. De volledige afweging, dataflow en bestandsstructuur staan in `docs/superpowers/specs/2026-07-23-react-chat-ui-design.md`.

## Beslissing

De chat-UI wordt herbouwd in React + Vite + Tailwind CSS, met alle componenten zelf opgebouwd (geen component-library zoals shadcn/ui). React is gekozen omdat de ontwikkelaar hier al ervaring mee heeft — een expliciete, zwaarwegende factor voor een project dat zelf onderhouden moet worden, niet primair een technische afweging. Vite is gekozen boven Next.js omdat er geen SSR/routing nodig is voor één lokale pagina met een eigen bestaande Node-backend. De backend (Kennisbank, Retriever, Orchestrator, ClaudeProvider, het `/api/chat`-contract) blijft volledig ongewijzigd; dit is uitsluitend een front-end herbouw.

## Consequenties

- Er komt een build-stap bij (`vite build --watch`) waar er voorheen geen was; `npm run dev` start voortaan twee processen via `concurrently`.
- Nieuwe dependencies: `react`, `react-dom`, `vite`, `@vitejs/plugin-react`, `@types/react`, `@types/react-dom`, `tailwindcss`, `@tailwindcss/vite`, `concurrently`.
- `src/server/public/` wordt bouw-output (niet meer met de hand bewerkt) en verhuist naar `.gitignore`; de React-broncode leeft in het nieuwe, wel-getrackte `client/`.
- Geen streaming, geen gespreksgeschiedenis, geen persistente doelgroepkeuze en geen geautomatiseerde front-end tests — bewust uitgesteld/afgewezen, zie het ontwerpdocument voor de motivatie per punt.
