import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { PipelineStepFields } from './PipelineStepFields';
import { DocumentSummary, Worker } from '../../../interfaces';

const MEMBERS = [{ userId: 'u1', username: 'ada', role: 'admin', status: 'active' as const }];
const TEAMS = [{ id: 'tm1', name: 'Artists', members: [], createdAt: '', updatedAt: '' }];
const DOCS = [
  { id: 'd1', projectId: 'p1', kind: 'document', title: 'Planning notes', parentId: null, position: 0, version: 1, exportable: false },
  { id: 'f1', projectId: 'p1', kind: 'folder', title: 'Folder', parentId: null, position: 1, version: 1, exportable: false },
] as unknown as DocumentSummary[];
const WORKERS = [
  { source: 'builtin', id: 'blender', name: 'Blender', provider: '', kinds: ['lod', 'decimate'], categories: ['3d-models'], autoKind: null, description: null, hasCredential: false, createdBy: null },
] as Worker[];

const fields = (props: Partial<Parameters<typeof PipelineStepFields>[0]> = {}) => {
  const onChange = vi.fn();
  render(
    <PipelineStepFields
      nodeId="n1" type="tasksNode" panel="people" data={{}} editMode members={MEMBERS} teams={TEAMS}
      documents={DOCS} reviews={[]} workers={WORKERS} exports={[{ id: 'e1', name: 'Site' }]} summary="ada" onChange={onChange}
      {...props}
    />,
  );
  return onChange;
};

describe('PipelineStepFields', () => {
  it('a step done by people takes who completes it, people and teams', async () => {
    const onChange = fields({ data: { assignedTo: [], teamIds: ['tm1'] } });
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('ada', { selector: 'input' }));
    expect(onChange).toHaveBeenLastCalledWith({ assignedTo: ['u1'] });
    await user.click(screen.getByLabelText('Artists', { selector: 'input' }));
    expect(onChange).toHaveBeenLastCalledWith({ teamIds: [] });
  });

  it("a Meeting takes its notes, one of the project's documents", async () => {
    const onChange = fields({ type: 'meetingNode' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'None linked' }));
    expect(screen.queryByText('Folder')).not.toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Planning notes'));
    expect(onChange).toHaveBeenCalledWith({ documentId: 'd1' });
  });

  it("a worker's step takes its worker and what it does, the worker's first kind at first", async () => {
    const onChange = fields({ type: 'lodNode', panel: 'worker' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'None: it passes' }));
    fireEvent.mouseDown(screen.getByText('Blender'));
    expect(onChange).toHaveBeenCalledWith({ worker: { source: 'builtin', id: 'blender', name: 'Blender' }, kind: 'lod', profile: {} });
  });

  it('with a worker set, offers its kinds and where its result goes', () => {
    fields({ type: 'lodNode', panel: 'worker', data: { worker: { source: 'builtin', id: 'blender' }, kind: 'decimate' } });
    expect(screen.getByRole('button', { name: 'decimate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'A new asset' })).toBeInTheDocument();
  });

  it("a Deliverable is its card's, or an export's", async () => {
    const onChange = fields({ type: 'deliverableNode', panel: 'deliverable' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Its card' }));
    fireEvent.mouseDown(screen.getByText('Site'));
    expect(onChange).toHaveBeenCalledWith({ exportId: 'e1' });
  });

  it('read only, says who completes it', () => {
    fields({ editMode: false, summary: 'ada, Artists' });
    expect(screen.getByText('Completed by')).toBeInTheDocument();
    expect(screen.getByText('ada, Artists')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });
});
