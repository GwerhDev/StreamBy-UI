import s from './AssetInspector.module.css';
import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCube, faPause, faPlay, faScaleBalanced, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { AppDispatch, RootState } from '../../../store';
import { addApiResponse } from '../../../store/apiResponsesSlice';
import { nameCrumb } from '../../../store/crumbNamesSlice';
import { useRoleCan } from '../../../hooks/useRoleCan';
import {
  AssetBudgets, AssetVersionSummary, getAssetBudgets, getAssetVersions, getMeasurements, saveAssetBudgets, saveMeasurements,
  setBudgetProfile, VersionMeasurements,
} from '../../../services/assetMeasurements';
import { getAssetDownloadUrl } from '../../../services/deliverables';
import { measureGltf, sameMeasurements } from '../../../utils/measureGltf';
import { SectionHeader } from '../SectionHeader/SectionHeader';
import { DropdownInput } from '../Inputs/DropdownInput';
import { SecondaryButton } from '../Buttons/SecondaryButton';
import { InspectorViewport, LoadedModel } from './InspectorViewport';
import { MeasurementsPanel } from './MeasurementsPanel';
import { BudgetProfilesModal } from './BudgetProfilesModal';

const errorText = (err: unknown, fallback: string) => (err instanceof Error && err.message ? err.message : fallback);

