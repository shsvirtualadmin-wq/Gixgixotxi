/**
 * Lightweight browser Performance API instrumentation for measuring
 * login -> dashboard, Admin Dashboard -> student count, menu open,
 * and bottom-nav tab switches. Produces zero UI output.
 */

export interface PerfMeasurement {
  name: string;
  durationMs: number;
  at: number;
  meta?: Record<string, string | number | boolean>;
}

interface BoardlyPerfStore {
  marks: Record<string, number>;
  measures: PerfMeasurement[];
  getSummary: () => Record<string, PerfMeasurement[]>;
}

const MAX_MEASURES = 100;

function getStore(): BoardlyPerfStore | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { __boardlyPerf?: BoardlyPerfStore };
  if (!w.__boardlyPerf) {
    const store: BoardlyPerfStore = {
      marks: {},
      measures: [],
      getSummary() {
        const grouped: Record<string, PerfMeasurement[]> = {};
        for (const m of store.measures) {
          if (!grouped[m.name]) grouped[m.name] = [];
          grouped[m.name].push(m);
        }
        return grouped;
      },
    };
    w.__boardlyPerf = store;
  }
  return w.__boardlyPerf;
}

export function perfMarkStart(name: string): void {
  const store = getStore();
  if (!store) return;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  store.marks[name] = now;
  try {
    performance.mark(`boardly:${name}:start`);
  } catch {
    // Ignore mark errors
  }
}

export function perfMarkEnd(
  name: string,
  meta?: Record<string, string | number | boolean>
): number | null {
  const store = getStore();
  if (!store) return null;
  const start = store.marks[name];
  if (typeof start !== 'number') return null;
  const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const durationMs = Math.max(0, Math.round((now - start) * 10) / 10);
  delete store.marks[name];

  try {
    performance.mark(`boardly:${name}:end`);
    performance.measure(`boardly:${name}`, `boardly:${name}:start`, `boardly:${name}:end`);
  } catch {
    // Ignore measure errors
  }

  store.measures.push({
    name,
    durationMs,
    at: Date.now(),
    ...(meta ? { meta } : {}),
  });
  if (store.measures.length > MAX_MEASURES) {
    store.measures.splice(0, store.measures.length - MAX_MEASURES);
  }
  return durationMs;
}
