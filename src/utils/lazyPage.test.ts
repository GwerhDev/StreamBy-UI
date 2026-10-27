import { vi } from 'vitest';

// The module keeps the pages it was given: a fresh copy for each test.
const fresh = async () => {
  vi.resetModules();
  return import('./lazyPage');
};

afterEach(() => vi.unstubAllGlobals());

describe('lazyPage', () => {
  it("doesn't load a page's code just by declaring it", async () => {
    const { lazyPage } = await fresh();
    const load = vi.fn(async () => ({ Page: () => null }));
    lazyPage(load, 'Page');
    expect(load).not.toHaveBeenCalled();
  });

  it("fetches every page's code once the browser is idle, and only once", async () => {
    const idle: (() => void)[] = [];
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => { idle.push(cb); return 1; });
    const { lazyPage, preloadPages } = await fresh();
    const a = vi.fn(async () => ({ A: () => null }));
    const b = vi.fn(async () => ({ B: () => null }));
    lazyPage(a, 'A');
    lazyPage(b, 'B');

    preloadPages();
    preloadPages();
    expect(a).not.toHaveBeenCalled(); // not before the browser is idle
    expect(idle).toHaveLength(1);
    idle[0]();
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
  });

  it("leaves a page whose code can't be fetched to load when it's shown", async () => {
    vi.stubGlobal('requestIdleCallback', (cb: () => void) => { cb(); return 1; });
    const { lazyPage, preloadPages } = await fresh();
    lazyPage(() => Promise.reject(new Error('offline')), 'Page' as never);
    expect(() => preloadPages()).not.toThrow();
  });
});
