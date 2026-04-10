import React, { useRef, useCallback, useMemo } from 'react';
import s from './JsonEditor.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faWandMagicSparkles,
  faCompress,
  faCheck,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons';

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
  // Tokens: key-string (string followed by :), string value, keyword, number, brace, comma/colon
  const TOKEN = /("(?:[^"\\]|\\.)*")(\s*:)?|(\btrue\b|\bfalse\b|\bnull\b)|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|([{}[\]])|([,])/g;

  const esc = (t: string) =>
    t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  let out = '';
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = TOKEN.exec(raw)) !== null) {
    if (m.index > last) out += esc(raw.slice(last, m.index));

    const [, str, colon, kw, num, brace, comma] = m;

    if (str !== undefined && colon) {
      out += `<span style="color:${C.key}">${esc(str)}</span><span style="color:${C.sep}">${esc(colon)}</span>`;
    } else if (str !== undefined) {
      out += `<span style="color:${C.string}">${esc(str)}</span>`;
    } else if (kw !== undefined) {
      out += `<span style="color:${C.keyword}">${kw}</span>`;
    } else if (num !== undefined) {
      out += `<span style="color:${C.number}">${num}</span>`;
    } else if (brace !== undefined) {
      out += `<span style="color:${C.brace}">${esc(brace)}</span>`;
    } else if (comma !== undefined) {
      out += `<span style="color:${C.sep}">${comma}</span>`;
    } else {
      out += esc(m[0]);
    }

    last = TOKEN.lastIndex;
  }

  if (last < raw.length) out += esc(raw.slice(last));
  return out;
}

// ─── Parse helper ─────────────────────────────────────────────────────────

function parseJson(text: string): { data: object | null; isValid: boolean; error: string | null } {
  if (!text.trim()) return { data: null, isValid: false, error: null };
  try {
    return { data: JSON.parse(text), isValid: true, error: null };
  } catch (e) {
    return { data: null, isValid: false, error: (e as Error).message };
  }
}

// ─── JsonEditor ────────────────────────────────────────────────────────────

interface JsonEditorProps {
  value: string;
  onChange: (jsonString: string, data: object | null, isValid: boolean) => void;
  jsonError?: string | null;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange, jsonError }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const pendingCursor = useRef<number | null>(null);

  // Restore cursor after Tab key causes a controlled value update
  React.useEffect(() => {
    if (pendingCursor.current !== null && textareaRef.current) {
      textareaRef.current.selectionStart = pendingCursor.current;
      textareaRef.current.selectionEnd = pendingCursor.current;
      pendingCursor.current = null;
    }
  });

  const { data, isValid, error: parseError } = useMemo(() => parseJson(value), [value]);

  const highlighted = useMemo(() => highlight(value), [value]);

  const lineCount = useMemo(() => (value.match(/\n/g) || []).length + 1, [value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const { data: d, isValid: v } = parseJson(text);
    onChange(text, d, v);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const next = value.substring(0, start) + '  ' + value.substring(end);
      pendingCursor.current = start + 2;
      const { data: d, isValid: v } = parseJson(next);
      onChange(next, d, v);
    }
  }, [value, onChange]);

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleFormat = useCallback(() => {
    if (!data) return;
    const formatted = JSON.stringify(data, null, 2);
    onChange(formatted, data, true);
  }, [data, onChange]);

  const handleMinify = useCallback(() => {
    if (!data) return;
    const minified = JSON.stringify(data);
    onChange(minified, data, true);
  }, [data, onChange]);

  const displayError = parseError || jsonError;
  const showError = !isValid && value.trim() && displayError;

  return (
    <div className={s.container}>
      {/* ── Toolbar ── */}
      <div className={s.toolbar}>
        <div className={s.toolbarActions}>
          <button
            type="button"
            className={s.toolbarBtn}
            onClick={handleFormat}
            disabled={!isValid}
            title="Format JSON"
          >
            <FontAwesomeIcon icon={faWandMagicSparkles} />
            Format
          </button>
          <button
            type="button"
            className={s.toolbarBtn}
            onClick={handleMinify}
            disabled={!isValid}
            title="Minify JSON"
          >
            <FontAwesomeIcon icon={faCompress} />
            Minify
          </button>
        </div>

        <div className={s.toolbarStatus}>
          {isValid && !jsonError && (
            <span className={s.statusValid}>
              <FontAwesomeIcon icon={faCheck} />
              Valid JSON
            </span>
          )}
          {showError && (
            <span className={s.statusError} title={String(displayError)}>
              <FontAwesomeIcon icon={faTriangleExclamation} />
              {String(displayError).length > 55
                ? String(displayError).slice(0, 52) + '…'
                : String(displayError)}
            </span>
          )}
        </div>
      </div>

      {/* ── Editor ── */}
      <div className={s.editorBody}>
        {/* Line numbers */}
        <div className={s.lineNumbers} aria-hidden>
          {Array.from({ length: lineCount }, (_, i) => (
            <div key={i} className={s.lineNum}>{i + 1}</div>
          ))}
        </div>

        {/* Overlay area */}
        <div className={`${s.editorArea} ${showError ? s.editorAreaError : ''}`}>
          {/* Highlight layer — sits behind the transparent textarea */}
          <div
            ref={highlightRef}
            className={s.highlightLayer}
            dangerouslySetInnerHTML={{ __html: highlighted + '\n' }}
            aria-hidden
          />
          {/* Transparent textarea — captures all input */}
          <textarea
            ref={textareaRef}
            className={s.textarea}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onScroll={handleScroll}
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
