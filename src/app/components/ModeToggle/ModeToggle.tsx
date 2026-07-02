import s from './ModeToggle.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { useCallback, useRef } from 'react';
import { RootState, AppDispatch } from '../../../store';
import { setMode } from '../../../store/sessionSlice';

export const ModeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: RootState) => state.session.mode) ?? 'developer';
  const trackRef = useRef<HTMLDivElement>(null);

  const isDesigner = mode === 'designer';

  const toggle = useCallback(() => {
    dispatch(setMode(isDesigner ? 'developer' : 'designer'));

    const el = trackRef.current;
    if (!el) return;
    el.classList.remove(s.flash);
    // force reflow so the animation restarts
    void el.offsetWidth;
    el.classList.add(s.flash);
    const onEnd = () => { el.classList.remove(s.flash); el.removeEventListener('animationend', onEnd); };
    el.addEventListener('animationend', onEnd);
  }, [isDesigner, dispatch]);

  return (
    <div className={s.wrapper}>
      <span className={`${s.label} ${s.labelDev} ${isDesigner ? s.dim : ''}`}>Dev</span>
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
      </div>
      <span className={`${s.label} ${s.labelDesign} ${isDesigner ? s.bright : ''}`}>Design</span>
    </div>
  );
};
