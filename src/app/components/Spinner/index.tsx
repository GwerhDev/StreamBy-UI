import styles from "./Spinner.module.css";

interface SpinnerProps {
  isLoading: boolean;
}

export const Spinner = ({ isLoading }: SpinnerProps) => {
  if (!isLoading) return null;

  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
    </div>
  );
};
