# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # deps
npm run dev          # Vite dev server with HMR
npm run build        # tsc -b && vite build  → dist/
npm test             # node --test  (auto-discovers test/*.test.ts)
npm run lint         # eslint . — clean; see "The three gates" below
npm run preview      # serve the production build

node --test test/moonPhase.test.ts        # a single file
node --test --test-name-pattern='epoch'   # a single test
```

### Tests

[test/moonPhase.test.ts](test/moonPhase.test.ts) covers
[src/lib/moonPhase.ts](src/lib/moonPhase.ts) — the only module with logic worth pinning.
**No test dependencies**: Node's built-in runner executes the TypeScript directly via native
type stripping, which works because `erasableSyntaxOnly` already forbids any syntax that
would need real compilation. Import source files with an explicit `.ts` extension, as the
suite does; Node's stripper will not resolve extensionless specifiers.

`tsconfig.test.json` is a third project referenced from `tsconfig.json`, so `tsc -b` — and
therefore `npm run build` — type-checks the suite too. It carries `types: ["node"]`, which
`tsconfig.app.json` deliberately does not.

Two conventions in that suite worth keeping:

- The cycle length and epoch are **re-declared** in the test rather than imported. Importing
  them would make the tests agree with any change to the model by construction; duplicating
  them means a change to either constant fails loudly.
- The "pinned output" test is a *characterization* test — it locks the model's own numbers,
  not astronomical truth. `calculateMoonPhase` uses the mean synodic month and drifts hours
  from real ephemerides; don't tighten that test into an accuracy claim without a real
  ephemeris source.

### The three gates

`npm run lint`, `npm test` and `npm run build` all pass on a clean checkout, and
[.github/workflows/ci.yml](.github/workflows/ci.yml) runs the three of them on every push to
`main` and on every pull request. **There is no tolerated baseline of failures** — anything
red is something the change introduced. Keep it that way; a gate that is always red stops
being read.

CI pins Node 24. The suite needs native TypeScript type stripping, which is unflagged from
Node 22.18 and 24 onward — Node 20 will not run it.

Two `eslint-disable` directives exist, both for `react-refresh/only-export-components`, both
with the reasoning written at the call site: `buttonVariants` exported next to `Button` in
[button.tsx](src/components/ui/button.tsx) (that is how shadcn ships it upstream) and
`useLanguage` exported next to its provider in [useLanguage.tsx](src/hooks/useLanguage.tsx).
The rule governs fast-refresh granularity, not correctness. Prefer fixing a new violation
over adding a third directive.

## Architecture

A single-screen moon-phase viewer. React 19 + Vite 7 + TypeScript + Tailwind v3 +
shadcn/ui (`new-york` style, `slate` base). **No router, no backend, no data fetching, no
persistence** — every value on screen is derived synchronously from a `Date`.

The whole app is 10 reachable modules. `src/components/ui/` once held 53 vendored shadcn
components; the 52 that nothing imported were deleted, so **only `button.tsx` remains**.

`package.json` is pruned to exactly the transitive closure of what `src/main.tsx` reaches —
7 runtime dependencies. **Adding a shadcn component means adding its Radix dependency by
hand**, since it is no longer already installed. `npx shadcn@latest add <name>` handles that,
but see the `components.json` trap below.

### State and data flow

[src/App.tsx](src/App.tsx) owns a single source of truth, `selectedDate`, and **everything
else is derived during render, not stored**: `calculateMoonPhase(selectedDate)` → the big
display, `getTimelinePhases(selectedDate)` → the ±4-day strip (both memoized on
`selectedDate`), and a `toDateString()` comparison → `isCurrentDate` (which gates the Reset
button). Keep it that way — an earlier version held all three in `useState` and filled them
from an effect, which cost an extra render per date change and forced a `"Loading..."`
branch for the first paint, when nothing is actually async here. Clicking a timeline entry
just sets `selectedDate`. A 60s interval re-sets `selectedDate` to `new Date()` **only while the
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

The moon's surface is pure CSS — stacked `radial-gradient` layers (maria, large/medium/
small/micro craters, ridges) inside a `rounded-full` container. The star field and its
`twinkle` keyframes are generated inline in `App.tsx`.

The **phase shadow is the one exception**: an inline `<svg>` overlay whose path comes from
`shadowPath` in [moonPhase.ts](src/lib/moonPhase.ts). The terminator is a great circle
projected onto a disc, so it draws a half-ellipse of horizontal semi-axis `R·|2k − 1|` —
straight only at the quarters, bulging into the lit half while crescent (which is what
makes the horns) and into the dark half while gibbous. A `linear-gradient` cannot express
that curve, which is why this one piece is SVG. `shadowPath` also owns the **orientation**:
waxing is lit on its right, matching the 🌒🌓🌔 emoji the timeline shows.

Its geometry is covered in [test/moonPhase.test.ts](test/moonPhase.test.ts) by rebuilding
the path with the SVG spec's own endpoint-to-centre arc conversion and measuring the
enclosed area, which must equal `1 − illumination`. Those tests are what stop a flipped
sweep flag or a mirrored shadow from shipping — verify any change to `shadowPath` against
them rather than by eye.

### Accessibility rules this UI already follows

The palette is white-at-N%-opacity over `#0a0a0f`, so contrast is a direct function of that
number. **`text-white/50` is the floor** — it lands at 5.33:1, and `/40` (3.77:1) and `/30`
(2.62:1) both fail WCAG AA for the small type this app uses. Same for focus rings:
`ring-white/70` clears the 3:1 required of non-text indicators, `ring-white/20` does not.

The visuals carry no information that the text does not: the CSS moon, the phase emoji, the
star field and the amber "today" dot are all `aria-hidden="true"`, because the heading, the
date line and the illumination readout already state the phase. Keep new decoration hidden
the same way rather than describing it twice.

Both button groups need explicit names, since their visible labels are unreliable: the
timeline shows only `"Aug 24"` plus an emoji, and the language switcher drops its country
code below the `sm` breakpoint — leaving a bare flag emoji as the only content. Both carry
`aria-label`, `aria-pressed`, and `aria-current="date"` for today.

[useLanguage.tsx](src/hooks/useLanguage.tsx) syncs `document.documentElement.lang` and
`document.title` on every language change. Without the former a screen reader reads Spanish
copy with English pronunciation, so any new language must go through that provider.

`src/index.css` neutralises animations under `prefers-reduced-motion: reduce`. All motion
here is decorative, so nothing needs an exception. The phase-change animation on the moon
and its heading is replayed by **remounting** them — a React `key` on the phase name — with
the keyframes in `index.css`, rather than by an effect toggling state on a timer. Reach for
the same trick before writing another one.

There is no automated a11y check in the gates — these are conventions, not enforced rules.

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
- [.claude/launch.json](.claude/launch.json) declares the dev server for the preview tools
  (`npm run dev` on Vite's default port 5173, since `vite.config.ts` sets none). Start the
  server through those tools, never through a raw shell command.
- [src/App.css](src/App.css) is dead Vite-template leftover — imported by nothing. Global
  styles live in `src/index.css`.
- `tailwind.config.js` still carries config for components that no longer exist: the
  `sidebar` color group and the `accordion-*` / `caret-blink` keyframes, plus the
  `tailwindcss-animate` plugin that nothing currently uses.
- [README.md](README.md) is the stock Vite template readme, and [info.md](info.md) is the
  scaffold's component inventory. Neither documents this app; don't cite them as project docs.
