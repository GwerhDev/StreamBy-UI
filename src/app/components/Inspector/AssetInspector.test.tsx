import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AnimationClip, BoxGeometry, Group, Mesh, MeshStandardMaterial, Texture } from 'three';
import * as measurementsService from '../../../services/assetMeasurements';
import * as deliverables from '../../../services/deliverables';
import * as permissions from '../../../services/permissions';
import { AssetInspector } from './AssetInspector';
import { BudgetProfilesModal } from './BudgetProfilesModal';
import { MeasurementsPanel } from './MeasurementsPanel';

// The viewport draws with WebGL, which a test doesn't have: here it "loads" a goblin at once.
const goblin = () => {
  const albedo = new Texture({ width: 2048, height: 2048 } as unknown as HTMLImageElement);
  albedo.name = 'goblin_albedo';
  albedo.userData.mimeType = 'image/png';
  const scene = new Group();
  scene.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial({ map: albedo })));
  return { scene, animations: [new AnimationClip('Idle', 2.5, []), new AnimationClip('Run', 0.8, [])] };
};
vi.mock('./InspectorViewport', () => ({
  InspectorViewport: ({ url, wireframe, animation, onLoaded }: any) => {
    const { useEffect } = require('react');
    useEffect(() => { onLoaded(goblin()); }, [url]);
    return <div data-testid="inspector-viewport" data-url={url} data-wireframe={String(wireframe)} data-animation={animation ?? ''} />;
  },
}));

// Decoding needs the Web Audio API, and measuring a worker: here a WAV of the soundtrack
// "decodes" and "measures" at once.
const THEME = {
  kind: 'audio' as const, duration: 92.48, sampleRate: 48_000, channels: 2, bitDepth: 24, format: 'audio/wav',
  integratedLufs: -14.4, shortTermLufsMax: -10.2, truePeak: -0.3, rms: -17.9, lra: 6.1, tool: 'streamby-inspector',
};
vi.mock('../../../utils/audioFile', () => ({
  decodeAudioFile: vi.fn(async (_bytes: ArrayBuffer, contentType: string | null) => ({ audio: { sampleRate: 48_000, channels: [] }, bitDepth: 24, format: contentType })),
}));
vi.mock('../../../utils/measureAudioOffThread', () => ({
  measureAudioOffThread: vi.fn(async () => ({ measurements: THEME, peaks: [{ min: -0.5, max: 0.6 }, { min: -0.9, max: 0.8 }] })),
}));

const CHARACTER = { id: 'character', name: 'Character', maxTriangles: 10, maxTextureSize: 1024 };
const BUDGETS = { profiles: [CHARACTER, { id: 'prop', name: 'Prop' }], defaultProfileId: 'character' };
const unmeasured = { assetId: 'a1', versionId: 'v2', version: 2, measurements: null, profile: CHARACTER, profileId: null, exceeded: [] };

