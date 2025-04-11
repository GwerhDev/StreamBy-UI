import s from './UnderConstruction.module.css';

export function UnderConstruction() {
  return (
    <div className={s.container}>
      <i>
        <span className={s.infoIcon}>i</span>
        <p>Under construction</p>
      </i>
    </div>
  )
}