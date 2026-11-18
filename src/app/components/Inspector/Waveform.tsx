import s from './Waveform.module.css';
import { useRef, useState } from 'react';
import type { KeyboardEvent, MouseEvent, PointerEvent } from 'react';

// A mark on the waveform (a review note): where it is, and where it ends for a range, 0 to 1.
export interface WaveformMark {
  id: string;
  start: number;
  end?: number;
  muted?: boolean;
}

interface Props {
  // Each slice's lowest and highest sample (-1 to 1).
  peaks: { min: number; max: number }[];
  // How much has played, 0 to 1.
  progress: number;
  onSeek: (fraction: number) => void;
  // Marks drawn over it; a range chosen on it (0 to 1).
  marks?: WaveformMark[];
  selection?: { start: number; end: number } | null;
  // Given, dragging across it chooses a range (a click still seeks).
  onSelect?: (start: number, end: number) => void;
}

const STEP = 0.02;
// How far (px) the pointer goes before a press is a drag, not a click.
const DRAG = 4;

const clamp = (value: number) => Math.min(1, Math.max(0, value));

// An audio file's waveform, what has played of it lit; a click (or the arrow keys) seeks, and
// with onSelect a drag chooses a range.
export function Waveform({ peaks, progress, onSeek, marks, selection, onSelect }: Props) {
  const press = useRef<{ x: number; from: number } | null>(null);
  const dragged = useRef(false);
  const [dragging, setDragging] = useState<{ start: number; end: number } | null>(null);

  const fractionAt = (target: Element, clientX: number) => {
    const box = target.getBoundingClientRect();
    return box.width > 0 ? clamp((clientX - box.left) / box.width) : null;
  };
  const seekAt = (event: MouseEvent<SVGSVGElement>) => {
    // The end of a drag isn't a click.
    if (dragged.current) { dragged.current = false; return; }
    const at = fractionAt(event.currentTarget, event.clientX);
    if (at !== null) onSeek(at);
  };
  const seekBy = (event: KeyboardEvent<SVGSVGElement>) => {
    const delta = event.key === 'ArrowRight' ? STEP : event.key === 'ArrowLeft' ? -STEP : 0;
    if (!delta) return;
    event.preventDefault();
    onSeek(clamp(progress + delta));
  };

  const down = (event: PointerEvent<SVGSVGElement>) => {
    if (!onSelect || event.button !== 0) return;
    const from = fractionAt(event.currentTarget, event.clientX);
    if (from === null) return;
    press.current = { x: event.clientX, from };
    dragged.current = false;
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    const start = press.current;
    if (!start) return;
    if (!dragged.current && Math.abs(event.clientX - start.x) < DRAG) return;
    dragged.current = true;
    const to = fractionAt(event.currentTarget, event.clientX) ?? start.from;
    setDragging({ start: Math.min(start.from, to), end: Math.max(start.from, to) });
  };
  const up = () => {
    const range = dragging;
    press.current = null;
    setDragging(null);
    if (range && onSelect && range.end > range.start) onSelect(range.start, range.end);
  };

  const width = Math.max(1, peaks.length);
  const bars = peaks.map((p, i) => {
    const top = 50 - Math.max(0.5, p.max * 50);
    const height = Math.max(1, (p.max - p.min) * 50);
    return <rect key={i} x={i} y={top} width={0.8} height={height} />;
  });
  const played = Math.round(progress * 1000) / 10;
  const chosen = dragging ?? selection ?? null;

  return (
    <svg
      className={s.waveform} viewBox={`0 0 ${width} 100`} preserveAspectRatio="none"
      role="slider" tabIndex={0} aria-label="Position" aria-valuemin={0} aria-valuemax={100} aria-valuenow={played}
      onClick={seekAt} onKeyDown={seekBy} onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up}
      data-testid="waveform"
    >
      <defs>
        <clipPath id="waveform-played"><rect x={0} y={0} width={progress * peaks.length} height={100} /></clipPath>
      </defs>
      {chosen && (
        <rect className={s.selection} x={chosen.start * width} y={0} width={(chosen.end - chosen.start) * width} height={100} data-testid="waveform-selection" />
      )}
      <g className={s.rest}>{bars}</g>
      <g className={s.played} clipPath="url(#waveform-played)">{bars}</g>
      {marks?.map(mark => (
        mark.end === undefined
          ? <rect key={mark.id} className={`${s.mark} ${mark.muted ? s.muted : ''}`} x={mark.start * width} y={0} width={width / 400} height={100} data-testid="waveform-mark" />
          : <rect key={mark.id} className={`${s.range} ${mark.muted ? s.muted : ''}`} x={mark.start * width} y={0} width={(mark.end - mark.start) * width} height={100} data-testid="waveform-mark" />
      ))}
    </svg>
  );
}
