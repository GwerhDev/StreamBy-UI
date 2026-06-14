import s from './AppSwitcher.module.css';
import { useDispatch } from 'react-redux';
import { toggleMinimized } from '../../../store/desktopSlice';
import streambyIcon from '../../../assets/streamby-icon.svg';

interface AppSwitcherProps {
  label?: string;
  projectIcon?: string;
}

export const AppSwitcher = ({ label = 'STREAMBY', projectIcon }: AppSwitcherProps) => {
  const dispatch = useDispatch();

  return (
    <div className={s.root}>
      <button
        className={s.trigger}
        onClick={() => dispatch(toggleMinimized())}
      >
        <span className={s.brandStreamby}>
          {projectIcon
            ? <img src={projectIcon} alt="" className={s.projectIcon} />
            : <img src={streambyIcon} alt="" className={s.triggerIcon} />
          }
          <span className={s.name}>{label.toUpperCase()}</span>
        </span>
        <span className={s.brandNhexa}>
          <span className={s.nhexaIcon} />
          <span className={s.nhexaName}>NHEXA</span>
        </span>
      </button>
    </div>
  );
};
