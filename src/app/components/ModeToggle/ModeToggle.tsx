import s from './ModeToggle.module.css';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCode, faPenRuler } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { setMode } from '../../../store/sessionSlice';
import { WorkspaceMode } from '../../../interfaces';

export const ModeToggle = () => {
  const dispatch = useDispatch<AppDispatch>();
  const mode = useSelector((state: RootState) => state.session.mode) ?? 'developer';

  const toggle = (next: WorkspaceMode) => {
    if (next !== mode) dispatch(setMode(next));
  };

  return (
    <div className={s.toggle}>
      <button
        className={`${s.option} ${mode === 'developer' ? s.active : ''}`}
        onClick={() => toggle('developer')}
        title="Developer mode"
      >
        <FontAwesomeIcon icon={faCode} />
        <span>Dev</span>
      </button>
      <button
        className={`${s.option} ${mode === 'designer' ? s.active : ''}`}
        onClick={() => toggle('designer')}
        title="Designer mode"
      >
        <FontAwesomeIcon icon={faPenRuler} />
        <span>Design</span>
      </button>
    </div>
  );
};