const renderInspector = (role = 'admin', kind: 'model' | 'audio' = 'model') => {
  const category = kind === 'audio' ? 'audios' : '3d-models';
  const store = configureStore({
    reducer: {
      session: () => ({ logged: true, loader: false, username: 'ada', userId: 'u1' }),
      currentProject: () => ({ data: { id: 'p1', members: [{ userId: 'u1', role, status: 'active' }] }, loading: false, error: null }),
      apiResponses: (state = { responses: [] as unknown[] }) => state,
    },
  });
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/project/p1/storage/c-builtin/${category}/a1`]}>
        <Routes><Route path={`/project/:id/storage/:connId/${category}/:assetId`} element={<AssetInspector kind={kind} />} /></Routes>
      </MemoryRouter>
    </Provider>,
  );
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(measurementsService, 'getMeasurements').mockResolvedValue(unmeasured);
  vi.spyOn(measurementsService, 'getAssetVersions').mockResolvedValue([
    { versionId: 'v2', version: 2, fileName: 'goblin.glb', createdAt: '' },
    { versionId: 'v1', version: 1, fileName: 'goblin.glb', createdAt: '', measurements: null },
  ]);
  vi.spyOn(measurementsService, 'getAssetBudgets').mockResolvedValue(BUDGETS);
  vi.spyOn(deliverables, 'getAssetDownloadUrl').mockResolvedValue('https://signed.test/goblin.glb');
});

describe('AssetInspector', () => {
  it('shows a spinner until its version and file are there, then the viewer', async () => {
    let answer!: (url: string) => void;
    vi.spyOn(deliverables, 'getAssetDownloadUrl').mockImplementation(() => new Promise(resolve => { answer = resolve; }));
    vi.spyOn(measurementsService, 'saveMeasurements').mockImplementation(async (_p, _a, _v, measurements) => ({ measurements, profile: null, exceeded: [] }));
    renderInspector();
    expect(screen.getByTestId('inspector-loading')).toBeInTheDocument();
    expect(screen.queryByTestId('inspector-viewport')).not.toBeInTheDocument();
    await waitFor(() => expect(answer).toBeDefined());
    answer('https://signed.test/goblin.glb');
    expect(await screen.findByTestId('inspector-viewport')).toBeInTheDocument();
    expect(screen.queryByTestId('inspector-loading')).not.toBeInTheDocument();
  });

  it("measures the version it opens, keeps the measurements with it, and shows what's over its budget", async () => {
    const save = vi.spyOn(measurementsService, 'saveMeasurements').mockImplementation(async (_p, _a, _v, measurements) => ({
      measurements, profile: CHARACTER,
      exceeded: [{ metric: 'triangles', limit: 10, value: 12 }, { metric: 'textureSize', limit: 1024, value: 2048, texture: 'goblin_albedo' }],
    }));
    renderInspector();
    expect(await screen.findByText('goblin.glb')).toBeInTheDocument();
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    const [project, asset, version, measured] = save.mock.calls[0];
    expect([project, asset, version]).toEqual(['p1', 'a1', 'v2']);
    expect(measured).toMatchObject({
      triangles: 12, vertices: 24, meshes: 1, materials: 1,
      textures: [{ name: 'goblin_albedo', width: 2048, height: 2048, format: 'image/png' }],
      animations: [{ name: 'Idle', duration: 2.5 }, { name: 'Run', duration: 0.8 }],
    });
    expect(screen.getByTestId('inspector-viewport')).toHaveAttribute('data-url', 'https://signed.test/goblin.glb');

    expect(await screen.findByTestId('verdict')).toHaveTextContent('2 over its budget');
    expect(screen.getByTestId('metric-triangles')).toHaveTextContent('12');
    expect(screen.getByTestId('metric-triangles')).toHaveTextContent('/ 10');
    expect(screen.getByTestId('metric-triangles').className).toMatch(/over/);
    expect(screen.getByTestId('texture')).toHaveTextContent('2048×2048');
  });

  it("doesn't measure again what's already measured as it is", async () => {
    const save = vi.spyOn(measurementsService, 'saveMeasurements');
    const measured = (await import('../../../utils/measureGltf')).measureGltf(goblin());
    vi.spyOn(measurementsService, 'getMeasurements').mockResolvedValue({ ...unmeasured, measurements: { ...measured, measuredBy: 'eli' } });
    renderInspector();
    expect(await screen.findByTestId('verdict')).toBeInTheDocument();
    await new Promise(r => setTimeout(r, 50));
    expect(save).not.toHaveBeenCalled();
  });

  it("plays its animations and shows it in wireframe", async () => {
    vi.spyOn(measurementsService, 'saveMeasurements').mockImplementation(async (_p, _a, _v, measurements) => ({ measurements, profile: null, exceeded: [] }));
    renderInspector();
    const user = userEvent.setup();
    const animations = await screen.findByRole('list', { name: 'Animations' });
    await user.click(within(animations).getByRole('button', { name: /Run/ }));
    expect(screen.getByTestId('inspector-viewport')).toHaveAttribute('data-animation', 'Run');
    await user.click(within(animations).getByRole('button', { name: /Run/ }));
    expect(screen.getByTestId('inspector-viewport')).toHaveAttribute('data-animation', '');
    await user.click(screen.getByRole('button', { name: /Wireframe/ }));
    expect(screen.getByTestId('inspector-viewport')).toHaveAttribute('data-wireframe', 'true');
  });

  it("for who can't edit the project's assets, measures nothing and says it's unmeasured", async () => {
    vi.spyOn(permissions, 'getProjectPermissions').mockResolvedValue({ permissions: { roles: {} } } as never);
    const save = vi.spyOn(measurementsService, 'saveMeasurements');
    renderInspector('viewer');
    expect(await screen.findByTestId('unmeasured')).toHaveTextContent(/Unmeasured: it's measured when someone who can edit/);
    expect(save).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: /Budgets/ })).not.toBeInTheDocument();
  });
});

describe('AssetInspector, an audio file', () => {
  const MUSIC = { id: 'music', name: 'Music', kind: 'audio' as const, targetLufs: -14, lufsTolerance: 1, maxTruePeak: -1 };
  beforeEach(() => {
    vi.spyOn(measurementsService, 'getAssetVersions').mockResolvedValue([{ versionId: 'v2', version: 2, fileName: 'theme.wav', createdAt: '' }]);
    vi.spyOn(measurementsService, 'getMeasurements').mockResolvedValue({ ...unmeasured, kind: 'audio', profile: MUSIC });
    vi.spyOn(measurementsService, 'getAssetBudgets').mockResolvedValue({ profiles: [...BUDGETS.profiles, MUSIC], defaultProfileId: 'character', defaultAudioProfileId: 'music' });
    vi.spyOn(deliverables, 'getAssetDownloadUrl').mockResolvedValue('https://signed.test/theme.wav');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'audio/wav' } }));
    URL.createObjectURL = vi.fn(() => 'blob:theme');
    URL.revokeObjectURL = vi.fn();
  });

  it('shows its waveform to play, measures it, and marks its true peak over its profile', async () => {
    const save = vi.spyOn(measurementsService, 'saveMeasurements').mockImplementation(async (_p, _a, _v, measurements) => ({
      measurements, profile: MUSIC, exceeded: [{ metric: 'truePeak', limit: -1, value: -0.3 }],
    }));
    renderInspector('admin', 'audio');
    expect(await screen.findByTestId('waveform')).toBeInTheDocument();
    expect(screen.getByTestId('audio-player')).toHaveAttribute('src', 'blob:theme');
    expect(screen.queryByRole('button', { name: /Wireframe/ })).not.toBeInTheDocument();
    await waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    expect(save.mock.calls[0][3]).toMatchObject({ kind: 'audio', integratedLufs: -14.4, truePeak: -0.3, format: 'audio/wav' });
    expect(await screen.findByTestId('verdict')).toHaveTextContent('1 over its budget');
    expect(screen.getByTestId('metric-truePeak')).toHaveTextContent('-0.3 dBTP');
    expect(screen.getByTestId('metric-truePeak')).toHaveTextContent('≤ -1');
    expect(screen.getByTestId('metric-truePeak').className).toMatch(/over/);
    expect(screen.getByTestId('metric-integrated').className).not.toMatch(/over/);
  });

  it('offers only the audio profiles to choose from', async () => {
    vi.spyOn(measurementsService, 'saveMeasurements').mockImplementation(async (_p, _a, _v, measurements) => ({ measurements, profile: MUSIC, exceeded: [] }));
    renderInspector('admin', 'audio');
    await screen.findByTestId('waveform');
    const panel = screen.getByTestId('measurements');
    expect(within(panel).getByText('Project default (Music)')).toBeInTheDocument();
    expect(within(panel).queryByText('Character')).not.toBeInTheDocument();
  });
});

describe('MeasurementsPanel', () => {
  const measurements = {
    triangles: 18_400, vertices: 9_900, meshes: 3, materials: 2,
    textures: [{ name: 'albedo', width: 2048, height: 2048, format: 'image/png' }, { name: 'normal', width: 1024, height: 1024, format: 'image/ktx2' }],
    animations: [{ name: 'Idle', duration: 2.5 }],
  };
  const panel = (props: Partial<Parameters<typeof MeasurementsPanel>[0]> = {}) => render(
    <MeasurementsPanel measurements={measurements} measuring={false} profile={CHARACTER} exceeded={[]} profiles={BUDGETS.profiles}
      profileId={null} defaultProfileId="character" canChooseProfile onChooseProfile={vi.fn()} {...props} />,
  );

  it('marks only what goes over, the texture it is about too', () => {
    panel({ exceeded: [{ metric: 'textureFormat', limit: ['image/ktx2'], value: 'image/png', texture: 'albedo' }] });
    const [albedo, normal] = screen.getAllByTestId('texture');
    expect(albedo.className).toMatch(/over/);
    expect(normal.className).not.toMatch(/over/);
    expect(screen.getByTestId('metric-triangles').className).not.toMatch(/over/);
    expect(screen.getByTestId('verdict')).toHaveTextContent('1 over its budget');
  });

  it("says when it's within its budget, or has none to check against", () => {
    panel();
    expect(screen.getByTestId('verdict')).toHaveTextContent('Within its budget');
    document.body.innerHTML = '';
    panel({ profile: null });
    expect(screen.getByTestId('verdict')).toHaveTextContent('No budget to check against');
  });

  it("is unmeasured until it's measured", () => {
    panel({ measurements: null, unmeasuredNote: 'Unmeasured' });
    expect(screen.getByTestId('unmeasured')).toHaveTextContent('Unmeasured');
    expect(screen.queryByTestId('verdict')).not.toBeInTheDocument();
  });
});

describe('BudgetProfilesModal', () => {
  it("saves the profiles as typed: an empty limit isn't set, formats as MIME types", async () => {
    const onSave = vi.fn();
    render(<BudgetProfilesModal budgets={{ profiles: [], defaultProfileId: null }} saving={false} onSave={onSave} onClose={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add a 3D profile/ }));
    await user.type(screen.getByLabelText('Name'), 'Character');
    await user.type(screen.getByLabelText('Triangles'), '15000');
    await user.type(screen.getByLabelText('Texture formats'), 'ktx2, image/webp');
    await user.click(screen.getByLabelText("The project's default"));
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    const saved = onSave.mock.calls[0][0];
    expect(saved.profiles).toEqual([{ id: expect.any(String), name: 'Character', maxTriangles: 15000, textureFormats: ['image/ktx2', 'image/webp'] }]);
    expect(saved.defaultProfileId).toBe(saved.profiles[0].id);
  });

  it('saves an audio profile: its loudness target and peak, formats as MIME types, sample rates, its own default', async () => {
    const onSave = vi.fn();
    render(<BudgetProfilesModal budgets={{ profiles: [CHARACTER], defaultProfileId: 'character' }} saving={false} onSave={onSave} onClose={vi.fn()} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Add an audio profile/ }));
    const audio = within(screen.getByTestId('budgets-audio'));
    await user.type(audio.getByLabelText('Name'), 'Music');
    await user.type(audio.getByLabelText('Target (LUFS)'), '-14');
    await user.type(audio.getByLabelText('Max true peak (dBTP)'), '-1.5');
    await user.type(audio.getByLabelText('Formats'), 'wav, ogg');
    await user.type(audio.getByLabelText('Sample rates (Hz)'), '48000');
    await user.click(audio.getByLabelText("The project's default"));
    await user.click(screen.getByRole('button', { name: /^Save$/ }));
    const saved = onSave.mock.calls[0][0];
    const music = saved.profiles.find((p: { name: string }) => p.name === 'Music');
    expect(music).toEqual({ id: expect.any(String), kind: 'audio', name: 'Music', targetLufs: -14, maxTruePeak: -1.5, audioFormats: ['audio/wav', 'audio/ogg'], sampleRates: [48000] });
    expect(saved).toMatchObject({ defaultProfileId: 'character', defaultAudioProfileId: music.id });
  });

  it("can't save an audio profile with a level or a rate that isn't a number", async () => {
    render(<BudgetProfilesModal budgets={{ profiles: [{ id: 'm', name: 'Music', kind: 'audio' }], defaultProfileId: null }} saving={false} onSave={vi.fn()} onClose={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Target (LUFS)'), 'loud');
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeDisabled();
  });

  it("can't save a profile without a name, or a limit that isn't a count", async () => {
    render(<BudgetProfilesModal budgets={{ profiles: [{ id: 'p', name: 'Prop' }], defaultProfileId: null }} saving={false} onSave={vi.fn()} onClose={vi.fn()} />);
    const user = userEvent.setup();
    await user.type(screen.getByLabelText('Triangles'), 'lots');
    expect(screen.getByRole('button', { name: /^Save$/ })).toBeDisabled();
  });
});
