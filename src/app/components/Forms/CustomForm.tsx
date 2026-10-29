import s from './CustomForm.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { faXmark } from '@fortawesome/free-solid-svg-icons';
import { ReactNode, useContext } from 'react';
import { FormCloseContext } from '../../../hooks/useFormRoute';
import { Spinner } from '../Spinner';
import { SectionHeader } from '../SectionHeader/SectionHeader';

export interface FieldConfig {
  icon: IconDefinition;
  label: string;
  value: ReactNode;
  editComponent?: ReactNode;
  hidden?: boolean;
}

export interface CustomFormHeader {
  icon: IconDefinition;
  title: string;
  subtitle?: string;
  badge?: string;
}

interface CustomFormProps {
  header?: CustomFormHeader | ReactNode;
  fields: FieldConfig[];
  actions?: ReactNode;
  // What goes in the form besides its fields (a table's columns), after them.
  children?: ReactNode;
  readOnly?: boolean;
  isLoading?: boolean;
}

function isHeaderConfig(h: unknown): h is CustomFormHeader {
  return typeof h === 'object' && h !== null && 'title' in h && 'icon' in h;
}

// A form is its own container: its header, its fields and its actions in it. Opened as a modal,
// it's the modal, closed from its header.
export function CustomForm({ header, fields, actions, children, readOnly = true, isLoading = false }: CustomFormProps) {
  const visibleFields = fields.filter(f => !f.hidden);
  const close = useContext(FormCloseContext);

  return (
    <div className={s.container} data-form-card>
      {(header || close) && (
        <div className={s.header}>
          <div className={s.headerContent}>
            {header && (
              isHeaderConfig(header)
                ? <SectionHeader icon={header.icon} title={header.title} subtitle={header.subtitle} badge={header.badge} />
                : header as ReactNode
            )}
          </div>
          {close && (
            <button className={s.closeBtn} type="button" aria-label="Close" onClick={close}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>
      )}

      <div className={s.fields}>
        <Spinner bg isLoading={isLoading} />
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

      {children}

      {actions && <div className={s.actions}>{actions}</div>}

    </div>
  );
}
