import s from './Documentation.module.css';

export const Documentation = () => {
  return (
    <section className={s.container}>
      <div className={s.innerContainer}>
        <span>
          <h2>Start development...</h2>
          <p>Checkout our documentation for API references and libraries</p>
        </span>
        <ul className={s.cardContainer}>
          <li>
            <article className={s.card}></article>
          </li>
          <li>
            <article className={s.card}></article>
          </li>
        </ul>
      </div>
    </section>
  )
}
