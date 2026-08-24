import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMoonPhase,
  getTimelinePhases,
  formatDate,
  formatFullDate,
  shadowPath,
  type MoonPhase
} from '../src/lib/moonPhase.ts';

// Mirrors of the constants in moonPhase.ts. Kept separate on purpose: if the
// module's values change, these tests should fail rather than follow along.
const CYCLE = 29.53058867;
const EPOCH = new Date('2000-01-06T18:14:00Z');
const DAY_MS = 86_400_000;

/** A date `days` into the lunar cycle that starts at the known new moon. */
const atAge = (days: number) => new Date(EPOCH.getTime() + days * DAY_MS);

const closeTo = (actual: number, expected: number, tolerance: number, what: string) =>
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${what}: expected ~${expected} (±${tolerance}), got ${actual}`
  );

const ALL_PHASES: MoonPhase[] = [
  'new-moon', 'waxing-crescent', 'first-quarter', 'waxing-gibbous',
  'full-moon', 'waning-gibbous', 'last-quarter', 'waning-crescent'
];

const ICONS: Record<MoonPhase, string> = {
  'new-moon': '🌑',
  'waxing-crescent': '🌒',
  'first-quarter': '🌓',
  'waxing-gibbous': '🌔',
  'full-moon': '🌕',
  'waning-gibbous': '🌖',
  'last-quarter': '🌗',
  'waning-crescent': '🌘'
};

describe('calculateMoonPhase — the four cardinal points', () => {
  test('the epoch itself is a dark new moon', () => {
    const p = calculateMoonPhase(EPOCH);
    closeTo(p.age, 0, 1e-9, 'age');
    closeTo(p.illumination, 0, 1e-9, 'illumination');
    assert.equal(p.phase, 'new-moon');
    assert.equal(p.icon, '🌑');
  });

  test('a quarter cycle in is a half-lit first quarter', () => {
    const p = calculateMoonPhase(atAge(CYCLE / 4));
    closeTo(p.age, 7.382647, 1e-5, 'age');
    closeTo(p.illumination, 50, 1e-6, 'illumination');
    assert.equal(p.phase, 'first-quarter');
  });

  test('half a cycle in is a fully lit full moon', () => {
    const p = calculateMoonPhase(atAge(CYCLE / 2));
    closeTo(p.age, 14.765294, 1e-5, 'age');
    closeTo(p.illumination, 100, 1e-6, 'illumination');
    assert.equal(p.phase, 'full-moon');
  });

  test('three quarters in is a half-lit last quarter', () => {
    const p = calculateMoonPhase(atAge((3 * CYCLE) / 4));
    closeTo(p.illumination, 50, 1e-6, 'illumination');
    assert.equal(p.phase, 'last-quarter');
  });
});

describe('calculateMoonPhase — invariants', () => {
  test('dates before the epoch stay inside the cycle', () => {
    // The `((x % c) + c) % c` dance exists for exactly this case: a plain `%`
    // would hand back a negative age for anything earlier than January 2000.
    for (const daysBack of [1, 15, 40, 365, 3653, CYCLE * 100]) {
      const { age } = calculateMoonPhase(atAge(-daysBack));
      assert.ok(age >= 0 && age < CYCLE, `age out of range for -${daysBack}d: ${age}`);
    }
  });

  test('age, illumination, phase and icon stay valid across a decade', () => {
    const start = new Date('2020-01-01T00:00:00Z').getTime();
    for (let i = 0; i < 3653; i++) {
      const d = new Date(start + i * DAY_MS);
      const p = calculateMoonPhase(d);
      assert.ok(p.age >= 0 && p.age < CYCLE, `age out of range on ${d.toISOString()}`);
      assert.ok(
        p.illumination >= 0 && p.illumination <= 100,
        `illumination out of range on ${d.toISOString()}: ${p.illumination}`
      );
      assert.ok(ALL_PHASES.includes(p.phase), `unknown phase on ${d.toISOString()}`);
      assert.equal(p.icon, ICONS[p.phase], `icon/phase mismatch on ${d.toISOString()}`);
      assert.equal(p.date, d, 'the input date should come back untouched');
    }
  });

  test('illumination is symmetric around the full moon', () => {
    // Waxing and waning halves are mirror images: cos is an even function.
    for (const age of [0.5, 3, 7.38, 11, 14]) {
      const waxing = calculateMoonPhase(atAge(age)).illumination;
      const waning = calculateMoonPhase(atAge(CYCLE - age)).illumination;
      closeTo(waning, waxing, 1e-6, `illumination at age ${age} vs ${CYCLE - age}`);
    }
  });

  test('the eight phases appear in order, once per cycle', () => {
    // Walks one full cycle and records every phase change. Catches a typo in
    // any single threshold, which a spot check at the cardinal points misses.
    const seen: MoonPhase[] = [];
    for (let age = 0; age < CYCLE; age += 0.005) {
      const { phase } = calculateMoonPhase(atAge(age));
      if (seen[seen.length - 1] !== phase) seen.push(phase);
    }
    assert.deepEqual(seen, [
      'new-moon',        // the cycle opens and closes on a new moon, so it
      'waxing-crescent', // is the only phase that shows up twice here
      'first-quarter',
      'waxing-gibbous',
      'full-moon',
      'waning-gibbous',
      'last-quarter',
      'waning-crescent',
      'new-moon'
    ]);
  });

  test('called with no argument it reads the current date', () => {
    const before = Date.now();
    const p = calculateMoonPhase();
    const after = Date.now();
    assert.ok(p.date.getTime() >= before && p.date.getTime() <= after);
    assert.ok(ALL_PHASES.includes(p.phase));
  });
});

describe('calculateMoonPhase — pinned output', () => {
  test('a fixed date still yields the same age', () => {
    // Characterization test, not an ephemeris check: it pins the epoch and the
    // cycle length so that changing either one is a deliberate, visible act.
    // The model uses the *mean* synodic month, so it drifts several hours from
    // real ephemerides — do not tighten this into an accuracy claim.
    const p = calculateMoonPhase(new Date('2026-08-24T12:00:00Z'));
    closeTo(p.age, 11.176605, 1e-5, 'age on 2026-08-24');
    closeTo(p.illumination, 86.118918, 1e-5, 'illumination on 2026-08-24');
    assert.equal(p.phase, 'waxing-gibbous');
  });
});

describe('getTimelinePhases', () => {
  const center = new Date(2026, 7, 24, 12, 0, 0); // local noon, timezone-safe

  test('returns nine days centred on the given date', () => {
    const phases = getTimelinePhases(center);
    assert.equal(phases.length, 9);
    assert.equal(phases[4].date.toDateString(), center.toDateString());
  });

  test('the nine days are consecutive and ascending', () => {
    const phases = getTimelinePhases(center);
    for (let i = 1; i < phases.length; i++) {
      const gap = phases[i].date.getTime() - phases[i - 1].date.getTime();
      closeTo(gap / DAY_MS, 1, 0.1, `gap between entry ${i - 1} and ${i}`);
    }
  });

  test('it rolls over a year boundary', () => {
    const phases = getTimelinePhases(new Date(2026, 11, 30, 12, 0, 0));
    assert.equal(phases[0].date.getFullYear(), 2026);
    assert.equal(phases[0].date.getMonth(), 11);
    assert.equal(phases[8].date.getFullYear(), 2027);
    assert.equal(phases[8].date.getMonth(), 0);
    assert.equal(phases[8].date.getDate(), 3);
  });

  test('it does not mutate the date it is given', () => {
    const original = new Date(2026, 7, 24, 12, 0, 0);
    const snapshot = original.getTime();
    getTimelinePhases(original);
    assert.equal(original.getTime(), snapshot);
  });

  test('each entry matches calculateMoonPhase for that day', () => {
    for (const entry of getTimelinePhases(center)) {
      assert.equal(entry.phase, calculateMoonPhase(entry.date).phase);
    }
  });
});

describe('date formatting', () => {
  const d = new Date(2026, 0, 15, 12, 0, 0);

  test('formatDate is short and locale-aware', () => {
    assert.equal(formatDate(d, 'en-US'), 'Jan 15');
    assert.equal(formatDate(d, 'es-ES'), '15 ene');
  });

  test('formatFullDate spells out weekday, month and year', () => {
    assert.equal(formatFullDate(d, 'en-US'), 'Thursday, January 15, 2026');
    assert.equal(formatFullDate(d, 'es-ES'), 'jueves, 15 de enero de 2026');
  });

  test('both default to en-US', () => {
    assert.equal(formatDate(d), formatDate(d, 'en-US'));
    assert.equal(formatFullDate(d), formatFullDate(d, 'en-US'));
  });
});


// --- SVG arc geometry -------------------------------------------------------
// Turning shadowPath's output back into points needs the endpoint-to-centre
// conversion from the SVG spec (1.1, appendix F.6.5). It is transcribed here
// rather than reasoned about, so the tests below check what a browser would
// actually draw instead of agreeing with whatever the implementation intended.

type Point = [number, number];

function arcPoints(
  x1: number, y1: number, rx: number, ry: number,
  sweep: number, x2: number, y2: number, steps = 400
): Point[] {
  // The spec treats a zero radius as a straight line segment.
  if (rx === 0 || ry === 0) return [[x1, y1], [x2, y2]];

  const x1p = (x1 - x2) / 2;
  const y1p = (y1 - y2) / 2;
  const scale = (x1p * x1p) / (rx * rx) + (y1p * y1p) / (ry * ry);
  if (scale > 1) {
    rx *= Math.sqrt(scale);
    ry *= Math.sqrt(scale);
  }

  const numerator = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  const denominator = rx * rx * y1p * y1p + ry * ry * x1p * x1p;
  // large-arc-flag is always 0 in shadowPath, so the coefficient's sign is
  // decided by the sweep flag alone.
  const coeff = (sweep === 0 ? 1 : -1) * Math.sqrt(Math.max(0, numerator / denominator));
  const cxp = (coeff * rx * y1p) / ry;
  const cyp = (-coeff * ry * x1p) / rx;
  const cx = cxp + (x1 + x2) / 2;
  const cy = cyp + (y1 + y2) / 2;

  const angle = (ux: number, uy: number, vx: number, vy: number) => {
    const sign = Math.sign(ux * vy - uy * vx) || 1;
    const cos = (ux * vx + uy * vy) / (Math.hypot(ux, uy) * Math.hypot(vx, vy));
    return sign * Math.acos(Math.min(1, Math.max(-1, cos)));
  };

  const startX = (x1p - cxp) / rx;
  const startY = (y1p - cyp) / ry;
  const theta = angle(1, 0, startX, startY);
  let delta = angle(startX, startY, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (sweep === 0 && delta > 0) delta -= 2 * Math.PI;
  if (sweep === 1 && delta < 0) delta += 2 * Math.PI;

  return Array.from({ length: steps + 1 }, (_, i): Point => {
    const t = theta + (delta * i) / steps;
    return [cx + rx * Math.cos(t), cy + ry * Math.sin(t)];
  });
}

/** Every point along the outline shadowPath describes. */
function outline(d: string): Point[] {
  const m = d.match(
    /^M 50 0 A ([\d.]+) ([\d.]+) 0 0 (\d) 50 100 A ([\d.]+) ([\d.]+) 0 0 (\d) 50 0 Z$/
  );
  assert.ok(m, `unexpected path shape: ${d}`);
  return [
    ...arcPoints(50, 0, Number(m[1]), Number(m[2]), Number(m[3]), 50, 100),
    ...arcPoints(50, 100, Number(m[4]), Number(m[5]), Number(m[6]), 50, 0)
  ];
}

const polygonArea = (pts: Point[]) => {
  let sum = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i];
    const [x2, y2] = pts[(i + 1) % pts.length];
    sum += x1 * y2 - x2 * y1;
  }
  return Math.abs(sum) / 2;
};

const centroidX = (pts: Point[]) => pts.reduce((s, p) => s + p[0], 0) / pts.length;

const DISC_AREA = Math.PI * 50 * 50;

describe('shadowPath', () => {
  test('the shadow covers exactly the unlit fraction of the disc', () => {
    // The real check on the geometry: get any radius or sweep flag wrong and
    // the enclosed area stops matching 1 − illumination.
    for (const illumination of [0, 5, 10, 25, 40, 50, 60, 75, 90, 95, 100]) {
      for (const waxing of [true, false]) {
        const fraction = polygonArea(outline(shadowPath(illumination, waxing))) / DISC_AREA;
        closeTo(
          fraction,
          1 - illumination / 100,
          0.002,
          `shadow area at ${illumination}% ${waxing ? 'waxing' : 'waning'}`
        );
      }
    }
  });

  test('the shadow sits on the left while waxing, on the right while waning', () => {
    // Northern-hemisphere convention, and what the 🌒🌓🌔 emoji elsewhere show.
    for (const illumination of [10, 25, 50, 75, 90]) {
      assert.ok(
        centroidX(outline(shadowPath(illumination, true))) < 50,
        `waxing shadow should hug the left edge at ${illumination}%`
      );
      assert.ok(
        centroidX(outline(shadowPath(illumination, false))) > 50,
        `waning shadow should hug the right edge at ${illumination}%`
      );
    }
  });

  test('waxing and waning are mirror images of each other', () => {
    for (const illumination of [10, 30, 70, 90]) {
      const waxing = outline(shadowPath(illumination, true));
      const waning = outline(shadowPath(illumination, false));
      closeTo(polygonArea(waning), polygonArea(waxing), 1e-6, 'mirrored area');
      closeTo(centroidX(waxing) + centroidX(waning), 100, 1e-6, 'mirrored centroid');
    }
  });

  test('the terminator is straight only at the quarters', () => {
    // A zero horizontal radius is what SVG renders as a straight edge.
    const radius = (d: string) => Number(d.match(/A ([\d.]+) 50 0 0 \d 50 0 Z$/)![1]);
    assert.equal(radius(shadowPath(50, true)), 0);
    for (const illumination of [0, 25, 49, 51, 75, 100]) {
      assert.ok(radius(shadowPath(illumination, true)) > 0, `should curve at ${illumination}%`);
    }
  });

  test('illumination outside 0–100 is clamped', () => {
    assert.equal(shadowPath(-20, true), shadowPath(0, true));
    assert.equal(shadowPath(120, true), shadowPath(100, true));
  });
});
