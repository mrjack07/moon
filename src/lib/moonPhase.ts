// Moon phase calculation utilities

export type MoonPhase = 
  | 'new-moon' 
  | 'waxing-crescent' 
  | 'first-quarter' 
  | 'waxing-gibbous' 
  | 'full-moon' 
  | 'waning-gibbous' 
  | 'last-quarter' 
  | 'waning-crescent';

export interface PhaseInfo {
  phase: MoonPhase;
  icon: string;
  date: Date;
  illumination: number;
  age: number; // days since new moon
}

// Known new moon date (January 6, 2000)
const KNOWN_NEW_MOON = new Date('2000-01-06T18:14:00Z');
export const LUNAR_CYCLE = 29.53058867; // days

export function calculateMoonPhase(date: Date = new Date()): PhaseInfo {
  // Calculate days since known new moon
  const diffTime = date.getTime() - KNOWN_NEW_MOON.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  
  // Calculate age in lunar cycle (0 to 29.53)
  const age = ((diffDays % LUNAR_CYCLE) + LUNAR_CYCLE) % LUNAR_CYCLE;
  
  // Calculate illumination percentage (0-100%)
  const illumination = (1 - Math.cos((age / LUNAR_CYCLE) * 2 * Math.PI)) / 2 * 100;
  
  // Determine phase
  let phase: MoonPhase;
  
  if (age < 1) {
    phase = 'new-moon';
  } else if (age < 6.5) {
    phase = 'waxing-crescent';
  } else if (age < 8.5) {
    phase = 'first-quarter';
  } else if (age < 13.5) {
    phase = 'waxing-gibbous';
  } else if (age < 16.5) {
    phase = 'full-moon';
  } else if (age < 21.5) {
    phase = 'waning-gibbous';
  } else if (age < 23.5) {
    phase = 'last-quarter';
  } else if (age < 28.5) {
    phase = 'waning-crescent';
  } else {
    phase = 'new-moon';
  }
  
  return {
    phase,
    icon: getPhaseIcon(phase),
    date,
    illumination,
    age
  };
}

function getPhaseIcon(phase: MoonPhase): string {
  const icons: Record<MoonPhase, string> = {
    'new-moon': '🌑',
    'waxing-crescent': '🌒',
    'first-quarter': '🌓',
    'waxing-gibbous': '🌔',
    'full-moon': '🌕',
    'waning-gibbous': '🌖',
    'last-quarter': '🌗',
    'waning-crescent': '🌘'
  };
  return icons[phase];
}

export function getTimelinePhases(centerDate: Date = new Date()): PhaseInfo[] {
  const phases: PhaseInfo[] = [];
  
  // Generate phases for 4 days before and 4 days after
  for (let i = -4; i <= 4; i++) {
    const date = new Date(centerDate);
    date.setDate(date.getDate() + i);
    phases.push(calculateMoonPhase(date));
  }
  
  return phases;
}

export function formatDate(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, { 
    month: 'short', 
    day: 'numeric' 
  });
}

export function formatFullDate(date: Date, locale: string = 'en-US'): string {
  return date.toLocaleDateString(locale, { 
    weekday: 'long',
    year: 'numeric',
    month: 'long', 
    day: 'numeric' 
  });
}

/**
 * The shadowed part of the moon's disk, as an SVG path on a 100×100 viewBox.
 *
 * Seen from Earth the terminator is not a straight edge. It is a great circle
 * projected onto a disk, which draws a half-ellipse whose horizontal semi-axis
 * is `R·|2k − 1|` for an illuminated fraction `k`. It flattens into a straight
 * line only at the two quarters, bulges into the lit half while crescent, and
 * into the dark half while gibbous — which is what gives a crescent its horns.
 *
 * `waxing` puts the shadow on the correct side: by the northern-hemisphere
 * convention a waxing moon is lit on its right, matching the 🌒🌓🌔 emoji the
 * rest of the UI shows.
 */
export function shadowPath(illumination: number, waxing: boolean): string {
  const R = 50;
  const k = Math.min(Math.max(illumination / 100, 0), 1);
  const rx = R * Math.abs(2 * k - 1);
  const gibbous = k > 0.5;

  // SVG sweep flags run in the direction of increasing angle, which reads as
  // clockwise on screen because y points down.
  const limbSweep = waxing ? 0 : 1;                          // trace the limb down the dark side
  const termSweep = waxing === gibbous ? 1 : 0;              // bulge away from the shadow when gibbous

  return `M 50 0 A ${R} ${R} 0 0 ${limbSweep} 50 100 A ${rx} ${R} 0 0 ${termSweep} 50 0 Z`;
}
