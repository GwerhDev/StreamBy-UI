import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import s from './Desktop.module.css';
import { SwitcherApp, SwitcherCategory } from '../../../interfaces';
import { fetchAppEnv } from '../../../services/appSwitcher';
import { APP_SWITCHER_URL } from '../../../config/api';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../../store';
import { setMinimized } from '../../../store/desktopSlice';

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
  const minimized = useSelector((state: RootState) => state.desktop.minimized);
  const dispatch = useDispatch();
  const [categories, setCategories] = useState<SwitcherCategory[]>([]);

  useEffect(() => {
    if (APP_SWITCHER_URL) {
      fetchAppEnv(APP_SWITCHER_URL).then(setCategories).catch(() => {});
    }
  }, []);

  const allApps = categories.flatMap(c => c.apps);
  const currentApp = allApps.find(sameHost) ?? allApps.find(looksLikeStreamby);

  const handleClick = (app: SwitcherApp) => {
    if (app === currentApp) {
      dispatch(setMinimized(false));
    } else {
      window.location.href = app.url;
    }
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
                    style={{ '--app-color': app.color ?? 'var(--color-primary)' } as React.CSSProperties}
                    onClick={() => handleClick(app)}
                  >
                    <img src={app.icon} alt="" className={s.appIcon} />
                    <span className={s.label}>{app.label.toUpperCase()}</span>
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
      <div className={s.launcherWrapper}>
        <AnimatePresence>
          {minimized && (
            <motion.div
              className={s.launcher}
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
    </>
  );
};
