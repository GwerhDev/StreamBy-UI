import s from './ModeToggle.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPenRuler } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setMode } from '../../../store/sessionSlice';

export const ModeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: RootState) => state.session.mode) ?? 'developer';
  const trackRef = useRef<HTMLDivElement>(null);

  const isDesigner = mode === 'designer';

  const toggle = useCallback(() => {
    const nextMode = isDesigner ? 'developer' : 'designer';
    dispatch(setMode(nextMode));
    try { localStorage.setItem('streamby-workspace-mode', nextMode); } catch { /* ignore */ }

    const el = trackRef.current;
    if (!el) return;
    el.classList.remove(s.flash);
    void el.offsetWidth;
    el.classList.add(s.flash);
    const onEnd = () => { el.classList.remove(s.flash); el.removeEventListener('animationend', onEnd); };
    el.addEventListener('animationend', onEnd);
  }, [isDesigner, dispatch]);

  return (
    <div
      ref={trackRef}
      className={s.track}
      role="switch"
      aria-checked={isDesigner}
      tabIndex={0}
      onClick={toggle}
      onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && toggle()}
      title={isDesigner ? 'Switch to Developer mode' : 'Switch to Designer mode'}
    >
      <span className={`${s.thumb} ${isDesigner ? s.right : ''}`} />
      <div className={s.labels}>
        <span className={`${s.label} ${!isDesigner ? s.active : s.inactive}`}>
          <FontAwesomeIcon icon={faCode} className={s.labelIcon} />
          Dev
        </span>
        <span className={`${s.label} ${isDesigner ? s.active : s.inactive}`}>
          <FontAwesomeIcon icon={faPenRuler} className={s.labelIcon} />
          Dsgn
        </span>
      </div>
    </div>
  );
};
