import React from 'react';
import s from './JsonViewer.module.css';

interface JsonViewerProps {
  data: object;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  const formatValue = (value: any) => {
    if (typeof value === 'string') {
      return <span className={s.stringValue}>"{value}"</span>;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return <span className={s.numberBooleanValue}>{String(value)}</span>;
    }
    if (value === null) {
      return <span className={s.nullValue}>null</span>;
    }
    return null;
  };

  const renderJson = (obj: any, indent = 0) => {
    const indentSpace = '  '.repeat(indent);

    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      return (
        <>
          [<br />
          {obj.map((item, index) => (
            <React.Fragment key={index}>
              {indentSpace}  {renderJson(item, indent + 1)}
              {index < obj.length - 1 ? ',' : ''}
              <br />
            </React.Fragment>
          ))}
          {indentSpace}]
        </>
      );
    }

    if (typeof obj === 'object' && obj !== null) {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      return (
        <>
          &#123;<br />
          {keys.map((key, index) => (
            <React.Fragment key={key}>
              {indentSpace}  <span className={s.keyName}>"{key}"</span>: {formatValue(obj[key]) || renderJson(obj[key], indent + 1)}
              {index < keys.length - 1 ? ',' : ''}
              <br />
            </React.Fragment>
          ))}
          {indentSpace}&#125;
        </>
      );
    }
    
    return formatValue(obj);
  };

  return (
      <pre>
        {renderJson(data)}
      </pre>
  );
};

export default JsonViewer;