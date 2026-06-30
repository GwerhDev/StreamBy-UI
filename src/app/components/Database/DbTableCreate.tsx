import s from './Database.module.css';
import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableColumns, faPlus, faTrash, faXmark } from '@fortawesome/free-solid-svg-icons';
import { RootState, AppDispatch } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { createTable } from '../../../services/database';
import { DbColumnDefinition, ExternalDbType } from '../../../interfaces';
import { LabeledInput } from '../Inputs/LabeledInput';
import { ActionButton } from '../Buttons/ActionButton';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { CustomForm } from '../Forms/CustomForm';

const SQL_TYPES = ['TEXT', 'INTEGER', 'BOOLEAN', 'TIMESTAMP', 'UUID', 'JSONB', 'BIGINT', 'FLOAT', 'SERIAL'];

const emptyCol = (): DbColumnDefinition => ({ name: '', type: 'TEXT', nullable: true, primaryKey: false });

export const DbTableCreate = () => {
  const { id: projectId, connId } = useParams<{ id: string; connId: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const location = useLocation();
  const locationState = (location.state ?? {}) as { dbType?: string; isBuiltin?: boolean; name?: string };
  const project = useSelector((state: RootState) => state.currentProject.data);
  const externalConn = project?.dbConnections?.find(c => c.id === connId);
  const conn = externalConn ?? {
    id: connId!,
    name: locationState.name ?? connId!,
    dbType: (locationState.dbType ?? 'mongodb') as ExternalDbType,
    isBuiltin: locationState.isBuiltin ?? true,
  };
  const isMongo = conn?.dbType === 'mongodb';

  const [tableName, setTableName] = useState('');
  const [columns, setColumns] = useState<DbColumnDefinition[]>([emptyCol()]);
  const [loading, setLoading] = useState(false);

  const addColumn = () => setColumns(prev => [...prev, emptyCol()]);
  const removeColumn = (i: number) => setColumns(prev => prev.filter((_, idx) => idx !== i));
  const updateColumn = (i: number, field: keyof DbColumnDefinition, value: string | boolean) =>
    setColumns(prev => prev.map((c, idx) => idx === i ? { ...c, [field]: value } : c));

  const isDisabled = !tableName || loading || (!isMongo && columns.some(c => !c.name));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || !connId) return;
    setLoading(true);
    try {
      await createTable(projectId, connId, {
        tableName,
        columns: isMongo ? [] : columns,
      });
      dispatch(addApiResponse({ message: `${entity.charAt(0).toUpperCase() + entity.slice(1)} created.`, type: 'success' }));
      navigate(`/project/${projectId}/database/${connId}`);
    } catch (error: any) {
      dispatch(addApiResponse({ message: error.message || `Failed to create ${entity}.`, type: 'error' }));
    } finally {
      setLoading(false);
    }
  };

  const entity = isMongo ? 'collection' : 'table';

  return (
    <div className={s.container}>
      <form onSubmit={handleSubmit} className={s.formWrapper}>
        <CustomForm
          readOnly={false}
          isLoading={loading}
          header={{
            icon: faTableColumns,
            title: `New ${isMongo ? 'Collection' : 'Table'}`,
            subtitle: `Create a new ${entity} in ${conn?.name ?? 'this database'}.`,
          }}
          fields={[
            {
              icon: faTableColumns,
              label: isMongo ? 'Collection name' : 'Table name',
              value: tableName || '—',
              editComponent: (
                <LabeledInput
                  label={isMongo ? 'Collection name' : 'Table name'} name="tableName" value={tableName}
                  type="text" placeholder={isMongo ? 'users' : 'users'} id="tbl-name" htmlFor="tbl-name"
                  onChange={e => setTableName(e.target.value)} disabled={loading}
                />
              ),
            },
          ]}
          actions={null}
        />

        {!isMongo && (
          <div className={s.columnSection}>
            <p className={s.sectionLabel}>Columns</p>

            <div className={s.columnBuilder}>
              <div className={s.columnRow}>
                <span className={s.columnRowLabel}>Name</span>
                <span className={s.columnRowLabel}>Type</span>
                <span className={s.columnRowLabel}>Nullable</span>
                <span className={s.columnRowLabel}>PK</span>
                <span />
              </div>

              {columns.map((col, i) => (
                <div key={i} className={s.columnRow}>
                  <input
                    type="text" placeholder="column_name" value={col.name}
                    onChange={e => updateColumn(i, 'name', e.target.value)}
                  />
                  <select value={col.type} onChange={e => updateColumn(i, 'type', e.target.value)}>
                    {SQL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <span className={s.checkCell}>
                    <input type="checkbox" checked={col.nullable !== false} onChange={e => updateColumn(i, 'nullable', e.target.checked)} />
                  </span>
                  <span className={s.checkCell}>
                    <input type="checkbox" checked={!!col.primaryKey} onChange={e => updateColumn(i, 'primaryKey', e.target.checked)} />
                  </span>
                  <button type="button" className={s.removeColBtn} onClick={() => removeColumn(i)} disabled={columns.length === 1}>
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}

              <button type="button" className={s.addColBtn} onClick={addColumn}>
                <FontAwesomeIcon icon={faPlus} /> Add column
              </button>
            </div>
          </div>
        )}

        <div className={s.formActions}>
          <ActionButton disabled={isDisabled} icon={faTableColumns} text={`Create ${entity}`} type="submit" />
          <SecondaryButton disabled={loading} icon={faXmark} onClick={() => navigate(-1)} text="Cancel" />
        </div>
      </form>
    </div>
  );
};
