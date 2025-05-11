import { useEffect, useRef, useState } from 'react';
import s from './CustomCanvas.module.css';

export const CustomCanvas = (props: any) => {
  const { children, showCanvas, setShowCanvas } = props;
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

  return (
    <>
      {
        showCanvas &&
        <div className={s.container} ref={containerRef}>
          <div className={s.canvas}>
            {children}
          </div>
        </div>
      }
    </>
  )
}