// A 3D asset, inspected: one of its versions, to orbit around (in wireframe, its animations
// playing), and what it measures against the project's budgets. Opened by someone who can edit
// assets, the version is measured here (in the browser) and its measurements kept with it.
export function AssetInspector() {
  const { id: projectId = '', assetId = '' } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const myRole = useSelector((state: RootState) =>
    state.currentProject?.data?.members?.find(m => m.userId === state.session?.userId)?.role);
  const canMeasure = useRoleCan(projectId, myRole, 'assets:write');
  const canEditBudgets = useRoleCan(projectId, myRole, 'project:update');

  const [versions, setVersions] = useState<AssetVersionSummary[]>([]);
  const [versionId, setVersionId] = useState<string | null>(null);
  const [state, setState] = useState<VersionMeasurements | null>(null);
  const [budgets, setBudgets] = useState<AssetBudgets>({ profiles: [], defaultProfileId: null });
  const [url, setUrl] = useState<string | null>(null);
  const [model, setModel] = useState<LoadedModel | null>(null);
  const [measuring, setMeasuring] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [animation, setAnimation] = useState<string | null>(null);
  const [editingBudgets, setEditingBudgets] = useState(false);
  const [savingBudgets, setSavingBudgets] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  const fail = useCallback((err: unknown, fallback: string) => dispatch(addApiResponse({ message: errorText(err, fallback), type: 'error' })), [dispatch]);

  // Its latest version first (an asset made before versions were kept gets its first one).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const latest = await getMeasurements(projectId, assetId);
        const [list, project] = await Promise.all([getAssetVersions(projectId, assetId), getAssetBudgets(projectId)]);
        if (cancelled) return;
        setVersions(list);
        setBudgets(project);
        setState(latest);
        setVersionId(latest.versionId);
      } catch (err) {
        if (!cancelled) setFailed(errorText(err, "Couldn't open the asset"));
      }
    })();
    return () => { cancelled = true; };
  }, [projectId, assetId]);

  // The version shown: its file, and what it measures.
  useEffect(() => {
    if (!versionId) return;
    let cancelled = false;
    setModel(null);
    setAnimation(null);
    (async () => {
      try {
        const [measured, fileUrl] = await Promise.all([
          state?.versionId === versionId ? Promise.resolve(state) : getMeasurements(projectId, assetId, versionId),
          getAssetDownloadUrl(projectId, assetId, versionId),
        ]);
        if (cancelled) return;
        setState(measured);
        setUrl(fileUrl);
      } catch (err) {
        if (!cancelled) setFailed(errorText(err, "Couldn't load the version"));
      }
    })();
    return () => { cancelled = true; };
    //eslint-disable-next-line
  }, [projectId, assetId, versionId]);

  // Loaded: measured, and kept with the version when it's new or it measures otherwise now.
  useEffect(() => {
    if (!model || !state || !canMeasure) return;
    const measured = measureGltf(model);
    if (sameMeasurements(state.measurements, measured)) return;
    let cancelled = false;
    setMeasuring(true);
    saveMeasurements(projectId, assetId, state.versionId, measured)
      .then(saved => { if (!cancelled) setState(prev => (prev ? { ...prev, ...saved } : prev)); })
      .catch(err => fail(err, "Couldn't save the measurements"))
      .finally(() => { if (!cancelled) setMeasuring(false); });
    return () => { cancelled = true; };
    //eslint-disable-next-line
  }, [model, canMeasure, state?.versionId]);

  const chooseProfile = async (profileId: string | null) => {
    try {
      await setBudgetProfile(projectId, assetId, profileId);
      setState(await getMeasurements(projectId, assetId, versionId ?? undefined));
    } catch (err) {
      fail(err, "Couldn't set the budget");
    }
  };

  const saveBudgets = async (next: AssetBudgets) => {
    setSavingBudgets(true);
    try {
      setBudgets(await saveAssetBudgets(projectId, next));
      setEditingBudgets(false);
      setState(await getMeasurements(projectId, assetId, versionId ?? undefined));
    } catch (err) {
      fail(err, "Couldn't save the budgets");
    } finally {
      setSavingBudgets(false);
    }
  };

  const current = versions.find(v => v.versionId === versionId);
  const title = current?.fileName ?? versions[0]?.fileName ?? 'Asset';
  // Its name in the breadcrumbs, in place of its id.
  const named = versions[0]?.fileName;
  useEffect(() => { if (named) dispatch(nameCrumb({ id: assetId, name: named })); }, [dispatch, assetId, named]);

  return (
    <div className={s.inspector} data-testid="asset-inspector">
      <SectionHeader
        icon={faArrowLeft}
        title={title}
        subtitle={state ? `Version ${state.version}` : undefined}
        onIconClick={() => navigate(-1)}
        action={
          <div className={s.actions}>
            {versions.length > 1 && (
              <DropdownInput
                value={versionId ?? ''}
                onChange={setVersionId}
                options={versions.map(v => ({ value: v.versionId, label: `v${v.version}${v.measurements ? '' : ' · unmeasured'}` }))}
              />
            )}
            <button type="button" className={`${s.toggle} ${wireframe ? s.toggleOn : ''}`} aria-pressed={wireframe} onClick={() => setWireframe(w => !w)}>
              <FontAwesomeIcon icon={faCube} /> Wireframe
            </button>
            {canEditBudgets && <SecondaryButton icon={faScaleBalanced} text="Budgets" onClick={() => setEditingBudgets(true)} />}
          </div>
        }
      />

      {failed ? (
        <p className={s.failed}>{failed}</p>
      ) : (
        <div className={s.body}>
          <div className={s.stage}>
            {url ? (
              <InspectorViewport url={url} wireframe={wireframe} animation={animation} onLoaded={setModel} />
            ) : (
              // Its version and file on their way, before the viewer.
              <div className={s.placeholder} data-testid="inspector-loading" aria-label="Loading">
                <FontAwesomeIcon icon={faSpinner} spin />
              </div>
            )}
            {!!model?.animations.length && (
              <ul className={s.animations} aria-label="Animations">
                {model.animations.map((clip, i) => {
                  const name = clip.name || `Animation ${i + 1}`;
                  const playing = animation === clip.name;
                  return (
                    <li key={`${clip.name}-${i}`}>
                      <button type="button" className={`${s.toggle} ${playing ? s.toggleOn : ''}`} onClick={() => setAnimation(playing ? null : clip.name)}>
                        <FontAwesomeIcon icon={playing ? faPause : faPlay} /> {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <MeasurementsPanel
            measurements={state?.measurements ?? null}
            measuring={measuring || (canMeasure && !!url && !model)}
            profile={state?.profile ?? null}
            exceeded={state?.exceeded ?? []}
            profiles={budgets.profiles}
            profileId={state?.profileId ?? null}
            defaultProfileId={budgets.defaultProfileId}
            canChooseProfile={canMeasure}
            onChooseProfile={chooseProfile}
            unmeasuredNote={canMeasure ? undefined : "Unmeasured: it's measured when someone who can edit the project's assets opens it here"}
          />
        </div>
      )}

      {editingBudgets && (
        <BudgetProfilesModal budgets={budgets} saving={savingBudgets} onSave={saveBudgets} onClose={() => setEditingBudgets(false)} />
      )}
    </div>
  );
}
