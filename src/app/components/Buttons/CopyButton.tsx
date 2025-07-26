import React from 'react';
import s from './CopyButton.module.css';

interface CopyButtonProps {
  textToCopy: string;
  children: React.ReactNode;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy, children }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(textToCopy)
      .then(() => {
        console.log('Text copied to clipboard');
        // Optionally, add a visual feedback (e.g., a toast message)
      })
      .catch(err => {
        console.error('Failed to copy text: ', err);
      });
  };

  return (
    <button onClick={handleCopy} className={s.copyButton}>
      {children}
    </button>
  );
};

export default CopyButton;