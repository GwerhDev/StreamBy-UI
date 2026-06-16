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
import { fetchBuiltinDatabases } from '../../../services/database';
import { fetchStorageConnections } from '../../../services/storageConnections';

const STORAGE_MOCK = [
  { id: 'Images',   label: 'Images',   value: 0, color: 'var(--color-primary)' },
  { id: 'Videos',   label: 'Videos',   value: 0, color: 'var(--color-warning)' },
  { id: 'Audio',    label: 'Audio',    value: 0, color: 'var(--color-success)' },
  { id: '3D Models',label: '3D Models',value: 0, color: 'var(--color-danger)'  },
];

const STORAGE_PLACEHOLDER = [
  { id: 'empty', label: '', value: 1, color: 'var(--color-dark-400)' },
];

const CATEGORY_ICONS = [faImage, faVideo, faMusic, faCube];

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

  useEffect(() => {
    fetchBuiltinDatabases().then(builtins => {
      const builtinConns: DbConnection[] = builtins.map(db => ({
        id: db.name,
        name: db.name,
        dbType: db.value === 'sql' ? 'postgresql' : 'mongodb',
        credentialId: '',
        projectId: id,
        isBuiltin: true,
      }));
      setAllDbConns([...builtinConns, ...(currentProject?.dbConnections ?? [])]);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    fetchStorageConnections(id).then(setAllStorageConns);
  }, [id]);

  const memberRolesData = Object.entries(
    currentProject?.members?.reduce((acc: Record<string, number>, member) => {
      acc[member.role] = (acc[member.role] || 0) + 1;
      return acc;
    }, {}) || {}
  ).map(([id, value]) => ({ id, value }));

  const commonPieProps = {
    innerRadius: 0.5,
    padAngle: 0.5,
    cornerRadius: 1,
    activeOuterRadiusOffset: 1,
    borderWidth: 1,
    arcLinkLabelsSkipAngle: 10,
    arcLinkLabelsTextColor: '#adadad',
    arcLinkLabelsThickness: 2,
    arcLinkLabelsColor: '#adadad',
    arcLabelsSkipAngle: 10,
    arcLabelsTextColor: '#adadad',
    margin: { top: 40, right: 80, bottom: 80, left: 80 },
    legends: [
      {
        anchor: 'left' as const,
        direction: 'row' as const,
        justify: false,
        translateX: -75,
        translateY: 56,
        itemsSpacing: 0,
        itemWidth: 100,
        itemHeight: 18,
        itemTextColor: '#cccccc',
        itemDirection: 'left-to-right' as const,
        itemOpacity: 1,
        symbolSize: 18,
        symbolShape: 'circle' as const,
        effects: [{ on: 'hover' as const, style: { itemTextColor: '#007bff' } }],
      },
    ],
  };

  const hasStorage = allStorageConns.length > 0;
  const storagePieData = hasStorage ? STORAGE_MOCK : STORAGE_PLACEHOLDER;

  return (
    <div className={s.chartsContainer}>
      <div className={s.chartCard}>
        <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Member Roles'}</h4>
        {!loading && (
          memberRolesData.length > 0 ? (
            <div className={s.graphContainer}>
              <ResponsivePie data={memberRolesData} {...commonPieProps} colors={{ scheme: 'category10' }} />
            </div>
          ) : (
            <p className={s.emptyText}>No member role data available.</p>
          )
        )}
      </div>

      <div className={s.resourceCard}>
        <div
          className={s.resourceSection}
          onClick={() => !loading && id && navigate(`/project/${id}/database`)}
        >
          <div className={s.resourceHeader}>
            <FontAwesomeIcon icon={faDatabase} className={s.resourceIcon} />
            <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Database'}</h4>
          </div>
          {!loading && (
            allDbConns.length > 0 ? (
              <ul className={s.connList}>
                {allDbConns.map(conn => (
                  <li key={conn.id} className={s.connRow}>
                    <span className={s.connName}>{conn.name}</span>
                    <span className={s.connBadge}>{DB_TYPE_LABEL[conn.dbType] ?? conn.dbType}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={s.emptyText}>No database connections.</p>
            )
          )}
        </div>

        <div className={s.divider} />

        <div
          className={s.resourceSection}
          onClick={() => !loading && id && navigate(`/project/${id}/storage`)}
        >
          <div className={s.resourceHeader}>
            <FontAwesomeIcon icon={faHardDrive} className={s.resourceIcon} />
            <h4 className={loading ? skeleton.skeleton : ''}>{loading ? '' : 'Storage'}</h4>
          </div>
          {!loading && (
            <>
              <div className={s.storageLayout}>
                <div className={s.storagePie}>
                  <ResponsivePie
                    data={storagePieData}
                    innerRadius={0.55}
                    padAngle={hasStorage ? 0.5 : 0}
                    cornerRadius={hasStorage ? 2 : 0}
                    activeOuterRadiusOffset={4}
                    borderWidth={0}
                    arcLinkLabelsSkipAngle={360}
                    arcLabelsSkipAngle={360}
                    margin={{ top: 8, right: 8, bottom: 8, left: 8 }}
                    colors={hasStorage ? storagePieData.map(d => d.color) : ['var(--color-dark-400)']}
                    enableArcLabels={false}
                    enableArcLinkLabels={false}
                    isInteractive={hasStorage}
                    tooltip={({ datum }) => (
                      <div className={s.pieTooltip}>{datum.id}: {datum.value} files</div>
                    )}
                  />
                </div>
                <ul className={s.storageCategories}>
                  {STORAGE_MOCK.map(({ id: cat, label, color }, i) => (
                    <li key={cat} className={s.categoryRow}>
                      <FontAwesomeIcon icon={CATEGORY_ICONS[i]} style={{ color }} className={s.categoryIcon} />
                      <span className={s.categoryLabel}>{label}</span>
                      <span className={s.categoryCount}>0 files</span>
                    </li>
                  ))}
                </ul>
              </div>
              {!hasStorage && (
                <p className={s.emptyText}>No storage connections.</p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
