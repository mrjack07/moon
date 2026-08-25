# Moon Phase

A single-screen moon phase viewer. Pick a day on the ±4-day timeline and it shows that
day's phase name, illuminated fraction and a moon drawn entirely in CSS. English and
Spanish, switchable at runtime.

[![CI](https://github.com/mrjack07/moon/actions/workflows/ci.yml/badge.svg)](https://github.com/mrjack07/moon/actions/workflows/ci.yml)

## Quick start

Needs Node 22.18 or newer — the test suite runs TypeScript through Node's native type
stripping, which is unflagged from that version on. CI pins Node 24.

```bash
npm install
npm run dev        # http://localhost:5173
```

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server with HMR |
| `npm run build` | type-check with `tsc -b`, then build to `dist/` |
| `npm test` | `node --test` — no test dependencies |
| `npm run lint` | `eslint .` |
| `npm run preview` | serve the production build |

All three gates pass on a clean checkout and run in CI on every push and pull request.

## How it works

There is **no backend, no router, no data fetching and nothing persisted**. Every value on
screen is derived synchronously from a single `Date` held in `App.tsx`; clicking a timeline
entry just moves that date.

- **[src/lib/moonPhase.ts](src/lib/moonPhase.ts)** is the whole model, and the only module
  with logic worth testing. Days elapsed since a fixed new-moon epoch, modulo the mean
  synodic month, give the moon's age, which drives both the phase name and the illuminated
  fraction. It is pure and DOM-free.
- **The moon is CSS**: stacked radial gradients for the maria, craters and ridges. The one
  exception is the phase shadow, an SVG path — the terminator is a great circle projected
  onto a disc, so it is a half-ellipse, straight only at the quarters. A gradient cannot
  draw that curve.
- **Translations** are a hand-rolled pair of flat key/value maps. The key set is derived
  from the English map, so a missing or misspelled string in any other language fails the
  type check rather than reaching the screen.

## Accuracy

The model uses the **mean** synodic month and ignores orbital eccentricity, your timezone
and your location. It drifts a few hours from real ephemerides — fine for telling you
roughly what tonight's moon looks like, not an astronomical instrument. The test suite pins
the model's own numbers, not astronomical truth.

## Stack

React 19, Vite 7, TypeScript, Tailwind v3 and a single vendored shadcn/ui component
(`Button`). Seven runtime dependencies, which is exactly the transitive closure of what the
app imports — adding a shadcn component means installing its Radix dependency by hand.

[CLAUDE.md](CLAUDE.md) documents the architecture, conventions and traps in more detail.
