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

const renderBtn = (overrides: Partial<Session> = {}) =>
  render(
    <Provider store={store}>
      <MemoryRouter>
        <ProfileButton userData={{ ...userData, ...overrides }} />
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
    expect(screen.getByTitle('Home')).toBeInTheDocument();
    expect(screen.getByTitle('Account')).toBeInTheDocument();
    expect(screen.getByTitle('Archive')).toBeInTheDocument();
    expect(screen.getByTitle('Settings')).toBeInTheDocument();
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
    expect(screen.getByTitle('Home')).toBeInTheDocument();
    await user.click(screen.getByText('outside'));
    expect(screen.queryByTitle('Home')).not.toBeInTheDocument();
  });
});
