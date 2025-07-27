import s from './JsonEditor.module.css';
import React, { useCallback } from 'react';

interface JsonEditorProps {
  value: string;
  onChange: (jsonString: string, data: object | null, isValid: boolean) => void;
}

export const JsonEditor: React.FC<JsonEditorProps> = ({ value, onChange }) => {
  const parseAndFormat = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(text);
      return { parsedData: parsed, formattedText: JSON.stringify(parsed, null, 2), isValid: true };
    } catch (e) {
      console.log(e)
      return { parsedData: null, formattedText: text, isValid: false };
    }
  }, []);

  const { formattedText, isValid: currentIsValid } = parseAndFormat(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const { parsedData: newParsedData, isValid: newIsValid } = parseAndFormat(newText);
    onChange(newText, newParsedData, newIsValid);
  };

  const highlightSyntax = (text: string) => {
    if (!currentIsValid) return text; // Don't highlight if invalid

    // Basic syntax highlighting (can be expanded)
    text = text.replace(/("(\w+)"):/g, '<span class="' + s.keyName + '">"$2"</span>:');
    text = text.replace(/"((?:[^"\\]|\\.)*)"/g, '<span class="' + s.stringValue + '">"$1"</span>');
    text = text.replace(/\b(true|false)\b/g, '<span class="' + s.booleanValue + '">$1</span>');
    text = text.replace(/\b(\d+\.?\d*([eE][+-]?\d+)?)\b/g, '<span class="' + s.numberValue + '">$1</span>');
    text = text.replace(/\b(null)\b/g, '<span class="' + s.nullValue + '">$1</span>');

    return text;
  };

  return (
    <div className={s.jsonEditorContainer}>
      <div className={s.editorPanel}>
        <textarea
          className={`${s.textarea} ${!currentIsValid ? s.invalid : s.valid}`}
          value={value}
          onChange={handleChange}
          spellCheck="false"
          placeholder="Enter JSON here..."
        />
      </div>
      <div className={s.previewPanel}>
        <div
          className={`${s.syntaxHighlighting} ${!currentIsValid ? s.invalid : ''}`}
          dangerouslySetInnerHTML={{ __html: highlightSyntax(formattedText) }}
        />
        {!currentIsValid && <div className={s.errorMessage}>Invalid JSON format</div>}
      </div>
    </div>
  );
};
