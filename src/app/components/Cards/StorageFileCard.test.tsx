import { render, screen } from '@testing-library/react';
import { StorageFileCard } from './StorageFileCard';
import { StorageFile } from '../../../interfaces';

const baseFile: StorageFile = {
  id: 'f1',
  key: 'photo.jpg',
  name: 'photo.jpg',
  displayName: 'photo.jpg',
  storageKey: 'sk1',
  size: 1048576,
  url: 'https://example.com/photo.jpg',
  lastModified: new Date().toISOString(),
  contentType: 'image/jpeg',
  category: 'images',
  uploadedBy: 'user1',
  createdAt: new Date().toISOString(),
};

describe('StorageFileCard', () => {
  it('renders file display name', () => {
    render(<StorageFileCard file={baseFile} />);
    expect(screen.getByText('photo.jpg')).toBeInTheDocument();
  });

  it('renders formatted file size', () => {
    render(<StorageFileCard file={baseFile} />);
    expect(screen.getByText(/1 MB/)).toBeInTheDocument();
  });

  it('renders Image category badge', () => {
    render(<StorageFileCard file={baseFile} />);
    expect(screen.getByText('Image')).toBeInTheDocument();
  });

  it('renders Audio category badge', () => {
    render(<StorageFileCard file={{ ...baseFile, category: 'audios' }} />);
    expect(screen.getByText('Audio')).toBeInTheDocument();
  });

  it('renders Video category badge', () => {
    render(<StorageFileCard file={{ ...baseFile, category: 'videos' }} />);
    expect(screen.getByText('Video')).toBeInTheDocument();
  });

  it('renders 3D category badge', () => {
    render(<StorageFileCard file={{ ...baseFile, category: '3d-models' }} />);
    expect(screen.getByText('3D')).toBeInTheDocument();
  });

  it('renders time ago for recent file', () => {
    render(<StorageFileCard file={baseFile} />);
    expect(screen.getByText(/just now/)).toBeInTheDocument();
  });
});
