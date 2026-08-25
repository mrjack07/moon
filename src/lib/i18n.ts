import type { MoonPhase } from '@/lib/moonPhase';

export type Language = 'en' | 'es';

// `en` carries no type annotation on purpose: that is what lets TypeScript infer
// the literal key set below. Adding one (or an index signature) would widen the
// keys back to `string` and silently give up every check in this file.
const en = {
  'app.title': 'Moon Phase',
  'app.documentTitle': 'Moon Phase Tracker',
  'a11y.language': 'Language',
  'a11y.timeline': 'Moon phase timeline',
  'app.reset': 'Reset to Today',
  'app.reset.short': 'Reset',
  'app.footer.hint': 'Click on any date in the timeline to view that moon phase',
  'moon.illumination': 'Illumination',
  'timeline.today': 'Today',
  'phase.new-moon': 'New Moon',
  'phase.waxing-crescent': 'Waxing Crescent',
  'phase.first-quarter': 'First Quarter',
  'phase.waxing-gibbous': 'Waxing Gibbous',
  'phase.full-moon': 'Full Moon',
  'phase.waning-gibbous': 'Waning Gibbous',
  'phase.last-quarter': 'Last Quarter',
  'phase.waning-crescent': 'Waning Crescent',
};

/** Every key the UI can ask for. Derived from `en`, which is the source of truth. */
export type TranslationKey = keyof typeof en;

// Annotating `es` as a full Record is the whole point: a missing key, an extra
// key or a misspelled one is a compile error here instead of a raw dotted string
// rendered on screen.
const es: Record<TranslationKey, string> = {
  'app.title': 'Fase Lunar',
  'app.documentTitle': 'Rastreador de Fases Lunares',
  'a11y.language': 'Idioma',
  'a11y.timeline': 'Línea de tiempo de fases lunares',
  'app.reset': 'Volver a Hoy',
  'app.reset.short': 'Reiniciar',
  'app.footer.hint': 'Haz clic en cualquier fecha de la línea de tiempo para ver esa fase lunar',
  'moon.illumination': 'Iluminación',
  'timeline.today': 'Hoy',
  'phase.new-moon': 'Luna Nueva',
  'phase.waxing-crescent': 'Luna Creciente',
  'phase.first-quarter': 'Cuarto Creciente',
  'phase.waxing-gibbous': 'Gibosa Creciente',
  'phase.full-moon': 'Luna Llena',
  'phase.waning-gibbous': 'Gibosa Menguante',
  'phase.last-quarter': 'Cuarto Menguante',
  'phase.waning-crescent': 'Luna Menguante',
};

const translations: Record<Language, Record<TranslationKey, string>> = { en, es };

export function t(key: TranslationKey, lang: Language): string {
  return translations[lang][key];
}

/**
 * `MoonPhase` members double as translation-key suffixes, so this stays checked:
 * add a phase to the union without adding its `phase.*` string and the template
 * literal below stops satisfying `TranslationKey`.
 */
export function getPhaseName(phase: MoonPhase, lang: Language): string {
  return t(`phase.${phase}`, lang);
}
