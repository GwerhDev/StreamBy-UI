import s from './RawJsonInputMode.module.css';
import React, { useState, useEffect } from 'react';
import { JsonEditor } from '../JsonEditor/JsonEditor';

interface RawJsonInputModeProps {
  jsonData: any;
  onJsonDataChange: (newData: any) => void;
}

export const RawJsonInputMode: React.FC<RawJsonInputModeProps> = ({ jsonData, onJsonDataChange }) => {
  const [jsonString, setJsonString] = useState(() => JSON.stringify(jsonData, null, 2));
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    let localData;
    try {
      localData = JSON.parse(jsonString);
    } catch (e) {
      localData = null;
    }

    if (JSON.stringify(localData) !== JSON.stringify(jsonData)) {
      setJsonString(JSON.stringify(jsonData, null, 2));
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

    if (isValid && data) {
      onJsonDataChange(data);
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