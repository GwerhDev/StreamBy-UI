import { useLayoutEffect, useRef, useState } from 'react';
import s from './ClampedText.module.css';

interface ClampedTextProps {
  text: string;
  // How many lines show before it's cut.
  lines?: number;
  className?: string;
}

// A text cut to a few lines, with a toggle to read it whole -- the toggle only when the text
// is really cut (measured, as it's laid out), not for one that already fits.
export const ClampedText = ({ text, lines = 3, className = '' }: ClampedTextProps) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [cut, setCut] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || expanded) return;
    const measure = () => setCut(el.scrollHeight > el.clientHeight + 1);
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [text, lines, expanded]);

  return (
    <div className={`${s.container} ${className}`}>
      <p
        ref={ref}
        data-testid="clamped-text"
        className={`${s.text} ${expanded ? '' : s.clamped}`}
        style={{ WebkitLineClamp: expanded ? undefined : lines }}
      >
        {text}
      </p>
      {(cut || expanded) && (
        <button
          type="button"
          data-testid="clamped-text-toggle"
          className={s.toggle}
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};
