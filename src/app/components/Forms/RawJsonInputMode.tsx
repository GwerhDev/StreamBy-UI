import s from './RawJsonInputMode.module.css';
import React, { useState, useEffect } from 'react';
import { JsonEditor } from '../JsonEditor/JsonEditor';

interface RawJsonInputModeProps {
  jsonData: any;
  onJsonDataChange: (newData: any) => void;
}

export const RawJsonInputMode: React.FC<RawJsonInputModeProps> = ({ jsonData, onJsonDataChange }) => {
  const [jsonString, setJsonString] = useState(() => {
    try {
      return typeof jsonData === 'string' ? jsonData : JSON.stringify(jsonData, null, 2);
    } catch (e) {
      return '';
    }
  });
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Only update jsonString if jsonData is a non-empty object or array
      if (Object.keys(jsonData).length > 0 || Array.isArray(jsonData)) {
        const newJsonString = JSON.stringify(jsonData, null, 2);
        if (newJsonString !== jsonString) {
          setJsonString(newJsonString);
        }
      } else if (Object.keys(jsonData).length === 0 && !Array.isArray(jsonData)) {
        // If jsonData is an empty object, set jsonString to an empty string or "{}"
        setJsonString("{}");
      }
    } catch (e) {
      // If jsonData cannot be stringified (e.g., contains circular references), set jsonString to empty
      setJsonString('');
    }
  }, [jsonData]);

  const handleEditorChange = (newString: string, data: object | null, isValid: boolean) => {
    setJsonString(newString);

    // Heuristic check for duplicate keys in the raw string
    const duplicateKeyRegex = /"([^"]+)"\s*:[\s\S]*,"\1"\s*:/;
    const match = newString.match(duplicateKeyRegex);
    
    if (match) {
      setWarning(`Warning: Duplicate key found: "${match[1]}". The last value will be used.`);
    } else {
      setWarning(null);
    }

    if (isValid && data !== null) {
      onJsonDataChange(data); // Pass the parsed data object
    } else {
      // If invalid, we don't update the parent's jsonData to prevent errors.
      // The warning will be displayed to the user.
    }
  };

  return (
    <div className={s.fieldsSection}>
      <h4>Raw JSON Data</h4>
      <JsonEditor value={jsonString} onChange={handleEditorChange} />
      {warning && <p style={{ color: '#f39c12', marginTop: '10px', fontSize: '14px' }}>{warning}</p>}
    </div>
  );
};