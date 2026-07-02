import s from './ModeToggle.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../../store';
import { setMode } from '../../../store/sessionSlice';

export const ModeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: RootState) => state.session.mode) ?? 'developer';

  const isDesigner = mode === 'designer';

  const toggle = () => {
    dispatch(setMode(isDesigner ? 'developer' : 'designer'));
  };

  return (
    <div className={s.wrapper}>
      <span className={`${s.label} ${s.labelDev} ${isDesigner ? s.dim : ''}`}>Dev</span>
      <div
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
