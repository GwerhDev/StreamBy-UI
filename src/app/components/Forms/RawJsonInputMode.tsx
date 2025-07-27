import s from './RawJsonInputMode.module.css';
import React from 'react';
import { JsonEditor } from '../JsonEditor/JsonEditor';

interface RawJsonInputModeProps {
  rawJsonInputString: string;
  handleJsonEditorChange: (jsonString: string, data: object | null, isValid: boolean) => void;
}

export const RawJsonInputMode: React.FC<RawJsonInputModeProps> = ({
  rawJsonInputString,
  handleJsonEditorChange,
}) => {
  return (
    <div className={s.fieldsSection}>
      <h4>Raw JSON Data</h4>
      <JsonEditor value={rawJsonInputString} onChange={handleJsonEditorChange} />
    </div>
  );
};