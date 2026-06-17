import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CustomCanvas } from './CustomCanvas';

describe('CustomCanvas', () => {
  it('renders nothing when showCanvas is false', () => {
    render(<CustomCanvas showCanvas={false} setShowCanvas={vi.fn()}><p>Content</p></CustomCanvas>);
    expect(screen.queryByText('Content')).not.toBeInTheDocument();
  });

  it('renders children when showCanvas is true', () => {
    render(<CustomCanvas showCanvas setShowCanvas={vi.fn()}><p>Content</p></CustomCanvas>);
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('calls setShowCanvas(false) when clicking outside', async () => {
    const user = userEvent.setup();
    const setShowCanvas = vi.fn();
    render(
      <div>
        <CustomCanvas showCanvas setShowCanvas={setShowCanvas}><p>Content</p></CustomCanvas>
        <button>Outside</button>
      </div>
    );
    await user.click(screen.getByText('Outside'));
    expect(setShowCanvas).toHaveBeenCalledWith(false);
  });

  it('does not call setShowCanvas when clicking inside', async () => {
    const user = userEvent.setup();
    const setShowCanvas = vi.fn();
    render(<CustomCanvas showCanvas setShowCanvas={setShowCanvas}><button>Inside</button></CustomCanvas>);
    await user.click(screen.getByText('Inside'));
    expect(setShowCanvas).not.toHaveBeenCalled();
  });
});
