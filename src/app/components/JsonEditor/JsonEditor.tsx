import s from './JsonEditor.module.css';
import React, { useCallback } from 'react';
import JsonViewer from '../JsonViewer/JsonViewer';

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
      // Intentionally suppress console.log for expected JSON parsing errors during typing.
      // The isValid flag already handles the UI feedback.
      return { parsedData: null, formattedText: text, isValid: false };
    }
  }, []);

  const { parsedData, isValid: currentIsValid } = parseAndFormat(value);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    const { parsedData: newParsedData, isValid: newIsValid } = parseAndFormat(newText);
    onChange(newText, newParsedData, newIsValid);
  };

  return (
    <div className={s.jsonEditorContainer}>
      <div className={s.editorPanel}>
        <textarea
          className={`${s.textarea} ${!currentIsValid && value ? s.invalid : s.valid}`}
          value={value}
          onChange={handleChange}
          spellCheck="false"
          placeholder="Enter JSON here..."
        />
      </div>
      <div className={s.previewPanel}>
        {currentIsValid && parsedData ? (
          <JsonViewer data={parsedData} />
        ) : (
          <div className={s.errorMessage}>Invalid JSON format</div>
        )}
      </div>
    </div>
  );
};
