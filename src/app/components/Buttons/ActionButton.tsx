import s from './ActionButton.module.css';

export const ActionButton = (props: any) => {
  const { text, onClick, img } = props || null;

  function handleOnClick() {
    onClick && onClick();
  }

  return (
    <button className={s.container} onClick={handleOnClick} style={{ backgroundImage: `url(${img})` }}>
      {text}
    </button>
  )
}
