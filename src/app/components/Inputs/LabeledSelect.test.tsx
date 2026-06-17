import { render, screen } from '@testing-library/react';
import { LabeledSelect } from './LabeledSelect';

const options = [
  { value: 'viewer', label: 'Viewer' },
  { value: 'editor', label: 'Editor' },
];

describe('LabeledSelect', () => {
  it('renders label', () => {
    render(<LabeledSelect label="Role" value="viewer" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Role')).toBeInTheDocument();
  });

  it('renders selected value', () => {
    render(<LabeledSelect label="Role" value="viewer" onChange={vi.fn()} options={options} />);
    expect(screen.getByText('Viewer')).toBeInTheDocument();
  });

  it('renders in disabled state', () => {
    render(<LabeledSelect label="Role" value="viewer" onChange={vi.fn()} options={options} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
