import s from "./Spinner.module.css";

interface SpinnerProps {
  bg: boolean;
  isLoading: boolean;
}

export const Spinner = ({ isLoading, bg }: SpinnerProps) => {
  if (!isLoading) return null;

  return (
    <div className={bg ? s.spinnerContainer : s.noBgSpinnerContainer}>
      <div className={s.spinner}></div>
    </div>
  );
};
