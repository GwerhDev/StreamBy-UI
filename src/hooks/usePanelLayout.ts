import { DragEvent, useCallback, useEffect, useRef, useState } from 'react';

type TabId = 'details' | 'nodes' | 'response';

export interface PanelState { id: string; tabs: TabId[]; activeTab: TabId; isOriginal: boolean; }
export interface ColumnState { id: string; rows: PanelState[]; }

let _c = 0;
const uid = () => `p${++_c}`;

const ALL_TABS: TabId[] = ['details', 'nodes', 'response'];

export function usePanelLayout() {
  const [columns, setColumns] = useState<ColumnState[]>([
    { id: uid(), rows: [{ id: uid(), tabs: ALL_TABS, activeTab: 'details', isOriginal: true }] },
  ]);
  const dragRef = useRef<{ fromPanelId: string; tab: TabId; isOriginal: boolean } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<{ panelId: string; zone: 'top' | 'bottom' | 'left' | 'right' } | null>(null);

  useEffect(() => {
    const onDragEnd = () => { setIsDragging(false); setDropTarget(null); dragRef.current = null; };
    window.addEventListener('dragend', onDragEnd);
    return () => window.removeEventListener('dragend', onDragEnd);
  }, []);

  const splitRight = useCallback((colIdx: number, rowIdx: number) => {
    setColumns(prev => {
      const tab = prev[colIdx].rows[rowIdx].activeTab;
      const next = [...prev];
      next.splice(colIdx + 1, 0, { id: uid(), rows: [{ id: uid(), tabs: [tab], activeTab: tab, isOriginal: false }] });
      return next;
    });
  }, []);

  const splitDown = useCallback((colIdx: number, rowIdx: number) => {
    setColumns(prev => {
      const tab = prev[colIdx].rows[rowIdx].activeTab;
      return prev.map((col, ci) => {
        if (ci !== colIdx) return col;
        const rows = [...col.rows];
        rows.splice(rowIdx + 1, 0, { id: uid(), tabs: [tab], activeTab: tab, isOriginal: false });
        return { ...col, rows };
      });
    });
  }, []);

  const closePanel = useCallback((colIdx: number, rowIdx: number) => {
    setColumns(prev => {
      if (prev[colIdx].rows[rowIdx].isOriginal) return prev;
      const col = prev[colIdx];
      if (col.rows.length === 1) return prev.filter((_, i) => i !== colIdx);
      return prev.map((col, ci) =>
        ci !== colIdx ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== rowIdx) }
      );
    });
  }, []);

  const closeTab = useCallback((colIdx: number, rowIdx: number, tab: TabId) => {
    setColumns(prev => {
      const panel = prev[colIdx].rows[rowIdx];
      if (panel.isOriginal) return prev;
      const newTabs = panel.tabs.filter(t => t !== tab);
      if (newTabs.length === 0) {
        const col = prev[colIdx];
        if (col.rows.length === 1) return prev.filter((_, i) => i !== colIdx);
        return prev.map((col, ci) =>
          ci !== colIdx ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== rowIdx) }
        );
      }
      const newActive = panel.activeTab === tab ? newTabs[0] : panel.activeTab;
      return prev.map((col, ci) =>
        ci !== colIdx ? col : {
          ...col,
          rows: col.rows.map((row, ri) =>
            ri !== rowIdx ? row : { ...row, tabs: newTabs, activeTab: newActive }
          ),
        }
      );
    });
  }, []);

  const setActiveTab = useCallback((
    colIdx: number,
    rowIdx: number,
    tab: TabId,
    onLeavingNodes?: () => void,
  ) => {
    const currentTab = columns[colIdx]?.rows[rowIdx]?.activeTab;
    if (currentTab === 'nodes' && tab !== 'nodes') onLeavingNodes?.();
    setColumns(prev => prev.map((col, ci) =>
      ci !== colIdx ? col : {
        ...col,
        rows: col.rows.map((row, ri) => ri !== rowIdx ? row : { ...row, activeTab: tab }),
      }
    ));
  }, [columns]);

  const dropTab = useCallback((e: DragEvent, toColIdx: number, toRowIdx: number) => {
    e.preventDefault();
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null;
    setColumns(prev => {
      const target = prev[toColIdx].rows[toRowIdx];
      if (target.id === drag.fromPanelId || target.tabs.includes(drag.tab)) return prev;
      let fromCol = -1, fromRow = -1;
      for (let ci = 0; ci < prev.length; ci++)
        for (let ri = 0; ri < prev[ci].rows.length; ri++)
          if (prev[ci].rows[ri].id === drag.fromPanelId) { fromCol = ci; fromRow = ri; }
      let next: ColumnState[] = prev.map((col, ci) =>
        ci !== toColIdx ? col : {
          ...col,
          rows: col.rows.map((row, ri) =>
            ri !== toRowIdx ? row : { ...row, tabs: [...row.tabs, drag.tab], activeTab: drag.tab }
          ),
        }
      );
      if (!drag.isOriginal && fromCol >= 0) {
        const src = next[fromCol].rows[fromRow];
        const newSrcTabs = src.tabs.filter(t => t !== drag.tab);
        if (newSrcTabs.length === 0) {
          if (next[fromCol].rows.length === 1) next = next.filter((_, i) => i !== fromCol);
          else next = next.map((col, ci) => ci !== fromCol ? col : { ...col, rows: col.rows.filter((_, ri) => ri !== fromRow) });
        } else {
          const newActive = src.activeTab === drag.tab ? newSrcTabs[0] : src.activeTab;
          next = next.map((col, ci) =>
            ci !== fromCol ? col : {
              ...col,
              rows: col.rows.map((row, ri) =>
                ri !== fromRow ? row : { ...row, tabs: newSrcTabs, activeTab: newActive }
              ),
            }
          );
        }
      }
      return next;
    });
  }, []);

  const getDropZone = (e: React.DragEvent, el: HTMLElement): 'top' | 'bottom' | 'left' | 'right' => {
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    return Math.abs(x - 0.5) > Math.abs(y - 0.5) ? (x < 0.5 ? 'left' : 'right') : (y < 0.5 ? 'top' : 'bottom');
  };

  const handlePanelBodyDragOver = useCallback((e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    if (!dragRef.current) return;
    e.preventDefault(); e.stopPropagation();
    const zone = getDropZone(e, e.currentTarget);
    setDropTarget(prev => (prev?.panelId === panelId && prev?.zone === zone ? prev : { panelId, zone }));
  }, []);

  const handlePanelBodyDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null);
  }, []);

  const splitAndDropTab = useCallback((targetPanelId: string, zone: 'top' | 'bottom' | 'left' | 'right') => {
    const drag = dragRef.current;
    if (!drag) return;
    dragRef.current = null; setDropTarget(null); setIsDragging(false);
    setColumns(prev => {
      let next: ColumnState[] = prev.map(col => ({ ...col, rows: [...col.rows] }));
      if (!drag.isOriginal) {
        next = next.map(col => ({
          ...col,
          rows: col.rows.map(row => {
            if (row.id !== drag.fromPanelId) return row;
            const tabs = row.tabs.filter(t => t !== drag.tab);
            if (!tabs.length) return null as unknown as PanelState;
            return { ...row, tabs, activeTab: row.activeTab === drag.tab ? tabs[0] : row.activeTab };
          }).filter(Boolean) as PanelState[],
        })).filter(col => col.rows.length > 0);
      }
      let tCol = -1, tRow = -1;
      for (let ci = 0; ci < next.length; ci++)
        for (let ri = 0; ri < next[ci].rows.length; ri++)
          if (next[ci].rows[ri].id === targetPanelId) { tCol = ci; tRow = ri; }
      if (tCol === -1) return next;
      const newPanel: PanelState = { id: uid(), tabs: [drag.tab], activeTab: drag.tab, isOriginal: false };
      if (zone === 'right') next.splice(tCol + 1, 0, { id: uid(), rows: [newPanel] });
      else if (zone === 'left') next.splice(tCol, 0, { id: uid(), rows: [newPanel] });
      else next = next.map((col, ci) => {
        if (ci !== tCol) return col;
        const rows = [...col.rows];
        rows.splice(zone === 'bottom' ? tRow + 1 : tRow, 0, newPanel);
        return { ...col, rows };
      });
      return next;
    });
  }, []);

  const handlePanelBodyDrop = useCallback((e: React.DragEvent<HTMLDivElement>, panelId: string) => {
    e.preventDefault(); e.stopPropagation();
    if (!dragRef.current || !dropTarget) return;
    splitAndDropTab(panelId, dropTarget.zone);
  }, [dropTarget, splitAndDropTab]);

  const startDrag = (fromPanelId: string, tab: TabId, isOriginal: boolean, e: DragEvent<HTMLButtonElement>) => {
    dragRef.current = { fromPanelId, tab, isOriginal };
    e.dataTransfer.effectAllowed = 'move';
    setIsDragging(true);
  };

  return {
    columns,
    isDragging,
    dropTarget,
    dragRef,
    splitRight,
    splitDown,
    closePanel,
    closeTab,
    setActiveTab,
    dropTab,
    handlePanelBodyDragOver,
    handlePanelBodyDragLeave,
    handlePanelBodyDrop,
    startDrag,
  };
}
