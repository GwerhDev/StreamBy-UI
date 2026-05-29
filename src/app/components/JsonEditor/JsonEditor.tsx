import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import s from './JsonEditor.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faCompress,
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';
import { loadEditorPrefs, saveEditorPrefs } from '../../../utils/editorPrefs';

// ─── Syntax Highlighter ────────────────────────────────────────────────────

const C = {
  key:     '#9cdcfe',
  string:  '#ce9178',
  number:  '#b5cea8',
  keyword: '#569cd6',
  brace:   '#c8c8c8',
  sep:     '#606060',
};

function highlight(raw: string): string {
  const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]])|([,])/g;
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  let out = '', last = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN.exec(raw)) !== null) {
    if (m.index > last) out += esc(raw.slice(last, m.index));
    const [, str, colon, kw, num, brace, comma] = m;
    if      (str !== undefined && colon) out += `<span style="color:${C.key}">${esc(str)}</span><span style="color:${C.sep}">${esc(colon)}</span>`;
    else if (str !== undefined)          out += `<span style="color:${C.string}">${esc(str)}</span>`;
    else if (kw  !== undefined)          out += `<span style="color:${C.keyword}">${kw}</span>`;
    else if (num !== undefined)          out += `<span style="color:${C.number}">${num}</span>`;
    else if (brace !== undefined)        out += `<span style="color:${C.brace}">${esc(brace)}</span>`;
    else if (comma !== undefined)        out += `<span style="color:${C.sep}">${comma}</span>`;
    else                                 out += esc(m[0]);
    last = TOKEN.lastIndex;
  }
  if (last < raw.length) out += esc(raw.slice(last));
  return out;
}

// ─── Parse helper ─────────────────────────────────────────────────────────

function parseJson(text: string): { data: object | null; isValid: boolean; error: string | null } {
  if (!text.trim()) return { data: null, isValid: false, error: null };
  try   { return { data: JSON.parse(text), isValid: true, error: null }; }
  catch (e) { return { data: null, isValid: false, error: (e as Error).message }; }
}

// ─── JsonEditor ────────────────────────────────────────────────────────────

