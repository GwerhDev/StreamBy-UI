import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IntegrationPicker } from './IntegrationPicker';
import { IntegrationPoolEntry } from '../../../interfaces';

const POOL: IntegrationPoolEntry[] = [
  { id: 'db1', kind: 'database', name: 'My Postgres', provider: 'postgresql', source: 'integration', available: true },
  { id: 'st1', kind: 'storage', name: 'My S3', provider: 's3', source: 'integration', available: true },
  { id: 'svc1', kind: 'service', name: 'My Claude', provider: 'claude', source: 'integration', available: true },
  { id: 'svc2', kind: 'service', name: 'Locked Jira', provider: 'jira', source: 'integration', available: false, requiredPlan: 'subscriber' },
];

describe('IntegrationPicker', () => {
  it('shows an empty state when the pool is empty', () => {
    render(<IntegrationPicker pool={[]} selected={[]} onChange={() => {}} />);
    expect(screen.getByText('No integrations available.')).toBeInTheDocument();
  });

  it('filters entries by kind="service" alongside database/storage entries', () => {
    render(<IntegrationPicker pool={POOL} kind="service" selected={[]} onChange={() => {}} />);
    expect(screen.getByText('My Claude (claude)')).toBeInTheDocument();
    expect(screen.getByText('Locked Jira (jira)')).toBeInTheDocument();
    expect(screen.queryByText('My Postgres (postgresql)')).not.toBeInTheDocument();
    expect(screen.queryByText('My S3 (s3)')).not.toBeInTheDocument();
  });

  it('renders without a kind filter showing every entry', () => {
    render(<IntegrationPicker pool={POOL} selected={[]} onChange={() => {}} />);
    expect(screen.getByText('My Postgres (postgresql)')).toBeInTheDocument();
    expect(screen.getByText('My S3 (s3)')).toBeInTheDocument();
    expect(screen.getByText('My Claude (claude)')).toBeInTheDocument();
  });

  it('excludes ids passed via excludeIds', () => {
    render(<IntegrationPicker pool={POOL} kind="service" selected={[]} onChange={() => {}} excludeIds={['svc1']} />);
    expect(screen.queryByText('My Claude (claude)')).not.toBeInTheDocument();
    expect(screen.getByText('Locked Jira (jira)')).toBeInTheDocument();
  });

  it('shows a locked badge for unavailable entries and disables their checkbox', () => {
    render(<IntegrationPicker pool={POOL} kind="service" selected={[]} onChange={() => {}} />);
    const checkbox = screen.getByLabelText('My Claude (claude)') as HTMLInputElement;
    expect(checkbox).not.toBeDisabled();
    const lockedCheckbox = screen.getByLabelText('Locked Jira (jira)') as HTMLInputElement;
    expect(lockedCheckbox).toBeDisabled();
  });

  it('calls onChange with only the clicked id in single-select mode', async () => {
    const onChange = vi.fn();
    render(<IntegrationPicker pool={POOL} kind="service" selected={[]} onChange={onChange} single />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('My Claude (claude)'));
    expect(onChange).toHaveBeenCalledWith(['svc1']);
  });

  it('toggles ids in and out of the array in multi-select mode', async () => {
    const onChange = vi.fn();
    const { rerender } = render(<IntegrationPicker pool={POOL} kind="service" selected={['svc1']} onChange={onChange} />);
    const user = userEvent.setup();
    await user.click(screen.getByLabelText('Locked Jira (jira)'));
    // Locked Jira is unavailable/disabled, so clicking it should not call onChange.
    expect(onChange).not.toHaveBeenCalled();

    rerender(<IntegrationPicker pool={POOL} kind="service" selected={['svc1']} onChange={onChange} />);
    await user.click(screen.getByLabelText('My Claude (claude)'));
    expect(onChange).toHaveBeenCalledWith([]);
  });
});
