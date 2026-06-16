import s from './ProjectCharts.module.css';
import skeleton from '../Loader/Skeleton.module.css';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { ResponsivePie } from '@nivo/pie';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDatabase, faHardDrive, faImage, faVideo, faMusic, faCube } from '@fortawesome/free-solid-svg-icons';
import { RootState } from '../../../store';
import { DbConnection, StorageConnection } from '../../../interfaces';
import { fetchBuiltinDatabases, fetchTables } from '../../../services/database';
import { fetchStorageConnections } from '../../../services/storageConnections';
import { getStorageCategoryStats } from '../../../services/storage';

// Literal colors — nivo cannot resolve CSS variables
const STORAGE_CATEGORIES = [
  { id: 'Images',    label: 'Images',    color: '#38B6FF', icon: faImage },
  { id: 'Videos',    label: 'Videos',    color: '#f5a623', icon: faVideo },
  { id: 'Audio',     label: 'Audio',     color: '#4caf82', icon: faMusic },
  { id: '3D Models', label: '3D Models', color: '#e05555', icon: faCube  },
];

const STORAGE_EMPTY_DATA = [{ id: 'empty', label: '', value: 1 }];

const CATEGORY_API_TO_UI: Record<string, string> = {
  images: 'Images', videos: 'Videos', audios: 'Audio', '3d-models': '3D Models',
};

