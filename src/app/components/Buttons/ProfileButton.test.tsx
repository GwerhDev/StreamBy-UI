import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ProfileButton } from './ProfileButton';
import { Session } from '../../../interfaces';

const userData: Session = {
  logged: true,
  loader: false,
  username: 'alice',
};

const store = configureStore({
  reducer: {
    currentProject: (state = { data: null, loading: false, error: null, membership: null }) => state,
  },
});

const renderBtn = (overrides: Partial<Session> = {}, onGoArchive?: () => void) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ProfileButton userData={{ ...userData, ...overrides }} onGoArchive={onGoArchive} />
      </MemoryRouter>
    </Provider>
  );

describe('ProfileButton', () => {
  it('renders first letter when no profile pic', () => {
    renderBtn();
    expect(screen.getByText('a')).toBeInTheDocument();
  });

  it('renders profile image when profilePic is set', () => {
    renderBtn({ profilePic: 'https://example.com/pic.jpg' });
    const img = document.querySelector('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('pic.jpg');
  });

  it('shows menu buttons when clicked', async () => {
    const user = userEvent.setup();
    renderBtn();
    await user.click(screen.getByText('a'));
    expect(screen.getByTitle('Profile')).toBeInTheDocument();
    expect(screen.getByTitle('Archive')).toBeInTheDocument();
    expect(screen.getByTitle('Integrations')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
  });

  it('calls onGoArchive and closes the menu when Archive is clicked', async () => {
    const user = userEvent.setup();
    const onGoArchive = vi.fn();
    renderBtn({}, onGoArchive);
    await user.click(screen.getByText('a'));
    await user.click(screen.getByTitle('Archive'));
    expect(onGoArchive).toHaveBeenCalledTimes(1);
    expect(screen.queryByTitle('Archive')).not.toBeInTheDocument();
  });

  it('hides menu after clicking outside', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <MemoryRouter>
          <div>
            <ProfileButton userData={userData} />
            <button>outside</button>
          </div>
        </MemoryRouter>
      </Provider>
    );
    await user.click(screen.getByText('a'));
    expect(screen.getByTitle('Profile')).toBeInTheDocument();
    await user.click(screen.getByText('outside'));
    expect(screen.queryByTitle('Profile')).not.toBeInTheDocument();
  });
});
