import { FC, useCallback, useRef, useState } from 'react';
import { BsThreeDots } from 'react-icons/bs';
import { FaInfoCircle, FaPlus, FaTrash, FaGripVertical } from 'react-icons/fa';
import { MdEdit } from 'react-icons/md';
import { TreeItem } from '../../models/TreeItem';
import { TreeItemData, TreeItemStatus } from '../../models/TreeItemData';
import { treesDB } from '../../models/treesDb';
import { useDnd } from '../../contexts/DndContext';
import { useToggle } from '../../hooks';
import { Breadcrumb } from './Breadcrumb';
import { ItemDetailsModal } from '../ItemDetailsModal/ItemDetailsModal';
import { ModalJunior } from '../ModalJunior/ModalJunior';
import { Blurred } from '../Blurred/Blurred';
import { EditPanel } from '../ActionsPanel/EditPanel/EditPanel';

interface StatusCardProps {
  item: TreeItem<TreeItemData>;
  itemsById: Map<string, TreeItem>;
}

const STATUS_OPTIONS: { value: TreeItemStatus; label: string; color: string }[] = [
  { value: 'not_started', label: 'Not Started', color: '#6b7280' },
  { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'completed', label: 'Completed', color: '#22c55e' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
];

export const StatusCard: FC<StatusCardProps> = ({ item, itemsById }) => {
  const { startDrag, dragState } = useDnd();
  const [showModal, setShowModal] = useState(false);
  const [showActionPanel, toggleActionPanel] = useToggle(false);
  const [showEditPanel, toggleEditPanel] = useToggle(false);
  const [itemData, setItemData] = useState<TreeItemData>(item.data || {});
  const menuBtnRef = useRef<HTMLButtonElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    startDrag(item, e);
  }, [item, startDrag]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (dragState.isDragging) return;
    e.stopPropagation();
    setShowModal(true);
  }, [dragState.isDragging]);

  // Cycle through status options
  const handleStatusClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const currentStatus = itemData.status || 'not_started';
    const currentIndex = STATUS_OPTIONS.findIndex(s => s.value === currentStatus);
    const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
    const nextStatus = STATUS_OPTIONS[nextIndex].value;

    const newData = {
      ...itemData,
      status: nextStatus,
      lastModified: new Date().toISOString(),
    };
    setItemData(newData);

    try {
      await treesDB.editNode(item.id, { data: newData });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }, [item.id, itemData]);

  // Open details modal
  const handleDetailsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
  }, []);

  // Toggle actions menu
  const handleActionsClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    toggleActionPanel();
  }, [toggleActionPanel]);

  // Edit name
  const handleEditName = useCallback(async (newName: string) => {
    try {
      await treesDB.editNode(item.id, { name: newName });
      toggleEditPanel(null, false);
      toggleActionPanel(null, false);
    } catch (error) {
      console.error('Error editing name:', error);
    }
  }, [item.id, toggleEditPanel, toggleActionPanel]);

  // Add child node
  const handleAddChild = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await treesDB.addChildNode(item.treeId, 'new node', item.id);
      toggleActionPanel(null, false);
    } catch (error) {
      console.error('Error adding child:', error);
    }
  }, [item.treeId, item.id, toggleActionPanel]);

  // Delete node
  const handleDelete = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const root = await treesDB.getRoot(item.treeId);
    if (root?.id === item.id) {
      return; // Don't delete root
    }
    try {
      await treesDB.deleteNode(item.id);
      toggleActionPanel(null, false);
    } catch (error) {
      console.error('Error deleting node:', error);
    }
  }, [item.treeId, item.id, toggleActionPanel]);

  // Drag from action panel
  const handleDragStart = useCallback((e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleActionPanel(null, false);
    startDrag(item, e);
  }, [toggleActionPanel, startDrag, item]);

  const isDragging = dragState.isDragging && dragState.draggedItem?.id === item.id;
  const currentStatus = STATUS_OPTIONS.find(s => s.value === (itemData.status || 'not_started')) || STATUS_OPTIONS[0];

  return (
    <>
      <div
        className={`status-card ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
      >
        <Breadcrumb item={item} itemsById={itemsById} />
        <div className="card-content">
          <div className="card-name" onPointerDown={handlePointerDown}>{item.name}</div>
          <div className="card-actions">
            <button
              type="button"
              className="card-action-btn status-btn"
              onClick={handleStatusClick}
              title={`Status: ${currentStatus.label} (click to change)`}
              style={{ backgroundColor: currentStatus.color }}
            />
            <button
              type="button"
              className="card-action-btn details-btn"
              onClick={handleDetailsClick}
              title="Open details"
            >
              <FaInfoCircle size={14} />
            </button>
            <button
              ref={menuBtnRef}
              type="button"
              className="card-action-btn menu-btn"
              onClick={handleActionsClick}
              title="Actions"
            >
              <BsThreeDots size={14} />
            </button>
          </div>
        </div>

        {/* Actions Menu */}
        <Blurred
          onBlur={() => { toggleActionPanel(null, false); toggleEditPanel(null, false); }}
          shouldBlur={showActionPanel}
          excludedElements={menuBtnRef.current ? [menuBtnRef.current] : []}
        >
          <ModalJunior show={showActionPanel}>
            {!showEditPanel ? (
              <div className="content">
                <div
                  title="Drag"
                  className="drag-btn"
                  onPointerDown={handleDragStart}
                  onTouchStart={handleDragStart as any}
                >
                  <FaGripVertical className="btn" />
                </div>
                <div title="Edit" onClick={() => toggleEditPanel(null, true)}>
                  <MdEdit className="btn" size={18} />
                </div>
                <div title="Add child" onClick={handleAddChild}>
                  <FaPlus className="btn" />
                </div>
                <div title="Delete" onClick={handleDelete}>
                  <FaTrash className="btn" />
                </div>
              </div>
            ) : (
              <EditPanel
                value={item.name}
                onSubmit={handleEditName}
                onCancel={() => toggleEditPanel(null, false)}
              />
            )}
          </ModalJunior>
        </Blurred>
      </div>
      {showModal && (
        <ItemDetailsModal
          treeItem={{ ...item, data: itemData }}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};
