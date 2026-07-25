import {type ReactNode, useSyncExternalStore} from 'react';
import {createStorageSlot} from '@docusaurus/theme-common';

/**
 * The current EmailEngine licence price, rendered as a parenthetical that is
 * appended to an authored sentence.
 *
 * The figure and the currency come from https://postalsys.com/region.js, the
 * same source emailengine.app reads, so EU visitors are quoted in EUR and
 * everyone else in USD. Nothing renders until a sane figure is in hand, which
 * keeps the static build and the search index free of a number that can go
 * stale, and leaves the authored sentence untouched when the script is
 * blocked, postalsys.com is down, or the visitor has JS disabled.
 *
 * The band and the currency symbol below are scheduled to go: region.js is
 * moving to sending a pre-formatted string, at which point both collapse into
 * one lookup. They exist in two languages today, here and in the inline script
 * on emailengine.app, with nothing to catch the two copies drifting.
 * `npm run verify-pricing` gates that migration.
 */

type Currency = 'usd' | 'eur';

type Region = {
  currency?: Currency;
  prices?: {usd?: number; eur?: number};
};

// Bounds how stale a cached price can get if every refresh keeps failing. A
// successful load rewrites the cache anyway.
const CACHE_TTL = 7 * 24 * 3600 * 1000;
const SCRIPT_SRC = 'https://postalsys.com/region.js';
const cache = createStorageSlot('psysRegion');

// A band, not just a type check: a backend bug sending cents (99500) or a zero
// must leave the authored sentence standing rather than render a wrong price.
const isSane = (value: unknown): value is number =>
  typeof value === 'number' && value >= 100 && value <= 20000;

function toAmount(region: Region | undefined): string | null {
  if (!region?.prices) {
    return null;
  }
  const currency = region.currency === 'eur' ? 'eur' : 'usd';
  const value = region.prices[currency];
  return isSane(value) ? `${currency === 'eur' ? '€' : '$'}${value}` : null;
}

let amount: string | null = null;
let requested = false;
const listeners = new Set<() => void>();

function publish(region: Region | undefined): void {
  const next = toAmount(region);
  // Collapses the cache hit and the script load into a single notification
  // when they agree, which is the common case.
  if (next === amount) {
    return;
  }
  amount = next;
  listeners.forEach((listener) => listener());
}

function load(): void {
  if (requested) {
    return;
  }
  requested = true;

  try {
    const cached = JSON.parse(cache.get() ?? 'null');
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      publish(cached.data);
    }
  } catch {
    // corrupt cache: behave like a first visit
  }

  const script = document.createElement('script');
  script.src = SCRIPT_SRC;
  script.onload = () => {
    const data = (window as {PSYS_REGION?: Region}).PSYS_REGION;
    if (!data) {
      return;
    }
    publish(data);
    cache.set(JSON.stringify({ts: Date.now(), data}));
  };
  document.head.appendChild(script);
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  load();
  return () => {
    listeners.delete(listener);
  };
}

// Hoisted for stable identity: useSyncExternalStore queues a passive effect on
// every render where getSnapshot differs from the previous one.
const getSnapshot = () => amount;
const getServerSnapshot = () => null;

export default function Price(): ReactNode {
  // getServerSnapshot returns null, so the server render and the hydration
  // render both emit nothing and React never warns about a mismatch. The price
  // appears on the commit after it arrives.
  const price = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  return price ? <>{` (${price} per year)`}</> : null;
}
