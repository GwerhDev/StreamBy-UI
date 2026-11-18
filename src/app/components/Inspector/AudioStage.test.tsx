import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AudioStage } from './AudioStage';
import { Waveform } from './Waveform';

const PEAKS = [{ min: -0.5, max: 0.5 }, { min: -0.9, max: 0.8 }, { min: -0.1, max: 0.2 }, { min: -0.3, max: 0.3 }];

describe('Waveform', () => {
  it('draws each slice, lit as far as it has played', () => {
    render(<Waveform peaks={PEAKS} progress={0.5} onSeek={vi.fn()} />);
    const wave = screen.getByTestId('waveform');
    expect(wave).toHaveAttribute('aria-valuenow', '50');
    // Each slice twice: under, and lit over it.
    expect(wave.querySelectorAll('g rect')).toHaveLength(PEAKS.length * 2);
  });

  it('seeks where it is clicked, and by the arrow keys', () => {
    const onSeek = vi.fn();
    render(<Waveform peaks={PEAKS} progress={0.5} onSeek={onSeek} />);
    const wave = screen.getByTestId('waveform');
    wave.getBoundingClientRect = () => ({ left: 100, width: 400, top: 0, height: 100, right: 500, bottom: 100, x: 100, y: 0, toJSON: () => ({}) });
    fireEvent.click(wave, { clientX: 200 });
    expect(onSeek).toHaveBeenLastCalledWith(0.25);
    fireEvent.keyDown(wave, { key: 'ArrowRight' });
    expect(onSeek).toHaveBeenLastCalledWith(0.52);
    fireEvent.keyDown(wave, { key: 'ArrowLeft' });
    expect(onSeek).toHaveBeenLastCalledWith(0.48);
  });
});

describe('Waveform with review notes', () => {
  const box = { left: 0, width: 400, top: 0, height: 100, right: 400, bottom: 100, x: 0, y: 0, toJSON: () => ({}) };

  it('marks an instant as a line and a range as a band; nothing without marks', () => {
    const { rerender } = render(<Waveform peaks={PEAKS} progress={0} onSeek={vi.fn()} />);
    expect(screen.queryAllByTestId('waveform-mark')).toHaveLength(0);
    rerender(<Waveform peaks={PEAKS} progress={0} onSeek={vi.fn()} marks={[{ id: 'n1', start: 0.25 }, { id: 'n2', start: 0.5, end: 0.75 }]} />);
    const [instant, range] = screen.getAllByTestId('waveform-mark');
    expect(instant).toHaveAttribute('x', '1');
    expect(range).toHaveAttribute('x', '2');
    expect(range).toHaveAttribute('width', '1');
  });

  it('a drag across it chooses a range (not a seek); a click still seeks', () => {
    const onSeek = vi.fn();
    const onSelect = vi.fn();
    render(<Waveform peaks={PEAKS} progress={0} onSeek={onSeek} onSelect={onSelect} />);
    const wave = screen.getByTestId('waveform');
    wave.getBoundingClientRect = () => box;
    fireEvent.pointerDown(wave, { clientX: 300, button: 0, pointerId: 1 });
    fireEvent.pointerMove(wave, { clientX: 100, pointerId: 1 });
    expect(screen.getByTestId('waveform-selection')).toBeInTheDocument();
    fireEvent.pointerUp(wave, { clientX: 100, pointerId: 1 });
    fireEvent.click(wave, { clientX: 100 });
    expect(onSelect).toHaveBeenCalledWith(0.25, 0.75);
    expect(onSeek).not.toHaveBeenCalled();
    // A press that doesn't move is a click.
    fireEvent.pointerDown(wave, { clientX: 200, button: 0, pointerId: 1 });
    fireEvent.pointerUp(wave, { clientX: 201, pointerId: 1 });
    fireEvent.click(wave, { clientX: 200 });
    expect(onSeek).toHaveBeenCalledWith(0.5);
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});

describe('AudioStage', () => {
  it('shows a spinner until its waveform is worked out', () => {
    render(<AudioStage url="blob:theme" peaks={null} />);
    expect(screen.getByTestId('waveform-loading')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toHaveAttribute('src', 'blob:theme');
  });

  it('plays and pauses the file', () => {
    render(<AudioStage url="blob:theme" peaks={PEAKS} />);
    const player = screen.getByTestId('audio-player') as HTMLAudioElement;
    const play = vi.spyOn(player, 'play').mockResolvedValue();
    fireEvent.click(screen.getByTestId('audio-play'));
    expect(play).toHaveBeenCalled();
    fireEvent.play(player);
    expect(screen.getByTestId('audio-play')).toHaveAttribute('aria-label', 'Pause');
    fireEvent.pause(player);
    expect(screen.getByTestId('audio-play')).toHaveAttribute('aria-label', 'Play');
  });
});
