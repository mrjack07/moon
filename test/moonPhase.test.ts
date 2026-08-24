import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateMoonPhase,
  getTimelinePhases,
  formatDate,
  formatFullDate,
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
