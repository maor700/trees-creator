import { FC, useEffect, useRef, useMemo, useCallback } from 'react';
import { BsPin, BsPinFill } from 'react-icons/bs';
import { TreeItem } from '../../models/TreeItem';
import { TreeItemData, TreeItemStatus } from '../../models/TreeItemData';
import { TreeClass } from '../../models/Tree';
import { useDnd } from '../../contexts/DndContext';
import { StatusCard } from './StatusCard';

interface StatusColumnProps {
  status: TreeItemStatus;
  label: string;
  color: string;
  items: TreeItem<TreeItemData>[];
  trees: TreeClass[];
  itemsById: Map<string, TreeItem>;
  isPinned?: boolean;
  onPin?: (status: TreeItemStatus) => void;
}

export const StatusColumn: FC<StatusColumnProps> = ({
  status,
  label,
  color,
  items,
  trees,
  itemsById,
  isPinned,
  onPin,
}) => {
  const { registerDropZone, unregisterDropZone, dragState } = useDnd();
  const columnRef = useRef<HTMLDivElement>(null);
  const dropZoneId = `status-column-${status}`;

  // Group items by tree
  const itemsByTree = useMemo(() => {
    const grouped = new Map<string, TreeItem<TreeItemData>[]>();
    for (const item of items) {
      const existing = grouped.get(item.treeId) || [];
      existing.push(item);
      grouped.set(item.treeId, existing);
    }
    return grouped;
  }, [items]);

  // Get tree name by ID
  const getTreeName = (treeId: string): string => {
    const tree = trees.find(t => t.id === treeId);
    return tree?.treeName || 'Unknown Tree';
  };

  // Register drop zone for status changes
  useEffect(() => {
    if (!columnRef.current) return;

    // Create a dummy TreeItem for the drop zone info
    // The DndContext will check if type === 'status' and handle differently
    const dummyItem = {
      id: dropZoneId,
      treeId: '',
      name: label,
      parentPath: '',
    } as TreeItem;

    registerDropZone(dropZoneId, columnRef.current, {
      id: dropZoneId,
      position: 'inside',
      item: dummyItem,
      type: 'status',
      targetStatus: status,
    });

    return () => {
      unregisterDropZone(dropZoneId);
    };
  }, [dropZoneId, status, label, registerDropZone, unregisterDropZone]);

  // Check if we're dragging over this column
  const isDragOver = dragState.isDragging && dragState.overId === dropZoneId;

  const handlePinClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onPin?.(status);
  }, [onPin, status]);

  return (
    <div className={`status-column ${isPinned ? 'pinned' : ''}`}>
      <div className="column-header" style={{ borderColor: color }}>
        <span className="column-title">{label}</span>
        <div className="column-header-actions">
          <button
            type="button"
            className={`pin-btn ${isPinned ? 'pinned' : ''}`}
            onClick={handlePinClick}
            title={isPinned ? 'Pinned to top' : 'Pin to top'}
          >
            {isPinned ? <BsPinFill size={14} /> : <BsPin size={14} />}
          </button>
          <span className="column-count">{items.length}</span>
        </div>
      </div>
      <div
        ref={columnRef}
        className={`column-content ${isDragOver ? 'drag-over' : ''}`}
      >
        {items.length === 0 ? (
          <div className="empty-column">No items</div>
        ) : (
          Array.from(itemsByTree.entries()).map(([treeId, treeItems]) => (
            <div key={treeId} className="tree-group">
              {itemsByTree.size > 1 && (
                <div className="tree-group-header">{getTreeName(treeId)}</div>
              )}
              {treeItems.map(item => (
                <StatusCard
                  key={item.id}
                  item={item}
                  itemsById={itemsById}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
