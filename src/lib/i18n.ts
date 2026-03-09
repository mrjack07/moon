export type Language = 'en' | 'es';

interface Translations {
  [key: string]: string;
}

const en: Translations = {
  'app.title': 'Moon Phase',
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

const es: Translations = {
  'app.title': 'Fase Lunar',
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

const translations: Record<Language, Translations> = { en, es };

export function t(key: string, lang: Language): string {
  return translations[lang][key] || key;
}

export function getPhaseName(phase: string, lang: Language): string {
  const key = `phase.${phase}`;
  return t(key, lang);
}
