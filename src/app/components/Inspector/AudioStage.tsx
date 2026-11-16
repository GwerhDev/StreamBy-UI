import s from './AudioStage.module.css';
import { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPause, faPlay, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { Waveform } from './Waveform';

interface Props {
  // The file to play (its bytes, already here).
  url: string;
  // Its waveform; null while it's worked out.
  peaks: { min: number; max: number }[] | null;
}

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  return `${m}:${String(Math.floor(seconds - m * 60)).padStart(2, '0')}`;
};

// An audio file in the inspector: its waveform, to play it and seek in it.
export function AudioStage({ url, peaks }: Props) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => { setPlaying(false); setTime(0); }, [url]);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };
  const seek = (fraction: number) => {
    const el = audio.current;
    if (!el || !duration) return;
    el.currentTime = fraction * duration;
    setTime(el.currentTime);
  };

  return (
    <div className={s.stage} data-testid="audio-stage">
      <audio
        ref={audio} src={url} preload="auto"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} onEnded={() => setPlaying(false)}
        onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={e => setDuration(e.currentTarget.duration)}
        data-testid="audio-player"
      />
      <div className={s.wave}>
        {peaks ? (
          <Waveform peaks={peaks} progress={duration ? time / duration : 0} onSeek={seek} />
        ) : (
          <span className={s.waiting} data-testid="waveform-loading" aria-label="Loading"><FontAwesomeIcon icon={faSpinner} spin /></span>
        )}
      </div>
      <div className={s.controls}>
        <button type="button" className={s.play} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} data-testid="audio-play">
          <FontAwesomeIcon icon={playing ? faPause : faPlay} />
        </button>
        <span className={s.time}>{clock(time)} / {clock(duration)}</span>
      </div>
    </div>
  );
}
