import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import currentReview, { annotationEventReceived } from '../../../store/currentReviewSlice';
import * as deliverables from '../../../services/deliverables';
import * as reviews from '../../../services/reviews';
import { Annotation, ReviewSession } from '../../../interfaces';
import { AudioReview } from './AudioReview';

// Decoding needs the Web Audio API, and the waveform a worker: here the mix "decodes" at once.
vi.mock('../../../utils/audioFile', () => ({
  decodeAudioFile: vi.fn(async () => ({ audio: { sampleRate: 48_000, channels: [] }, bitDepth: 24, format: 'audio/wav' })),
}));
vi.mock('../../../utils/measureAudioOffThread', () => ({
  measureAudioOffThread: vi.fn(async () => ({ measurements: {}, peaks: [{ min: -0.5, max: 0.6 }, { min: -0.9, max: 0.8 }] })),
}));

const SESSION = {
  id: 'r1', projectId: 'p1', assetId: 'a1', assetVersionId: 'v2', status: 'open', requiredApprovers: 1, approvals: [],
  createdAt: '', updatedAt: '',
} as ReviewSession;
const VERSIONS = [
  { versionId: 'v2', version: 2, fileName: 'mix-v2.wav', contentType: 'audio/wav', createdAt: '' },
  { versionId: 'v1', version: 1, fileName: 'mix-v1.wav', contentType: 'audio/wav', createdAt: '' },
];
const note = (fields: Partial<Annotation>): Annotation => ({
  id: 'n', assetId: 'a1', assetVersionId: 'v2', authorId: 'u1', authorUsername: 'ada', type: 'timecoded', text: '', resolved: false, createdAt: '', ...fields,
});

