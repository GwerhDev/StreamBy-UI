import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Location, To, useLocation, useNavigate } from 'react-router-dom';

// A form has one URL, and is opened two ways: from inside the app, as a modal over the screen it
// was opened from (that screen kept in the navigation's state, as `backgroundLocation`); followed
// directly (a link pasted, a reload, a new tab), as a page of its own.

export interface FormRouteState {
  backgroundLocation?: Location;
}

/** The screen a form was opened over, if it was opened as a modal. */
export const backgroundOf = (location: Location): Location | undefined =>
  (location.state as FormRouteState | null)?.backgroundLocation ?? undefined;

/**
 * The screen under a form opened as a modal, the one the app's routes show. A reload keeps the
 * navigation's state, so the location the app is opened at never has one: a form followed
 * directly is a page (and that state is dropped).
 */
export function useBackgroundLocation(): Location | undefined {
  const location = useLocation();
  const navigate = useNavigate();
  const [openedAt] = useState(location.key);
  const background = location.key === openedAt ? undefined : backgroundOf(location);
  useEffect(() => {
    if (backgroundOf(location)) navigate(location, { replace: true, state: { ...(location.state as object), backgroundLocation: undefined } });
    // Only as the app is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return background;
}

// Each save of a form opened as a modal, counted: the screen under it stays mounted while the
// form is open, so one that loads what it shows when it's mounted loads it again on a save.
const SavedContext = createContext({ saved: 0, markSaved: () => {} });

// Whether a form is shown as a modal (inside FormModal), or as a page; and, as a modal, how it's
// closed (from its header's ×).
export const InModalContext = createContext(false);
export const FormCloseContext = createContext<(() => void) | null>(null);

export function FormRouteProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState(0);
  const markSaved = useCallback(() => setSaved(n => n + 1), []);
  const value = useMemo(() => ({ saved, markSaved }), [saved, markSaved]);
  return <SavedContext.Provider value={value}>{children}</SavedContext.Provider>;
}

/** How many times a form opened as a modal was saved: a dependency of what a screen loads. */
export const useFormSaved = () => useContext(SavedContext).saved;

/** Opens a form as a modal over the current screen (or over the one a modal open is over). */
export function useOpenForm() {
  const navigate = useNavigate();
  const location = useLocation();
  return useCallback((to: To, state?: Record<string, unknown>) => {
    navigate(to, { state: { ...state, backgroundLocation: backgroundOf(location) ?? location } });
  }, [navigate, location]);
}

/**
 * How a form leaves, opened as a modal or as a page: `close` (cancelled) and `done` (saved) go
 * back to the screen under the modal, or, as a page, to `to` (never back: followed directly,
 * what's before it is another site, or the app loaded again); `goTo` goes on to another screen
 * (a new pipeline's editor), the modal's entry replaced by it.
 */
export function useFormRoute() {
  const navigate = useNavigate();
  const { markSaved } = useContext(SavedContext);
  const inModal = useContext(InModalContext);

  const close = useCallback((to: To) => {
    if (inModal) navigate(-1);
    else navigate(to);
  }, [inModal, navigate]);
  const done = useCallback((to: To) => {
    if (!inModal) return navigate(to);
    markSaved();
    navigate(-1);
  }, [inModal, navigate, markSaved]);
  const goTo = useCallback((to: To) => {
    if (inModal) markSaved();
    navigate(to, { replace: inModal });
  }, [inModal, navigate, markSaved]);

  return { inModal, close, done, goTo };
}
