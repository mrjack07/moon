# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # deps
npm run dev          # Vite dev server with HMR
npm run build        # tsc -b && vite build  → dist/  (the real correctness gate)
npm run lint         # eslint . — see "Lint baseline" below; it FAILS on a clean checkout
npm run preview      # serve the production build
```

**There is no test setup** — no runner, no test files, no `test` script. `npm run build`
(which type-checks with `tsc -b` first) is the only automated verification available.
Don't invent a test command; if tests are wanted, a runner has to be added first.

### Lint baseline (important)

`npm run lint` reports **16 pre-existing errors** on an untouched checkout. Do not treat a
red lint as something you broke — diff against this baseline:

- 14 of them live in the vendored `src/components/ui/**` shadcn files
  (`react-refresh/only-export-components`, `react-hooks/purity` in `sidebar.tsx`).
- 2 are app-owned: [App.tsx:77](src/App.tsx:77) (`Math.random` during render, the star
  field) and [MoonDisplay.tsx:16](src/components/MoonDisplay.tsx:16) (`setState`
  synchronously in an effect, the phase-change animation).

## Architecture

A single-screen moon-phase viewer. React 19 + Vite 7 + TypeScript + Tailwind v3 +
shadcn/ui (`new-york` style, `slate` base). **No router, no backend, no data fetching, no
persistence** — every value on screen is derived synchronously from a `Date`.

Only six files hold the actual app; everything under `src/components/ui/` is vendored
shadcn boilerplate (~55 components) of which **only `button` is imported** by app code.

### State and data flow

[src/App.tsx](src/App.tsx) owns a single source of truth, `selectedDate`. Everything else
is derived from it in one effect: `calculateMoonPhase(selectedDate)` → the big display,
`getTimelinePhases(selectedDate)` → the ±4-day strip, and a `toDateString()` comparison →
`isCurrentDate` (which gates the Reset button). Clicking a timeline entry just sets
`selectedDate`. A 60s interval re-sets `selectedDate` to `new Date()` **only while the
selection is still today**, so "Today" stays accurate without fighting a manual selection.

### Moon math — [src/lib/moonPhase.ts](src/lib/moonPhase.ts)

Pure, DOM-free, no dependencies. Days elapsed since a hardcoded new-moon epoch
(`2000-01-06T18:14Z`) modulo `LUNAR_CYCLE = 29.53058867` give `age`; `age` then drives both
the phase name (hardcoded day-threshold buckets) and `illumination` (a cosine over the
cycle). This is a mean-synodic approximation — it ignores orbital eccentricity and the
observer's timezone/location, so it drifts a few hours from ephemeris data. Fine for the
UI; don't present it as astronomical precision.

**Gotcha:** `MoonDisplay` re-declares the cycle constant locally (`const cycle =
29.53058867` in `getShadowStyle`) to position the terminator. Change the constant in
`moonPhase.ts` and you must change it there too.

### i18n — [src/lib/i18n.ts](src/lib/i18n.ts) + [src/hooks/useLanguage.tsx](src/hooks/useLanguage.tsx)

Hand-rolled, not a library. `Language = 'en' | 'es'`; each language is a flat
`Record<string, string>` of dotted keys, and `t(key, lang)` returns the key itself when a
translation is missing (so a typo shows up as raw `app.footer.hint` on screen, not a crash).
`getPhaseName` is just `t('phase.' + phase, lang)`, which is why `MoonPhase` union members
double as translation-key suffixes.

Conventions to follow:
- **Every new user-facing string must be added to both `en` and `es`** — there is no fallback chain.
- Language lives in React context only: in-memory, defaults to `'en'`, **not persisted and
  not sniffed from the browser locale**. It resets on reload by design.
- Date formatting maps language → BCP-47 at each call site (`language === 'es' ? 'es-ES' :
  'en-US'`) and passes it into `formatDate`/`formatFullDate`. Repeat that pattern rather
  than storing a locale in context.

### Styling — read before adding UI

The app deliberately does **not** use the shadcn design tokens. `index.css` defines the
full `--background`/`--foreground`/etc. token set and `tailwind.config.js` sets
`darkMode: ["class"]`, but **nothing ever adds a `.dark` class**, so those tokens resolve to
the *light* theme. The app instead hardcodes its own dark space theme inline:
`bg-[#0a0a0f]` as the page ground and `text-white/NN` throughout.

Consequence: any shadcn component dropped in renders light-on-light and looks broken. The
one in use is worked around explicitly — `<Button variant="ghost">` plus
`text-white/70 hover:bg-white/10` overrides. Either follow that pattern or wire up the dark
class properly; don't assume `bg-background` will do the right thing.

The moon itself is pure CSS — stacked `radial-gradient` layers (maria, large/medium/small/
micro craters, ridges) inside a `rounded-full` container, with the phase terminator drawn as
a `linear-gradient` hard stop whose direction flips at `age/cycle === 0.5` (shadow on the
right while waxing, left while waning). No images, canvas, or SVG. The star field and its
`twinkle` keyframes are generated inline in `App.tsx`.

## Project conventions & traps

- `@/` → `./src`, declared **twice**: [vite.config.ts](vite.config.ts) and
  [tsconfig.app.json](tsconfig.app.json). Changing paths means editing both.
- TS is strict with `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` (types
  must be imported as `import type { … }`, as the existing code does) and
  `erasableSyntaxOnly` (no enums, no constructor parameter properties).
- [components.json](components.json) points `tailwind.config` at `postcss.config.js`, which
  is wrong — the real config is `tailwind.config.js`. `npx shadcn@latest add …` may
  misbehave because of it; fix the field or add components manually.
- `tailwind.config.js` uses `module.exports` inside a `"type": "module"` package. It works
  because Tailwind v3 loads the config through jiti — don't "correct" it to ESM casually.
- [vite.config.ts](vite.config.ts) sets `base: './'` (relative asset URLs, so `dist/` can be
  served from any subpath) and runs `inspectAttr()` from the third-party
  `kimi-plugin-inspect-react` plugin, which injects source-location attributes into JSX.
- [src/App.css](src/App.css) is dead Vite-template leftover — imported by nothing. Global
  styles live in `src/index.css`.
- [README.md](README.md) is the stock Vite template readme, and [info.md](info.md) is the
  scaffold's component inventory. Neither documents this app; don't cite them as project docs.