// jsdom has no media playback: an <audio> here keeps its time and says it's 120 s long.
beforeEach(() => {
  vi.restoreAllMocks();
  const times = new WeakMap<HTMLMediaElement, number>();
  Object.defineProperty(HTMLMediaElement.prototype, 'currentTime', { configurable: true, get() { return times.get(this) ?? 0; }, set(v: number) { times.set(this, v); } });
  Object.defineProperty(HTMLMediaElement.prototype, 'duration', { configurable: true, get: () => 120 });
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  vi.spyOn(globalThis, 'fetch').mockImplementation(async () => new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/wav' } }));
  let blobs = 0;
  URL.createObjectURL = vi.fn(() => `blob:mix-${++blobs}`);
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(deliverables, 'getAssetDownloadUrl').mockImplementation(async (_p, _a, versionId) => `https://signed.test/${versionId}.wav`);
});
afterEach(() => vi.restoreAllMocks());

const renderReview = (props: { canNote?: boolean; canMakeTasks?: boolean } = {}) => {
  const store = configureStore({
    reducer: { currentReview, apiResponses: (state = { responses: [] as unknown[] }) => state },
  });
  render(
    <Provider store={store}>
      <AudioReview projectId="p1" session={SESSION} versions={VERSIONS} canNote={props.canNote ?? true} canMakeTasks={props.canMakeTasks ?? true} />
    </Provider>,
  );
  return store;
};
const loaded = async () => {
  await screen.findByTestId('waveform');
  fireEvent.loadedMetadata(screen.getByTestId('audio-a'));
};

describe('AudioReview', () => {
  it("marks the version's notes on its waveform, listed in the file's order", async () => {
    vi.spyOn(reviews, 'getNotes').mockResolvedValue([
      note({ id: 'late', startSeconds: 90, endSeconds: 100, timecode: '1:30–1:40', text: 'Too much reverb' }),
      note({ id: 'early', startSeconds: 83, timecode: '1:23', text: 'The bass covers the vocal', resolved: true }),
    ]);
    renderReview();
    await loaded();
    const rows = await screen.findAllByTestId('review-note');
    expect(rows.map(r => r.textContent)).toEqual([
      expect.stringContaining('1:23The bass covers the vocal'),
      expect.stringContaining('1:30–1:40Too much reverb'),
    ]);
    expect(rows[0]).toHaveTextContent('resolved');
    expect(screen.getAllByTestId('waveform-mark')).toHaveLength(2);
    // Its time plays from there.
    await userEvent.click(within(rows[1]).getByText('1:30–1:40'));
    expect((screen.getByTestId('audio-a') as HTMLAudioElement).currentTime).toBe(90);
  });

  it('a note goes on the moment playing, or the range dragged across the waveform', async () => {
    vi.spyOn(reviews, 'getNotes').mockResolvedValue([]);
    const add = vi.spyOn(reviews, 'addTimedNote').mockImplementation(async (_p, _a, _v, n) => note({ id: `n${n.startSeconds}`, ...n, timecode: 'x' }));
    renderReview();
    await loaded();
    const a = screen.getByTestId('audio-a') as HTMLAudioElement;
    a.currentTime = 83.4;
    fireEvent.timeUpdate(a);
    expect(screen.getByTestId('note-time')).toHaveTextContent('Note at 1:23');
    await userEvent.type(screen.getByTestId('note-text'), 'The bass covers the vocal');
    await userEvent.click(screen.getByRole('button', { name: /add note/i }));
    expect(add).toHaveBeenLastCalledWith('p1', 'a1', 'v2', { startSeconds: 83.4, text: 'The bass covers the vocal' });

    const wave = screen.getByTestId('waveform');
    wave.getBoundingClientRect = () => ({ left: 0, width: 400, top: 0, height: 100, right: 400, bottom: 100, x: 0, y: 0, toJSON: () => ({}) });
    fireEvent.pointerDown(wave, { clientX: 100, button: 0, pointerId: 1 });
    fireEvent.pointerMove(wave, { clientX: 200, pointerId: 1 });
    fireEvent.pointerUp(wave, { clientX: 200, pointerId: 1 });
    expect(screen.getByTestId('note-time')).toHaveTextContent('Note at 0:30–1:00');
    await userEvent.type(screen.getByTestId('note-text'), 'Hiss');
    await userEvent.click(screen.getByRole('button', { name: /add note/i }));
    expect(add).toHaveBeenLastCalledWith('p1', 'a1', 'v2', { startSeconds: 30, endSeconds: 60, text: 'Hiss' });
    // Added, the range is let go.
    expect(screen.getByTestId('note-time')).toHaveTextContent('Note at 1:23');
  });

  it("makes a note a task of the asset's card; with several cards, of the one chosen", async () => {
    vi.spyOn(reviews, 'getNotes').mockResolvedValue([note({ id: 'n1', startSeconds: 83, timecode: '1:23', text: 'Bass' })]);
    const toTask = vi.spyOn(reviews, 'noteToTask')
      .mockResolvedValueOnce({ choose: [{ id: 'c1', key: 'POR-1', name: 'Mix' }, { id: 'c2', key: 'POR-2', name: 'Master' }] })
      .mockResolvedValueOnce({ annotation: note({ id: 'n1', startSeconds: 83, timecode: '1:23', text: 'Bass', taskId: 't1', shotId: 'c2' }) });
    renderReview();
    await loaded();
    await userEvent.click(await screen.findByTestId('note-task'));
    expect(screen.getByText('Several cards use this asset: which one?')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /POR-1 · Mix/ }));
    await userEvent.click(await screen.findByText('POR-2 · Master'));
    await userEvent.click(screen.getByRole('button', { name: 'Create task' }));
    expect(toTask).toHaveBeenLastCalledWith('p1', 'a1', 'v2', 'n1', 'c2');
    await waitFor(() => expect(screen.getByTestId('review-note')).toHaveTextContent('task created'));
    expect(screen.queryByTestId('note-task')).not.toBeInTheDocument();
  });

  it("reads the notes again when they change (an agent's, by MCP); only its version's", async () => {
    const get = vi.spyOn(reviews, 'getNotes').mockResolvedValue([]);
    const store = renderReview();
    await loaded();
    expect(get).toHaveBeenCalledTimes(1);
    get.mockResolvedValue([note({ id: 'agent', startSeconds: 12, timecode: '0:12', text: 'Clipping', authorUsername: 'mix-agent' })]);
    act(() => { store.dispatch(annotationEventReceived({ assetVersionId: 'v1' })); });
    expect(get).toHaveBeenCalledTimes(1);
    act(() => { store.dispatch(annotationEventReceived({ assetVersionId: 'v2' })); });
    expect(await screen.findByText('Clipping')).toBeInTheDocument();
    expect(screen.getByText('mix-agent')).toBeInTheDocument();
  });

  it('compares with another version at the same moment (A/B)', async () => {
    vi.spyOn(reviews, 'getNotes').mockResolvedValue([]);
    renderReview();
    await loaded();
    expect(screen.getByTestId('listen-b')).toBeDisabled();
    await userEvent.click(screen.getByRole('button', { name: 'No version' }));
    await userEvent.click(await screen.findByText('v1 · mix-v1.wav'));
    const b = await screen.findByTestId('audio-b') as HTMLAudioElement;
    // Downloaded and played from its bytes, as A, so it seeks whatever its server.
    expect(fetch).toHaveBeenLastCalledWith('https://signed.test/v1.wav');
    expect(b.getAttribute('src')).toMatch(/^blob:mix-/);
    const a = screen.getByTestId('audio-a') as HTMLAudioElement;
    a.currentTime = 42;
    await userEvent.click(screen.getByTestId('listen-b'));
    expect(b.currentTime).toBe(42);
    expect(screen.getByTestId('listen-b')).toHaveAttribute('aria-pressed', 'true');
    b.currentTime = 50;
    await userEvent.click(screen.getByTestId('listen-a'));
    expect(a.currentTime).toBe(50);
  });

  it('someone who can only look gets the notes, not the composer nor their actions', async () => {
    vi.spyOn(reviews, 'getNotes').mockResolvedValue([note({ id: 'n1', startSeconds: 83, timecode: '1:23', text: 'Bass' })]);
    renderReview({ canNote: false, canMakeTasks: false });
    await loaded();
    expect(await screen.findByText('Bass')).toBeInTheDocument();
    expect(screen.queryByTestId('note-text')).not.toBeInTheDocument();
    expect(screen.queryByTestId('note-task')).not.toBeInTheDocument();
    expect(screen.queryByTestId('note-resolve')).not.toBeInTheDocument();
  });
});