function formatBytes(b: number): string {
  if (b === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(b) / Math.log(k));
  return `${(b / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

const DB_TYPE_LABEL: Record<string, string> = {
  postgresql: 'PostgreSQL',
  mongodb: 'MongoDB',
};

export const ProjectCharts = () => {
  const { data: currentProject, loading } = useSelector((state: RootState) => state.currentProject);
  const navigate = useNavigate();
  const id = currentProject?.id ?? '';

  const [allDbConns, setAllDbConns] = useState<DbConnection[]>([]);
  const [allStorageConns, setAllStorageConns] = useState<StorageConnection[]>([]);
  const [fetchingDb, setFetchingDb] = useState(true);
  const [fetchingStorage, setFetchingStorage] = useState(true);
  const [storageStats, setStorageStats] = useState<Record<string, { count: number; size: number }>>({});
  const [dbTableCounts, setDbTableCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!id) return;
    setFetchingDb(true);
    fetchBuiltinDatabases().then(async builtins => {
      const builtinConns: DbConnection[] = builtins.map(db => ({
        id: db.name,
        name: db.name,
        dbType: db.value === 'sql' ? 'postgresql' : 'mongodb',
        credentialId: '',
        projectId: id,
        isBuiltin: true,
      }));
      const allConns = [...builtinConns, ...(currentProject?.dbConnections ?? [])];
      setAllDbConns(allConns);

      const tableResults = await Promise.all(
        allConns.map(async conn => {
          const tables = await fetchTables(id, conn.id).catch(() => [] as string[]);
          return [conn.id, tables.length] as const;
        })
      );
      setDbTableCounts(Object.fromEntries(tableResults));
      setFetchingDb(false);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setFetchingStorage(true);
    fetchStorageConnections(id).then(async conns => {
      setAllStorageConns(conns);

      const statsPerConn = await Promise.all(conns.map(c => getStorageCategoryStats(id, c.id)));
      const merged: Record<string, { count: number; size: number }> = {};
      for (const connStats of statsPerConn) {
        for (const [apiCat, vals] of Object.entries(connStats)) {
          const uiId = CATEGORY_API_TO_UI[apiCat] ?? apiCat;
          merged[uiId] = {
            count: (merged[uiId]?.count ?? 0) + vals.count,
            size: (merged[uiId]?.size ?? 0) + vals.size,
          };
        }
      }
      setStorageStats(merged);
      setFetchingStorage(false);
    });
  }, [id]);

  const memberRolesData = Object.entries(
    currentProject?.members?.reduce((acc: Record<string, number>, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {}) || {}
  ).map(([id, value]) => ({ id, value }));

  const hasStorage = allStorageConns.length > 0;
  const storagePieData = hasStorage
    ? STORAGE_CATEGORIES.map(c => ({ id: c.id, label: c.label, value: storageStats[c.id]?.count ?? 0 }))
    : STORAGE_EMPTY_DATA;
  const storagePieColors = hasStorage
    ? STORAGE_CATEGORIES.map(c => c.color)
    : ['#2f2f2f'];

  const loadingDb = loading || fetchingDb;
  const loadingStorage = loading || fetchingStorage;

  return (
    <div className={s.chartsContainer}>
      <div className={s.chartCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Member Roles'}</h4>
        {!loading && (
          memberRolesData.length > 0 ? (
            <div className={s.graphContainer}>
              <ResponsivePie
                data={memberRolesData}
                innerRadius={0.5}
                padAngle={0.5}
                cornerRadius={1}
                activeOuterRadiusOffset={1}
                borderWidth={1}
                arcLinkLabelsSkipAngle={10}
                arcLinkLabelsTextColor="#adadad"
                arcLinkLabelsThickness={2}
                arcLinkLabelsColor="#adadad"
                arcLabelsSkipAngle={10}
                arcLabelsTextColor="#adadad"
                margin={{ top: 40, right: 80, bottom: 80, left: 80 }}
                colors={{ scheme: 'category10' }}
                legends={[{
                  anchor: 'left',
                  direction: 'row',
                  justify: false,
                  translateX: -75,
                  translateY: 56,
                  itemsSpacing: 0,
                  itemWidth: 100,
                  itemHeight: 18,
                  itemTextColor: '#cccccc',
                  itemDirection: 'left-to-right',
                  itemOpacity: 1,
                  symbolSize: 18,
                  symbolShape: 'circle',
                  effects: [{ on: 'hover', style: { itemTextColor: '#007bff' } }],
                }]}
              />
            </div>
          ) : (
            <p className={s.emptyText}>No member role data available.</p>
          )
        )}
      </div>

      <div className={s.resourceCard}>
        {/* Database section */}
        <div
          className={`${s.resourceSection} ${loadingDb ? s.resourceSectionLoading : s.resourceSectionClickable}`}
          onClick={() => !loadingDb && id && navigate(`/project/${id}/database`)}
        >
          <div className={s.resourceHeader}>
            {!loadingDb && <FontAwesomeIcon icon={faDatabase} className={s.resourceIcon} />}
            <h4 className={loadingDb ? skeleton.skeleton : ''}>{loadingDb ? '' : 'Database'}</h4>
          </div>
          {!loadingDb && (
            allDbConns.length > 0 ? (
              <ul className={s.connList}>
                {allDbConns.map(conn => (
                  <li key={conn.id} className={s.connRow}>
                    <span className={s.connName}>{conn.name}</span>
                    <span className={s.connBadge}>{DB_TYPE_LABEL[conn.dbType] ?? conn.dbType}</span>
                    <span className={s.connTableCount}>{dbTableCounts[conn.id] ?? 0} tables</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.emptyText}>No database connections.</p>
            )
          )}
        </div>

        <div className={s.divider} />

        {/* Storage section */}
        <div
          className={`${s.resourceSection} ${loadingStorage ? s.resourceSectionLoading : s.resourceSectionClickable}`}
          onClick={() => !loadingStorage && id && navigate(`/project/${id}/storage`)}
        >
          <div className={s.resourceHeader}>
            {!loadingStorage && <FontAwesomeIcon icon={faHardDrive} className={s.resourceIcon} />}
            <h4 className={loadingStorage ? skeleton.skeleton : ''}>{loadingStorage ? '' : 'Storage'}</h4>
          </div>
          {!loadingStorage && (
            <div className={s.storageLayout}>
              <div className={s.storagePie}>
                <ResponsivePie
                  data={storagePieData}
                  innerRadius={0.6}
                  padAngle={hasStorage ? 0.5 : 0}
                  cornerRadius={hasStorage ? 2 : 0}
                  activeOuterRadiusOffset={hasStorage ? 4 : 0}
                  borderWidth={0}
                  arcLinkLabelsSkipAngle={360}
                  arcLabelsSkipAngle={360}
                  margin={{ top: 4, right: 4, bottom: 4, left: 4 }}
                  colors={storagePieColors}
                  enableArcLabels={false}
                  enableArcLinkLabels={false}
                  isInteractive={hasStorage}
                  tooltip={({ datum }) => (
                    <div className={s.pieTooltip}>{datum.id}: {datum.value} files</div>
                  )}
                />
              </div>
              <ul className={s.storageCategories}>
                {STORAGE_CATEGORIES.map(({ id: cat, label, color, icon }) => (
                  <li key={cat} className={s.categoryRow}>
                    <FontAwesomeIcon icon={icon} style={{ color }} className={s.categoryIcon} />
                    <span className={s.categoryLabel}>{label}</span>
                    <span className={s.categoryCount}>
                      {storageStats[cat]?.count ?? 0} files · {formatBytes(storageStats[cat]?.size ?? 0)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