interface JsonEditorProps {
  value: string;
  onChange: (jsonString: string, data: object | null, isValid: boolean) => void;
  jsonError?: string | null;
  className?: string;
  readOnly?: boolean;
  userId?: string;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({
  value, onChange, jsonError, className, readOnly = false, userId,
}) => {
  const textareaRef    = useRef<HTMLTextAreaElement>(null);
  const highlightRef   = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const pendingCursor  = useRef<number | null>(null);
  const measureCtx     = useRef<CanvasRenderingContext2D | null>(null);

  const [wordWrap,     setWordWrapRaw] = useState(false);
  const [innerWidth,   setInnerWidth]  = useState(0);
  const [lineHeightPx, setLineHeightPx] = useState(20.16);
  const [prefsLoaded,  setPrefsLoaded] = useState(false);

  // Load preferences from IndexedDB on mount
  useEffect(() => {
    if (!userId) { setPrefsLoaded(true); return; }
    loadEditorPrefs(userId).then(prefs => {
      if (prefs.wordWrap !== undefined) setWordWrapRaw(prefs.wordWrap);
      setPrefsLoaded(true);
    });
  }, [userId]);

  // Persist word wrap preference (only after initial load to avoid overwriting with default)
  const setWordWrap = useCallback((v: boolean) => {
    setWordWrapRaw(v);
    if (userId && prefsLoaded) saveEditorPrefs(userId, { wordWrap: v });
  }, [userId, prefsLoaded]);

  // Measure textarea metrics (font, inner width, line height) via ResizeObserver
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const measure = () => {
      const cs   = getComputedStyle(ta);
      const padH = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      setInnerWidth(ta.clientWidth - padH);
      const lh = parseFloat(cs.lineHeight);
      if (!isNaN(lh)) setLineHeightPx(lh);
      if (!measureCtx.current) {
        measureCtx.current = document.createElement('canvas').getContext('2d');
      }
      if (measureCtx.current) measureCtx.current.font = cs.font;
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ta);
    return () => ro.disconnect();
  }, []);

  // Restore cursor after Tab key causes a controlled value update
  useEffect(() => {
    if (pendingCursor.current !== null && textareaRef.current) {
      textareaRef.current.selectionStart = pendingCursor.current;
      textareaRef.current.selectionEnd   = pendingCursor.current;
      pendingCursor.current = null;
    }
  });

  const { data, isValid, error: parseError } = useMemo(() => parseJson(value), [value]);
  const highlighted = useMemo(() => highlight(value), [value]);
  const lines       = useMemo(() => value.split('\n'), [value]);

  // Compute visual rows per logical line for wrap mode alignment
  const lineVisualRows = useMemo(() => {
    if (!wordWrap || innerWidth <= 0 || !measureCtx.current) return null;
    const ctx = measureCtx.current;
    return lines.map(line => {
      if (!line) return 1;
      const w = ctx.measureText(line).width;
      return Math.max(1, Math.ceil(w / innerWidth));
    });
  }, [wordWrap, innerWidth, lines]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const { data: d, isValid: v } = parseJson(text);
    onChange(text, d, v);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart, end = ta.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      pendingCursor.current = start + 2;
      const { data: d, isValid: v } = parseJson(next);
      onChange(next, d, v);
    }
  }, [value, onChange]);

  const handleScroll = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    if (highlightRef.current) {
      highlightRef.current.scrollTop  = ta.scrollTop;
      highlightRef.current.scrollLeft = ta.scrollLeft;
    }
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = ta.scrollTop;
    }
  }, []);

  const handleFormat = useCallback(() => {
    if (!data) return;
    onChange(JSON.stringify(data, null, 2), data, true);
  }, [data, onChange]);

  const handleMinify = useCallback(() => {
    if (!data) return;
    onChange(JSON.stringify(data), data, true);
  }, [data, onChange]);

  const displayError = parseError || jsonError;
  const showError    = !isValid && value.trim() && displayError;

  const textClass = `${s.textarea} ${wordWrap ? s.wrapMode : ''}`;
  const hlClass   = `${s.highlightLayer} ${wordWrap ? s.wrapMode : ''}`;

  return (
    <div className={`${s.container}${className ? ` ${className}` : ''}`}>
      {/* ── Toolbar ── */}
      <div className={s.toolbar}>
        <div className={s.toolbarActions}>
          {!readOnly && (
            <>
              <button type="button" className={s.toolbarBtn} onClick={handleFormat} disabled={!isValid} title="Format JSON">
                <FontAwesomeIcon icon={faWandMagicSparkles} /> Format
              </button>
              <button type="button" className={s.toolbarBtn} onClick={handleMinify} disabled={!isValid} title="Minify JSON">
                <FontAwesomeIcon icon={faCompress} /> Minify
              </button>
              <span className={s.toolbarDivider} />
            </>
          )}
          <label className={s.wrapToggle} title="Toggle word wrap">
            <input
              type="checkbox"
              checked={wordWrap}
              onChange={e => setWordWrap(e.target.checked)}
              className={s.wrapCheckbox}
            />
            Wrap
          </label>
        </div>

        <div className={s.toolbarStatus}>
          {isValid && !jsonError && (
            <span className={s.statusValid}><FontAwesomeIcon icon={faCheck} /> Valid JSON</span>
          )}
          {showError && (
            <span className={s.statusError} title={String(displayError)}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {String(displayError).length > 55 ? String(displayError).slice(0, 52) + '…' : String(displayError)}
            </span>
          )}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className={s.editorBody}>
        {/* Line numbers */}
        <div ref={lineNumbersRef} className={s.lineNumbers} aria-hidden>
          {lines.map((_, i) => {
            const rows = lineVisualRows ? (lineVisualRows[i] ?? 1) : 1;
            return (
              <div
                key={i}
                className={s.lineNumGroup}
                style={rows > 1 ? { height: `${rows * lineHeightPx}px` } : undefined}
              >
                <span className={s.lineNum}>{i + 1}</span>
              </div>
            );
          })}
        </div>

        {/* Overlay area */}
        <div className={`${s.editorArea} ${showError ? s.editorAreaError : ''}`}>
          <div
            ref={highlightRef}
            className={hlClass}
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
            aria-hidden
          />
          <textarea
            ref={textareaRef}
            className={textClass}
            value={value}
            onChange={readOnly ? undefined : handleChange}
            onKeyDown={readOnly ? undefined : handleKeyDown}
            onScroll={handleScroll}
            readOnly={readOnly}
            spellCheck={false}
            autoCapitalize="none"
            autoComplete="off"
            autoCorrect="off"
            placeholder={'{\n  "key": "value"\n}'}
          />
        </div>
      </div>
    </div>
  );
};

export default JsonEditor;
