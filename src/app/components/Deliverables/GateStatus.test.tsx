import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { GateStatus } from './GateStatus';

const BLOCKERS = [
  { nodeId: 'gate', type: 'reviewGateNode', label: 'Art review', reason: 'Waiting for approvals: 0 of 1' },
  { nodeId: 'sheet', type: 'creditsSheetNode', label: 'Model credits', reason: '1 of 2 assets lack credits' },
];

describe('GateStatus', () => {
  it('shows nothing when there are no gates before it', () => {
    const { container } = render(<GateStatus state={{ status: 'ready', gated: false, blockedBy: [] }} />);
    expect(container).toBeEmptyDOMElement();
    expect(render(<GateStatus state={{}} />).container).toBeEmptyDOMElement();
  });

  it('says it is ready when its gates passed', () => {
    render(<GateStatus state={{ status: 'ready', gated: true, blockedBy: [] }} />);
    expect(screen.getByTestId('gate-status')).toHaveTextContent('Ready');
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });

  it('says it is blocked, by each gate and what it lacks', () => {
    render(<GateStatus state={{ status: 'blocked', gated: true, blockedBy: BLOCKERS }} />);
    expect(screen.getByTestId('gate-status')).toHaveTextContent('Blocked');
    const reasons = within(screen.getByRole('list', { name: 'What holds it' })).getAllByRole('listitem');
    expect(reasons.map(r => r.textContent)).toEqual(['Art review: Waiting for approvals: 0 of 1', 'Model credits: 1 of 2 assets lack credits']);
  });
});
