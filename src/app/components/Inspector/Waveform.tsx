import s from './Waveform.module.css';
import type { KeyboardEvent, MouseEvent } from 'react';

interface Props {
  // Each slice's lowest and highest sample (-1 to 1).
  peaks: { min: number; max: number }[];
  // How much has played, 0 to 1.
  progress: number;
  onSeek: (fraction: number) => void;
}

const STEP = 0.02;

// An audio file's waveform, what has played of it lit; a click (or the arrow keys) seeks.
export function Waveform({ peaks, progress, onSeek }: Props) {
  const seekAt = (event: MouseEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    if (box.width > 0) onSeek(Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)));
  };
  const seekBy = (event: KeyboardEvent<SVGSVGElement>) => {
    const delta = event.key === 'ArrowRight' ? STEP : event.key === 'ArrowLeft' ? -STEP : 0;
    if (!delta) return;
    event.preventDefault();
    onSeek(Math.min(1, Math.max(0, progress + delta)));
  };
  const bars = peaks.map((p, i) => {
    const top = 50 - Math.max(0.5, p.max * 50);
    const height = Math.max(1, (p.max - p.min) * 50);
    return <rect key={i} x={i} y={top} width={0.8} height={height} />;
  });
  const played = Math.round(progress * 1000) / 10;

  return (
    <svg
      className={s.waveform} viewBox={`0 0 ${Math.max(1, peaks.length)} 100`} preserveAspectRatio="none"
      role="slider" tabIndex={0} aria-label="Position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={played}
      onClick={seekAt} onKeyDown={seekBy} data-testid="waveform"
    >
      <defs>
        <clipPath id="waveform-played"><rect x={0} y={0} width={progress * peaks.length} height={100} /></clipPath>
      </defs>
      <g className={s.rest}>{bars}</g>
      <g className={s.played} clipPath="url(#waveform-played)">{bars}</g>
    </svg>
  );
}
