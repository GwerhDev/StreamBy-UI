import { ComponentType, lazy } from 'react';

const loaders: (() => Promise<unknown>)[] = [];

// A route's page, in a chunk of its own: loaded the first time it's shown, or before, by
// preloadPages().
export function lazyPage<M, K extends keyof M>(load: () => Promise<M>, name: K) {
  loaders.push(load);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return lazy(() => load().then(module => ({ default: module[name] as unknown as ComponentType<any> })));
}

let preloaded = false;

// Every page's code, fetched once the browser is idle. Navigating is a transition: until the
// new page's code is in, the old page stays on screen, so a page first followed from the menu
// would otherwise wait for its download before the menu's click shows anything. The pages are
// small; the heavy viewers they open (three.js) are loaded on their own, not here.
export function preloadPages() {
  if (preloaded) return;
  preloaded = true;
  const run = () => loaders.forEach(load => load().catch(() => { /* loaded on demand, then */ }));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 3000 });
  else setTimeout(run, 1000);
}
