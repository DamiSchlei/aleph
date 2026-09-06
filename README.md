# Aleph

A personal organizer. One character, three screens: **Planning**, **Home**, and **Tracking**.

Work is modeled as **Result → (max 4) Objectives → 3 Stages → Tasks**. Completing a task pays XP and money from hours × difficulty, once.

## Run locally

```bash
npm install
npm run dev
```

The app opens at `http://127.0.0.1:43127`. State lives in `localStorage` (`aleph.state.v1`). Nothing is seeded except the six default skills and the level-1 cosmetics.

```bash
npm test
npm run build
```

## Locales

English (`en`) is the default. Río de la Plata Spanish (`es`) is available from **Customize** on Home. The choice is stored on `Character.locale`.

## Domain

Pure economy and stage rules live in `src/domain/` and are unit-tested. Persistence and write actions live in `src/data/`. UI strings live in `src/locales/{en,es}.json`.
