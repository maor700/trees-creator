import { FC, useMemo, useCallback } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { TreeClass } from '../../models/Tree';
import { TreeItem } from '../../models/TreeItem';
import { TreeItemData, TreeItemStatus } from '../../models/TreeItemData';
import { treesDB } from '../../models/treesDb';
import { StatusColumn } from './StatusColumn';
import './StatusView.scss';

interface StatusViewProps {
  trees: TreeClass[];
}

const STATUS_COLUMNS: { status: TreeItemStatus; label: string; color: string }[] = [
  { status: 'not_started', label: 'Not Started', color: '#6b7280' },
  { status: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { status: 'completed', label: 'Completed', color: '#22c55e' },
  { status: 'blocked', label: 'Blocked', color: '#ef4444' },
];

export const StatusView: FC<StatusViewProps> = ({ trees }) => {
  // Get pinned column (default to 'in_progress')
  const pinnedColumn = useLiveQuery<TreeItemStatus>(
    () => treesDB.getAppPropVal('pinnedStatusColumn'),
    [],
    'in_progress'
  );

  // Handle pin toggle
  const handlePinColumn = useCallback((status: TreeItemStatus) => {
    treesDB.setAppPropVal('pinnedStatusColumn', status);
  }, []);
  // Query all tree items
  const allItems = useLiveQuery<TreeItem<TreeItemData>[]>(
    () => treesDB.treesItems.toArray(),
    [],
    []
  );

  // Create a map of items by ID for breadcrumb lookups
  const itemsById = useMemo(() => {
    const map = new Map<string, TreeItem>();
    for (const item of allItems || []) {
      map.set(item.id, item);
    }
    return map;
  }, [allItems]);

  // Group items by status
  const itemsByStatus = useMemo(() => {
    const grouped: Record<TreeItemStatus, TreeItem<TreeItemData>[]> = {
      not_started: [],
      in_progress: [],
      completed: [],
      blocked: [],
    };

    for (const item of allItems || []) {
      // Skip root nodes (items without a parent - these are tree roots)
      if (!item.parentPath) continue;

      const status: TreeItemStatus = item.data?.status || 'not_started';
      grouped[status].push(item);
    }

    return grouped;
  }, [allItems]);

  // Sort columns with pinned one first (for mobile)
  const sortedColumns = useMemo(() => {
    const columns = [...STATUS_COLUMNS];
    if (pinnedColumn) {
      columns.sort((a, b) => {
        if (a.status === pinnedColumn) return -1;
        if (b.status === pinnedColumn) return 1;
        return 0;
      });
    }
    return columns;
  }, [pinnedColumn]);

  return (
    <div className="status-view">
      {sortedColumns.map(({ status, label, color }) => (
        <StatusColumn
          key={status}
          status={status}
          label={label}
          color={color}
          items={itemsByStatus[status]}
          trees={trees}
          itemsById={itemsById}
          isPinned={pinnedColumn === status}
          onPin={handlePinColumn}
        />
      ))}
    </div>
  );
};
