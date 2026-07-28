import {type ReactNode, useSyncExternalStore} from 'react';
import {createStorageSlot} from '@docusaurus/theme-common';

/**
 * The current EmailEngine licence price, rendered as a parenthetical that is
 * appended to an authored sentence.
 *
 * The figure arrives ready to display from https://postalsys.com/region.js, the
 * same source emailengine.app reads, so EU visitors are quoted in EUR and
 * everyone else in USD. The plausibility band on the amount and the currency
 * symbols live there too: a price that fails the band means `formatted` is
 * absent, which is the only signal this component needs. Never reintroduce a
 * price range here.
 *
 * Nothing renders until a figure is in hand, which keeps the static build and
 * the search index free of a number that can go stale, and leaves the authored
 * sentence untouched when the script is blocked, postalsys.com is down, the
 * cached copy predates `formatted`, or the visitor has JS disabled.
 */

type Currency = 'usd' | 'eur';

type Region = {
  currency?: Currency;
  formatted?: {usd?: string; eur?: string};
};

// Bounds how stale a cached price can get if every refresh keeps failing. A
// successful load rewrites the cache anyway.
const CACHE_TTL = 7 * 24 * 3600 * 1000;
const SCRIPT_SRC = 'https://postalsys.com/region.js';
const cache = createStorageSlot('psysRegion');

function toAmount(region: Region | undefined): string | null {
  const currency: Currency = region?.currency === 'eur' ? 'eur' : 'usd';
  const formatted = region?.formatted?.[currency];
  // A shape check, not a value check. It has to survive a payload that predates
  // the key (a cached copy, a server rollback) and one where the key is present
  // but not a string, which would otherwise render " (1450 per year)".
  return typeof formatted === 'string' && formatted ? formatted : null;
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
