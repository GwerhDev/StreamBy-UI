import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { JobProfileFields } from './JobProfileFields';
import { kindsFor } from './jobProfiles';
import { worker } from '../../../test/workers';

const fields = (props: Partial<Parameters<typeof JobProfileFields>[0]> = {}) => {
  const onChange = vi.fn();
  render(<JobProfileFields idPrefix="p" local kind="thumbnail" category="videos" profile={{}} speechIntegrations={[]} onChange={onChange} {...props} />);
  return onChange;
};

describe("a job's options", () => {
  it("of StreamBy's own worker: a thumbnail's width (a number), format and a video's frame", async () => {
    const onChange = fields();
    fireEvent.change(screen.getByLabelText('Width (px)'), { target: { value: '320' } });
    expect(onChange).toHaveBeenLastCalledWith({ width: 320 });
    fireEvent.change(screen.getByLabelText("Video's frame at"), { target: { value: '00:00:02' } });
    expect(onChange).toHaveBeenLastCalledWith({ timecode: '00:00:02' });
    await userEvent.setup().click(screen.getByRole('button', { name: 'jpg' }));
    fireEvent.mouseDown(screen.getByText('webp'));
    expect(onChange).toHaveBeenLastCalledWith({ format: 'webp' });
  });

  it("an image's thumbnail has no frame; an audio's transcode, no picture", () => {
    fields({ category: 'images' });
    expect(screen.queryByLabelText("Video's frame at")).not.toBeInTheDocument();
  });

  it("an audio's transcode offers only audio formats, and no size", async () => {
    fields({ kind: 'transcode', category: 'audios' });
    expect(screen.queryByLabelText('Width (px)')).not.toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole('button', { name: 'mp3' }));
    expect(screen.queryByText('mp4')).not.toBeInTheDocument();
    expect(screen.getByText('flac')).toBeInTheDocument();
  });

  it("a transcript's speech provider, one of the requester's own; or how to connect one", async () => {
    const onChange = fields({ kind: 'transcribe', speechIntegrations: [{ id: 'i1', name: 'Whisper' }] });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Choose one' }));
    fireEvent.mouseDown(screen.getByText('Whisper'));
    expect(onChange).toHaveBeenLastCalledWith({ integrationId: 'i1' });
  });

  it('with no speech provider connected, says to connect one', () => {
    fields({ kind: 'transcribe' });
    expect(screen.getByText(/Connect a speech provider first/)).toBeInTheDocument();
  });

  it("another worker's, as JSON: an object, or it says so", () => {
    const onChange = fields({ local: false, kind: 'gltf-optimize' });
    const box = screen.getByLabelText('Options (JSON, optional)');
    fireEvent.change(box, { target: { value: '{ "textureFormat": "ktx2" }' } });
    expect(onChange).toHaveBeenLastCalledWith({ textureFormat: 'ktx2' });
    fireEvent.change(box, { target: { value: '[1]' } });
    expect(screen.getByText('Options must be a JSON object')).toBeInTheDocument();
  });

  it("offers StreamBy's own kinds that take the asset; another worker's, all of them", () => {
    const own = worker({ id: 'streamby', name: 'StreamBy', kinds: ['thumbnail', 'transcode', 'lod', 'gltf-convert', 'transcribe'], categories: ['images', 'videos', 'audios', '3d-models'] });
    expect(kindsFor(own, 'images')).toEqual(['thumbnail']);
    expect(kindsFor(own, 'videos')).toEqual(['thumbnail', 'transcode', 'transcribe']);
    expect(kindsFor(own, '3d-models')).toEqual(['lod', 'gltf-convert']);
    expect(kindsFor(worker(), '3d-models')).toEqual(['gltf-optimize', 'lod']);
  });
});
