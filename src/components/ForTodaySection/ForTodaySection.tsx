import { FC, useMemo, useEffect, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { MdToday, MdExpandMore, MdExpandLess } from 'react-icons/md';
import { TreeItem } from '../../models/TreeItem';
import { TreeItemData } from '../../models/TreeItemData';
import { treesDB } from '../../models/treesDb';
import { useDnd } from '../../contexts/DndContext';
import { StatusCard } from '../StatusView/StatusCard';
import './ForTodaySection.scss';

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const ForTodaySection: FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { registerDropZone, unregisterDropZone, dragState } = useDnd();
  const dropRef = useRef<HTMLDivElement>(null);
  const dropZoneId = 'for-today-drop';

  const allItems = useLiveQuery<TreeItem<TreeItemData>[]>(
    () => treesDB.treesItems.toArray(),
    [],
    []
  );

  const itemsById = useMemo(() => {
    const map = new Map<string, TreeItem>();
    for (const item of allItems || []) {
      map.set(item.id, item);
    }
    return map;
  }, [allItems]);

  const today = getTodayString();

  const todayItems = useMemo(() => {
    return (allItems || []).filter(item => {
      if (!item.parentPath) return false;
      const data = item.data;
      if (!data) return false;
      return data.forToday === true || data.dueDate === today;
    });
  }, [allItems, today]);

  // Register drop zone
  useEffect(() => {
    if (!dropRef.current) return;

    const dummyItem = {
      id: dropZoneId,
      treeId: '',
      name: 'For Today',
      parentPath: '',
    } as TreeItem;

    registerDropZone(dropZoneId, dropRef.current, {
      id: dropZoneId,
      position: 'inside',
      item: dummyItem,
      type: 'today',
    });

    return () => {
      unregisterDropZone(dropZoneId);
    };
  }, [registerDropZone, unregisterDropZone]);

  const isDragOver = dragState.isDragging && dragState.overId === dropZoneId;

  return (
    <div
      ref={dropRef}
      className={`for-today-section ${isDragOver ? 'drag-over' : ''}`}
    >
      <div className="for-today-header" onClick={() => setCollapsed(c => !c)}>
        <div className="header-left">
          <MdToday size={18} className="today-icon" />
          <span className="header-title">For Today</span>
          <span className="header-count">{todayItems.length}</span>
        </div>
        <button type="button" className="collapse-btn">
          {collapsed ? <MdExpandMore size={20} /> : <MdExpandLess size={20} />}
        </button>
      </div>

      {!collapsed && (
        <div className="for-today-content">
          {todayItems.length === 0 ? (
            <div className="empty-today">No tasks for today</div>
          ) : (
            todayItems.map(item => (
              <StatusCard
                key={item.id}
                item={item}
                itemsById={itemsById}
                showRoot
                showStatusBg
              />
            ))
          )}
        </div>
      )}
    </div>
  );
};
