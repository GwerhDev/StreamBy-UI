import s from './AudioReview.module.css';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faListCheck, faPause, faPlay, faPlus, faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { Annotation, ReviewSession } from '../../../interfaces';
import { AssetVersionSummary } from '../../../services/assetMeasurements';
import { getAssetDownloadUrl } from '../../../services/deliverables';
import { addTimedNote, CardChoice, getNotes, noteToTask, resolveNote } from '../../../services/reviews';
import { decodeAudioFile } from '../../../utils/audioFile';
import { measureAudioOffThread } from '../../../utils/measureAudioOffThread';
import { Waveform, WaveformMark } from '../Inspector/Waveform';
import { DropdownInput } from '../Inputs/DropdownInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';

interface Props {
  projectId: string;
  session: ReviewSession;
  // The asset's versions, newest first: the one reviewed is session.assetVersionId.
  versions: AssetVersionSummary[];
  canNote: boolean;
  canMakeTasks: boolean;
}

const clock = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  const h = Math.floor(whole / 3600);
  const m = Math.floor((whole % 3600) / 60);
  const sec = String(whole % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`;
};
const timeOf = (note: Annotation) =>
  note.timecode ?? (note.endSeconds === undefined ? clock(note.startSeconds ?? 0) : `${clock(note.startSeconds ?? 0)}–${clock(note.endSeconds)}`);
const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);
const versionLabel = (v: AssetVersionSummary) => `v${v.version}${v.fileName ? ` · ${v.fileName}` : ''}`;

// An audio version reviewed on its waveform: its notes marked on it, on an instant or a range
// (dragged across it); compared with another version (A/B) at the same moment; a note made a
// task of the asset's card. The notes are the reviewed version's (A).
export function AudioReview({ projectId, session, versions, canNote, canMakeTasks }: Props) {
  const dispatch = useDispatch<AppDispatch>();
  const fail = useCallback((err: unknown, fallback: string) => dispatch(addApiResponse({ message: errorText(err, fallback), type: 'error' })), [dispatch]);
  const { assetId, assetVersionId } = session;

  const a = useRef<HTMLAudioElement>(null);
  const b = useRef<HTMLAudioElement>(null);
  const [urlA, setUrlA] = useState<string | null>(null);
  const [peaks, setPeaks] = useState<{ min: number; max: number }[] | null>(null);
  const [compareId, setCompareId] = useState('');
  const [urlB, setUrlB] = useState<string | null>(null);
  const [listening, setListening] = useState<'A' | 'B'>('A');
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loadFailed, setLoadFailed] = useState<string | null>(null);

  const [notes, setNotes] = useState<Annotation[]>([]);
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [text, setText] = useState('');
  const [adding, setAdding] = useState(false);
  const [busyNote, setBusyNote] = useState<string | null>(null);
  const [choosing, setChoosing] = useState<{ noteId: string; cards: CardChoice[]; shotId: string } | null>(null);

  const active = () => (listening === 'A' ? a.current : b.current);

  // The version reviewed: its bytes downloaded once (played from them) and its waveform.
  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setPeaks(null);
    setLoadFailed(null);
    (async () => {
      try {
        const res = await fetch(await getAssetDownloadUrl(projectId, assetId, assetVersionId));
        if (!res.ok) throw new Error("Couldn't download the audio file");
        const bytes = await res.arrayBuffer();
        if (cancelled) return;
        const contentType = res.headers.get('content-type');
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: contentType ?? 'audio/*' }));
        setUrlA(objectUrl);
        const result = await measureAudioOffThread(await decodeAudioFile(bytes, contentType));
        if (!cancelled) setPeaks(result.peaks);
      } catch (err) {
        if (!cancelled) setLoadFailed(errorText(err, "Couldn't read the audio file"));
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
      setUrlA(null);
    };
  }, [projectId, assetId, assetVersionId]);

  // The version it's compared with: its bytes downloaded too (it isn't drawn), so it seeks to
  // A's moment whatever the server it comes from (one that doesn't serve ranges can't seek).
  useEffect(() => {
    setUrlB(null);
    if (!compareId) { setListening('A'); return; }
    let cancelled = false;
    let objectUrl: string | null = null;
    (async () => {
      try {
        const res = await fetch(await getAssetDownloadUrl(projectId, assetId, compareId));
        if (!res.ok) throw new Error("Couldn't download the version to compare");
        const bytes = await res.arrayBuffer();
        if (cancelled) return;
        objectUrl = URL.createObjectURL(new Blob([bytes], { type: res.headers.get('content-type') ?? 'audio/*' }));
        setUrlB(objectUrl);
      } catch (err) {
        if (!cancelled) { fail(err, "Couldn't load the version to compare"); setCompareId(''); }
      }
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [projectId, assetId, compareId, fail]);

  // Its notes: read now, and again whenever they change (someone's, an agent's by MCP).
  const notesChanged = useSelector((state: RootState) => state.currentReview.notesChanged);
  const loadNotes = useCallback(() => {
    getNotes(projectId, assetId, assetVersionId).then(setNotes).catch(err => fail(err, "Couldn't load the notes"));
  }, [projectId, assetId, assetVersionId, fail]);
  useEffect(() => { loadNotes(); }, [loadNotes]);
  useEffect(() => {
    if (notesChanged?.assetVersionId === assetVersionId) loadNotes();
  }, [notesChanged, assetVersionId, loadNotes]);

  const sorted = useMemo(
    () => [...notes].filter(n => typeof n.startSeconds === 'number').sort((x, y) => (x.startSeconds! - y.startSeconds!)),
    [notes],
  );
  const marks: WaveformMark[] = duration
    ? sorted.map(n => ({ id: n.id, start: n.startSeconds! / duration, end: n.endSeconds === undefined ? undefined : n.endSeconds / duration, muted: n.resolved }))
    : [];

  // ── Playing ──
  const toggle = () => {
    const el = active();
    if (!el) return;
    if (el.paused) void el.play();
    else el.pause();
  };
  const seekTo = (seconds: number) => {
    const el = active();
    if (!el) return;
    el.currentTime = Math.max(0, seconds);
    setTime(el.currentTime);
  };
  // A and B at the same moment: the one heard now hands over where it is.
  const listen = (to: 'A' | 'B') => {
    if (to === listening || (to === 'B' && !urlB)) return;
    const from = active();
    const next = to === 'A' ? a.current : b.current;
    if (!from || !next) return;
    const wasPlaying = !from.paused;
    next.currentTime = Math.min(from.currentTime, Number.isFinite(next.duration) ? next.duration : from.currentTime);
    from.pause();
    setListening(to);
    setTime(next.currentTime);
    if (Number.isFinite(next.duration)) setDuration(next.duration);
    if (wasPlaying) void next.play();
  };
  const audioEvents = (which: 'A' | 'B') => ({
    onPlay: () => { if (listening === which) setPlaying(true); },
    onPause: () => { if (listening === which) setPlaying(false); },
    onEnded: () => { if (listening === which) setPlaying(false); },
    onTimeUpdate: (e: SyntheticEvent<HTMLAudioElement>) => { if (listening === which) setTime(e.currentTarget.currentTime); },
    onLoadedMetadata: (e: SyntheticEvent<HTMLAudioElement>) => { if (listening === which) setDuration(e.currentTarget.duration); },
  });

  // ── Notes ──
  const noteTime = selection && duration
    ? { startSeconds: selection.start * duration, endSeconds: selection.end * duration }
    : { startSeconds: time };
  const add = async () => {
    if (!text.trim()) return;
    setAdding(true);
    try {
      const note = await addTimedNote(projectId, assetId, assetVersionId, { ...noteTime, text: text.trim() });
      setNotes(list => (list.some(n => n.id === note.id) ? list : [...list, note]));
      setText('');
      setSelection(null);
    } catch (err) {
      fail(err, "Couldn't add the note");
    } finally {
      setAdding(false);
    }
  };
  const resolve = async (note: Annotation) => {
    setBusyNote(note.id);
    try {
      await resolveNote(projectId, assetId, assetVersionId, note.id);
      setNotes(list => list.map(n => (n.id === note.id ? { ...n, resolved: true } : n)));
    } catch (err) {
      fail(err, "Couldn't resolve the note");
    } finally {
      setBusyNote(null);
    }
  };
  const makeTask = async (noteId: string, shotId?: string) => {
    setBusyNote(noteId);
    try {
      const result = await noteToTask(projectId, assetId, assetVersionId, noteId, shotId);
      if ('choose' in result) {
        setChoosing({ noteId, cards: result.choose, shotId: result.choose[0]?.id ?? '' });
      } else {
        setChoosing(null);
        setNotes(list => list.map(n => (n.id === noteId ? { ...n, ...result.annotation } : n)));
        dispatch(addApiResponse({ message: 'Task created on the card', type: 'success' }));
      }
    } catch (err) {
      fail(err, "Couldn't make it a task");
    } finally {
      setBusyNote(null);
    }
  };

  const others = versions.filter(v => v.versionId !== assetVersionId);
  const reviewed = versions.find(v => v.versionId === assetVersionId);

  return (
    <div className={s.review} data-testid="audio-review">
      <audio ref={a} src={urlA ?? undefined} preload="auto" {...audioEvents('A')} data-testid="audio-a" />
      {urlB && <audio ref={b} src={urlB} preload="auto" {...audioEvents('B')} data-testid="audio-b" />}

      <div className={s.stage}>
        <div className={s.wave}>
          {peaks ? (
            <Waveform
              peaks={peaks} progress={duration ? time / duration : 0}
              onSeek={fraction => seekTo(fraction * duration)}
              marks={marks} selection={selection}
              onSelect={canNote ? (start, end) => setSelection({ start, end }) : undefined}
            />
          ) : loadFailed ? (
            <p className={s.failed}>{loadFailed}</p>
          ) : (
            <span className={s.waiting} aria-label="Loading"><FontAwesomeIcon icon={faSpinner} spin /></span>
          )}
        </div>
        <div className={s.controls}>
          <button type="button" className={s.play} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'} data-testid="review-play">
            <FontAwesomeIcon icon={playing ? faPause : faPlay} />
          </button>
          <span className={s.time}>{clock(time)} / {clock(duration)}</span>
          {others.length > 0 && (
            <div className={s.compare}>
              <span className={s.compareLabel}>Compare with</span>
              <div className={s.compareSelect}>
                <DropdownInput
                  value={compareId} onChange={setCompareId} placeholder="No version"
                  options={[{ value: '', label: 'No version' }, ...others.map(v => ({ value: v.versionId, label: versionLabel(v) }))]}
                />
              </div>
              <div className={s.ab} role="group" aria-label="Listen to">
                <button type="button" className={listening === 'A' ? s.abOn : ''} onClick={() => listen('A')} aria-pressed={listening === 'A'} data-testid="listen-a">
                  A{reviewed ? ` · v${reviewed.version}` : ''}
                </button>
                <button type="button" className={listening === 'B' ? s.abOn : ''} onClick={() => listen('B')} aria-pressed={listening === 'B'} disabled={!urlB} data-testid="listen-b">
                  B{compareId ? ` · v${others.find(v => v.versionId === compareId)?.version ?? ''}` : ''}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {canNote && (
        <div className={s.composer}>
          <div className={s.composerHead}>
            <span className={s.at} data-testid="note-time">
              Note at {noteTime.endSeconds === undefined ? clock(noteTime.startSeconds) : `${clock(noteTime.startSeconds)}–${clock(noteTime.endSeconds)}`}
            </span>
            {selection && (
              <button type="button" className={s.clear} onClick={() => setSelection(null)} aria-label="Clear the range">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
            <span className={s.hint}>Drag across the waveform to note a range.</span>
          </div>
          <textarea
            className={s.input} rows={2} value={text} onChange={e => setText(e.target.value)}
            placeholder="The bass covers the vocal…" data-testid="note-text"
          />
          <div className={s.composerActions}>
            <ActionButton text="Add note" icon={faPlus} onClick={add} disabled={!text.trim() || adding} isLoading={adding} />
          </div>
        </div>
      )}

      <ul className={s.notes} data-testid="review-notes">
        {sorted.length === 0 && <li className={s.empty}>No notes on this version yet.</li>}
        {sorted.map(note => (
          <li key={note.id} className={`${s.note} ${note.resolved ? s.resolved : ''}`} data-testid="review-note">
            <button type="button" className={s.noteTime} onClick={() => seekTo(note.startSeconds!)} title="Play from here">
              {timeOf(note)}
            </button>
            <div className={s.noteBody}>
              <p className={s.noteText}>{note.text}</p>
              <span className={s.noteMeta}>
                {note.authorUsername}
                {note.resolved && ' · resolved'}
                {note.taskId && ' · task created'}
              </span>
              {choosing?.noteId === note.id && (
                <div className={s.choose}>
                  <span className={s.chooseLabel}>Several cards use this asset: which one?</span>
                  <DropdownInput
                    value={choosing.shotId} onChange={shotId => setChoosing({ ...choosing, shotId })}
                    options={choosing.cards.map(c => ({ value: c.id, label: c.key ? `${c.key} · ${c.name}` : c.name }))}
                  />
                  <div className={s.chooseActions}>
                    <SecondaryButton text="Cancel" onClick={() => setChoosing(null)} />
                    <ActionButton text="Create task" onClick={() => makeTask(note.id, choosing.shotId)} disabled={!choosing.shotId || busyNote === note.id} />
                  </div>
                </div>
              )}
            </div>
            <div className={s.noteActions}>
              {canMakeTasks && !note.taskId && choosing?.noteId !== note.id && (
                <button type="button" className={s.noteAction} onClick={() => makeTask(note.id)} disabled={busyNote === note.id} title="Make it a task of the asset's card" data-testid="note-task">
                  <FontAwesomeIcon icon={faListCheck} />
                </button>
              )}
              {canNote && !note.resolved && (
                <button type="button" className={s.noteAction} onClick={() => resolve(note)} disabled={busyNote === note.id} title="Resolve" data-testid="note-resolve">
                  <FontAwesomeIcon icon={faCheck} />
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
