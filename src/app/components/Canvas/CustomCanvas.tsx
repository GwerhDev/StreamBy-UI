import { useEffect, useRef, ReactNode, RefObject, CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import s from './CustomCanvas.module.css';

interface CustomCanvasProps {
  children: ReactNode;
  showCanvas: boolean;
  setShowCanvas: (show: boolean) => void;
  anchorRef?: RefObject<HTMLButtonElement | HTMLSpanElement | null>;
}

export const CustomCanvas = (props: CustomCanvasProps) => {
  const { children, showCanvas, setShowCanvas, anchorRef } = props;
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCanvas(false);
      }
    };

    if (showCanvas) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showCanvas, setShowCanvas]);

  if (!showCanvas) return null;

  if (anchorRef?.current) {
    const rect = anchorRef.current.getBoundingClientRect();
    const style: CSSProperties = {
      position: 'fixed',
      top: rect.bottom + 4,
      left: rect.left,
      zIndex: 1000,
      width: 210,
    };

    return createPortal(
      <div style={style} ref={containerRef}>
        <div className={s.canvas}>
          {children}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div className={s.container} ref={containerRef}>
      <div className={s.canvas}>
        {children}
      </div>
    </div>
  );
};
