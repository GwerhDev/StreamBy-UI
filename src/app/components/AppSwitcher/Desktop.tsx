import React, { useEffect, useState } from 'react';
import { AppLaunch, splashOf, type SplashKind } from '../AppLaunch/AppLaunch';
import { motion, AnimatePresence } from 'framer-motion';
import s from './Desktop.module.css';
import { SwitcherApp, SwitcherCategory } from '../../../interfaces';
import { fetchAppEnv } from '../../../services/appSwitcher';
import { APP_SWITCHER_URL } from '../../../config/api';
import { useDesktop } from '../../../context/DesktopContext';
import { DesktopDock } from './DesktopDock';

const sameHost = (app: SwitcherApp): boolean => {
  try {
    return new URL(app.url).host === window.location.host;
  } catch {
    return false;
  }
};

const looksLikeStreamby = (app: SwitcherApp): boolean =>
  /streamby/i.test(app.url) || /streamby/i.test(app.label);

export const Desktop = () => {
  const { minimized, setMinimized } = useDesktop();
  const [categories, setCategories] = useState<SwitcherCategory[]>([]);

  useEffect(() => {
    if (APP_SWITCHER_URL) {
      fetchAppEnv(APP_SWITCHER_URL).then(setCategories).catch(() => {});
    }
  }, []);

  const allApps = categories.flatMap(c => c.apps);
  const currentApp = allApps.find(sameHost) ?? allApps.find(looksLikeStreamby);

  // Choosing another app: one whose splash is known opens out of its hexagon into it first (see
  // AppLaunch), the rest are opened at once.
  const [launch, setLaunch] = useState<{ app: SwitcherApp; kind: SplashKind; from: { x: number; y: number } } | null>(null);
  const handleClick = (app: SwitcherApp, e: React.MouseEvent<HTMLElement>) => {
    if (launch) return;
    if (app === currentApp) {
      setMinimized(false);
      return;
    }
    const kind = splashOf(app.label);
    if (!kind) { window.location.href = app.url; return; }
    const r = e.currentTarget.getBoundingClientRect();
    setLaunch({ app, kind, from: { x: r.left + r.width / 2, y: r.top + r.height / 2 } });
  };

  const launcherContent = categories.length === 0
    ? Array.from({ length: 4 }, (_, i) => (
        <div key={i} className={s.skeletonItem}>
          <div className={s.skeletonIcon} />
          <div className={s.skeletonLabel} />
          <div className={s.skeletonDesc} />
        </div>
      ))
    : categories.map((cat, i) => (
        <React.Fragment key={cat.id}>
          {i > 0 && <div className={s.categoryDivider} />}
          <div className={s.category}>
            <span className={s.categoryLabel}>{cat.name}</span>
            <div className={s.categoryApps}>
              {cat.apps.map(app => {
                const current = app === currentApp;
                return (
                  <button
                    key={app.url}
                    type="button"
                    className={`${s.item} ${current ? s.current : ''}`}
                    style={{ '--app-color': app.color ?? 'var(--color-accent)' } as React.CSSProperties}
                    onClick={e => handleClick(app, e)}
                              data-launching={launch?.app === app || undefined}
                  >
                    <span className={s.face}>
                      <img src={app.icon} alt="" className={s.appIcon} />
                      <span className={s.label}>{app.label.toUpperCase()}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </React.Fragment>
      ));

  return (
    <>
      <div className={s.desktop} data-minimized={minimized} aria-hidden={!minimized} />
      <div className={s.dockWrapper}>
        <AnimatePresence>
          {minimized && (
            <motion.div
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
            >
              <DesktopDock />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <div className={s.launcherWrapper}>
        <AnimatePresence>
          {minimized && (
            <motion.div
              className={s.launcher}
            data-launching={!!launch || undefined}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 24 }}
              transition={{ duration: 0.35, ease: 'easeOut', delay: 0.1 }}
            >
              {launcherContent}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {launch && <AppLaunch kind={launch.kind} url={launch.app.url} from={launch.from} onDone={() => { window.location.href = launch.app.url; }} />}
    </>
  );
};
