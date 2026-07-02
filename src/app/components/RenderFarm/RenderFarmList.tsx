import s from './RenderFarmList.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faServer, faPlus, faTrash, faCheck,
} from '@fortawesome/free-solid-svg-icons';
import { useDispatch } from 'react-redux';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { ActionButton } from '../Buttons/ActionButton';
import { EmptyBackground } from '../Backgrounds/EmptyBackground';
import { ModalShell } from '../Modals/ModalShell';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { AppDispatch } from '../../../store';
import { RenderFarmConnection, RenderFarmProvider } from '../../../interfaces';
import { API_BASE } from '../../../config/api';

async function fetchRenderFarmConnections(projectId: string): Promise<RenderFarmConnection[]> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/render-farm-connections`, {
    credentials: 'include',
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const { connections } = await res.json();
  return connections ?? [];
}

async function createRenderFarmConnection(
  projectId: string,
  payload: { name: string; provider: RenderFarmProvider; apiUrl: string; description?: string },
): Promise<RenderFarmConnection> {
  const res = await fetch(`${API_BASE}/streamby/projects/${projectId}/render-farm-connections`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const { message } = await res.json().catch(() => ({}));
    throw new Error(message || `HTTP ${res.status}`);
  }
  const { connection } = await res.json();
  return connection;
}

async function deleteRenderFarmConnection(projectId: string, connectionId: string): Promise<void> {
  const res = await fetch(
    `${API_BASE}/streamby/projects/${projectId}/render-farm-connections/${connectionId}`,
    { method: 'DELETE', credentials: 'include' },
  );
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
}

const PROVIDERS: RenderFarmProvider[] = ['flamenco', 'deadline', 'rebusfarm', 'sheepit', 'custom'];

interface CreateForm { name: string; provider: RenderFarmProvider; apiUrl: string; description: string; }
const EMPTY_FORM: CreateForm = { name: '', provider: 'flamenco', apiUrl: '', description: '' };

export function RenderFarmList() {
  const { id: projectId } = useParams<{ id: string }>();
  const dispatch = useDispatch<AppDispatch>();
  const [connections, setConnections] = useState<RenderFarmConnection[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showCreate, setShowCreate]   = useState(false);
  const [form, setForm]               = useState<CreateForm>(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      setConnections(await fetchRenderFarmConnections(projectId));
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to load render farm connections.', type: 'error' }));
    } finally {
      setLoading(false);
    }
  }, [projectId, dispatch]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!projectId || !form.name || !form.apiUrl) return;
    setSubmitting(true);
    try {
      const conn = await createRenderFarmConnection(projectId, {
        name: form.name, provider: form.provider, apiUrl: form.apiUrl,
        description: form.description || undefined,
      });
      setConnections(prev => [...prev, conn]);
      setShowCreate(false);
      setForm(EMPTY_FORM);
      dispatch(addApiResponse({ message: 'Render farm connection created.', type: 'success' }));
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to create connection.', type: 'error' }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!projectId) return;
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return; }
    try {
      await deleteRenderFarmConnection(projectId, id);
      setConnections(prev => prev.filter(c => c.id !== id));
      setConfirmDeleteId(null);
      dispatch(addApiResponse({ message: 'Connection deleted.', type: 'success' }));
    } catch (err: any) {
      dispatch(addApiResponse({ message: err.message || 'Failed to delete connection.', type: 'error' }));
      setConfirmDeleteId(null);
    }
  };

  return (
    <div className={s.container}>
      <SectionHeader
        icon={faServer}
        title="Render Farm"
        subtitle="Configure render farm connections for this project."
        action={!loading && !connections.length
          ? <ActionButton icon={faPlus} text="Add connection" onClick={() => setShowCreate(true)} />
          : undefined}
      />

      {loading ? (
        <ul>
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className={`${s.cardSkeleton} ${skeleton.skeleton}`} />
          ))}
        </ul>
      ) : !connections.length ? (
        <div className={s.emptyState}><EmptyBackground /></div>
      ) : (
        <ul>
          {connections.map(conn => (
            <li key={conn.id} className={s.card}>
              <div className={s.cardIcon}>
                <FontAwesomeIcon icon={faServer} />
              </div>
              <div className={s.cardInfo}>
                <span className={s.cardName}>{conn.name}</span>
                <span className={s.cardUrl}>{conn.apiUrl}</span>
              </div>
              <span className={s.providerBadge}>{conn.provider}</span>
              <button
                type="button"
                className={`${s.deleteBtn} ${confirmDeleteId === conn.id ? s.deleteBtnConfirm : ''}`}
                onClick={() => handleDelete(conn.id)}
                title={confirmDeleteId === conn.id ? 'Click again to confirm' : 'Delete'}
              >
                <FontAwesomeIcon icon={confirmDeleteId === conn.id ? faCheck : faTrash} />
              </button>
            </li>
          ))}
          <li className={s.createConnection} onClick={() => setShowCreate(true)}>
            <FontAwesomeIcon icon={faPlus} />
            <h4>Add connection</h4>
          </li>
        </ul>
      )}

      {showCreate && (
        <ModalShell
          title="Add render farm connection"
          icon={faServer}
          onClose={() => { setShowCreate(false); setForm(EMPTY_FORM); }}
          footer={
            <ActionButton
              isLoading={submitting}
              disabled={!form.name || !form.apiUrl || submitting}
              icon={faPlus}
              text="Create"
              onClick={handleCreate}
            />
          }
        >
          <div className={s.formGrid}>
            <label className={s.label}>
              Name
              <input className={s.input} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="My Deadline Farm" />
            </label>
            <label className={s.label}>
              Provider
              <select className={s.input} value={form.provider} onChange={e => setForm(f => ({ ...f, provider: e.target.value as RenderFarmProvider }))}>
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className={s.label} style={{ gridColumn: '1 / -1' }}>
              API URL
              <input className={s.input} value={form.apiUrl} onChange={e => setForm(f => ({ ...f, apiUrl: e.target.value }))} placeholder="https://farm.example.com/api" />
            </label>
            <label className={s.label} style={{ gridColumn: '1 / -1' }}>
              Description (optional)
              <input className={s.input} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Internal studio render farm" />
            </label>
          </div>
        </ModalShell>
      )}
    </div>
  );
}
