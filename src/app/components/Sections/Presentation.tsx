import s from './Presentation.module.css';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

export const Presentation = () => {
  return (
    <div className={s.container}>
      <section className={s.leftSection}>
        <span className={s.icon}>
          <img src="streamby-icon.svg" alt="" width={120} />
        </span>
        <h1>Share your multimedia files</h1>
        <p>Store and manage files for your web projects</p>
        <span className={s.buttons}>
          <ActionButton text="Try free" />
          <SecondaryButton text="Pricing" />
        </span>
      </section>
      <section className={s.rightSection}>
        <div className={s.widthWrapper}>
          <div className={s.wrapper}>
            <div className={s.imageContainer}>
              <img src="landing-image.jpg" alt="" width={"100%"} />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
