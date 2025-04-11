import { ActionButton } from '../Buttons/ActionButton';
import s from './Features.module.css';

export const Features = () => {
  return (
    <div className={s.container}>
      <span className={s.title}>
        <h1>WHAT CAN I DO?</h1>
        <p>You can manage your store and...</p>
      </span>
      <ul className={s.cardContainer}>
        <li>
          <article className={s.card}></article>
        </li>
        <li>
          <article className={s.card}></article>
        </li>
        <li>
          <article className={s.card}></article>
        </li>
      </ul>
      <span className={s.buttonContainer}>
        <ActionButton text={"Get started"}/>
      </span>
    </div>
  )
}
