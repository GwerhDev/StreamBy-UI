import s from './CustomForm.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { ReactNode } from 'react';

export interface FieldConfig {
  icon: IconDefinition;
  label: string;
  value: ReactNode;
  editComponent?: ReactNode;
  hidden?: boolean;
}

interface CustomFormHeader {
  icon: IconDefinition;
  title: string;
  subtitle?: string;
  badge?: string;
}

interface CustomFormProps {
  header?: CustomFormHeader | ReactNode;
  fields: FieldConfig[];
  actions?: ReactNode;
  readOnly?: boolean;
}

function isHeaderConfig(h: unknown): h is CustomFormHeader {
  return typeof h === 'object' && h !== null && 'title' in h && 'icon' in h;
}

export function CustomForm({ header, fields, actions, readOnly = true }: CustomFormProps) {
  const visibleFields = fields.filter(f => !f.hidden);

  return (
    <div className={s.container}>
      {header && (
        <div className={s.header}>
          {isHeaderConfig(header) ? (
            <>
              <span className={s.iconWrap}>
                <FontAwesomeIcon icon={header.icon} />
              </span>
              <div className={s.headerText}>
                <h2 className={s.title}>{header.title}</h2>
                {header.subtitle && <p className={s.subtitle}>{header.subtitle}</p>}
              </div>
              {header.badge && <span className={s.methodBadge}>{header.badge}</span>}
            </>
          ) : (
            header as ReactNode
          )}
        </div>
      )}

      <div className={s.fields}>
        {visibleFields.map((field, i) => {
          const isEditing = !readOnly && !!field.editComponent;
          return (
            <div key={i} className={s.field}>
              <span className={isEditing ? s.fieldIconEdit : s.fieldIcon}>
                <FontAwesomeIcon icon={field.icon} />
              </span>
              <div className={s.fieldBody}>
                {isEditing
                  ? <div className={s.fieldEdit}>{field.editComponent}</div>
                  : <>
                      <p className={s.fieldLabel}>{field.label}</p>
                      <div className={s.fieldValue}>{field.value}</div>
                    </>
                }
              </div>
            </div>
          );
        })}
      </div>

      {actions && <div className={s.actions}>{actions}</div>}

    </div>
  );
}
