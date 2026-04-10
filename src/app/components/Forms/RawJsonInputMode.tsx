import s from './RawJsonInputMode.module.css';
import React, { useState, useEffect } from 'react';
import { JsonEditor } from '../JsonEditor/JsonEditor';

interface RawJsonInputModeProps {
  jsonData: string;
  onJsonDataChange: (jsonString: string, data: object | null, isValid: boolean) => void;
  jsonError: string | null;
}

export const RawJsonInputMode: React.FC<RawJsonInputModeProps> = ({ jsonData, onJsonDataChange, jsonError }) => {
  const [jsonString, setJsonString] = useState<string>('');
  const [warning, setWarning] = useState<string | null>(null);

  useEffect(() => {
    setJsonString(jsonData);
  }, [jsonData]);

  const handleEditorChange = (newString: string, data: object | null, isValid: boolean) => {
    setJsonString(newString);

    const duplicateKeyRegex = /"([^"]+)"\s*:[\s\S]*,\s*"\1"\s*:/;
    const match = newString.match(duplicateKeyRegex);
    setWarning(match ? `Warning: duplicate key "${match[1]}" — last value will be used.` : null);

    onJsonDataChange(newString, data, isValid);
  };

  return (
    <div className={s.fieldsSection}>
      <JsonEditor value={jsonString} onChange={handleEditorChange} jsonError={jsonError} />
      {warning && <p className={s.warningMessage}>{warning}</p>}
    </div>
  );
};
