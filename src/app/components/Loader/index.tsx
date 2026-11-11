import s from './Loader.module.css';
import streambyLogo from "../../../assets/streamby-logo.svg";

export const Loader = () => {
  return (
    <div className="loader d-flex" data-testid="splash">
      <img src={streambyLogo} className="logo" width={"50%"} alt="" />
      <div className={s.barTrack} role="progressbar" aria-label="Loading" data-testid="splash-bar">
        <div className={s.bar} />
      </div>
    </div>
  )
}
