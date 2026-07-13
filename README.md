# Fresh Bites — Menu AI

An AI restaurant menu chatbot prototype for the I-CAPS team pitch. Built as a phone-frame styled web app (React + Vite + TypeScript + Tailwind) so it can be demoed from any browser without needing a physical iPhone.

## Features

- **Chat** — conversational AI menu recommendations based on mood/cravings, plus natural-language ordering (quantity + customization notes)
- **Menu** — browse, search, and filter dishes by tag
- **Cart** — review, adjust quantities, and confirm an order
- **Info** — restaurant hours, best sellers, FAQ

The AI recommendation engine (`src/lib/assistant.ts`) is currently rule-based (keyword matching), not a live LLM call — kept intentionally offline-reliable and free for demos. Swap in a real Gemini/OpenAI call behind the same `respond()` interface to go live.

## Getting started

```bash
npm install
npm run dev
```

Open the printed local URL in your browser — the app renders inside an iPhone-style frame.

## Build

```bash
npm run build
```
