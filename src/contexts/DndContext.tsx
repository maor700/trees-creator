import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { TreeItem } from '../models/TreeItem';
import { treesDB } from '../models/treesDb';

interface DragState {
  isDragging: boolean;
  draggedItem: TreeItem | null;
  position: { x: number; y: number } | null;
  overId: string | null;
  overPosition: 'before' | 'after' | 'inside' | null;
  overItem: TreeItem | null;
}

interface DropZoneInfo {
  id: string;
  position: 'before' | 'after' | 'inside';
  item: TreeItem;
}

interface DndContextValue {
  dragState: DragState;
  startDrag: (item: TreeItem, event: React.PointerEvent | React.TouchEvent | React.MouseEvent) => void;
  endDrag: () => void;
  registerDropZone: (id: string, element: HTMLElement, info: DropZoneInfo) => void;
  unregisterDropZone: (id: string) => void;
}

const DndCtx = createContext<DndContextValue | null>(null);

export const useDnd = () => {
  const context = useContext(DndCtx);
  if (!context) {
    throw new Error('useDnd must be used within DndProvider');
  }
  return context;
};

interface DndProviderProps {
  children: ReactNode;
}

export const DndProvider: React.FC<DndProviderProps> = ({ children }) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedItem: null,
    position: null,
    overId: null,
    overPosition: null,
    overItem: null,
  });

  const dropZonesRef = useRef<Map<string, { element: HTMLElement; info: DropZoneInfo }>>(new Map());
  const draggedItemRef = useRef<TreeItem | null>(null);

  const registerDropZone = useCallback((id: string, element: HTMLElement, info: DropZoneInfo) => {
    dropZonesRef.current.set(id, { element, info });
  }, []);

  const unregisterDropZone = useCallback((id: string) => {
    dropZonesRef.current.delete(id);
  }, []);

  const findDropZoneAtPoint = useCallback((x: number, y: number): DropZoneInfo | null => {
    // Use elementsFromPoint to find all elements at the position
    const elements = document.elementsFromPoint(x, y);

    for (const element of elements) {
      // Check if this element or any parent is a registered drop zone
      let current: Element | null = element;
      while (current) {
        for (const [id, { element: dropElement, info }] of dropZonesRef.current) {
          if (current === dropElement) {
            return info;
          }
        }
        current = current.parentElement;
      }
    }
    return null;
  }, []);

  const performDrop = useCallback(async (draggedItem: TreeItem, dropInfo: DropZoneInfo) => {
    const { position, item: overItem } = dropInfo;

    // Don't drop on self
    if (draggedItem.id === overItem.id) {
      return;
    }

    // Prevent dropping a parent onto its own descendant
    if (overItem.parentPath.includes(draggedItem.id)) {
      return;
    }

    try {
      if (position === 'inside') {
        // Move as child of the target (append to end)
        await treesDB.moveNode(
          draggedItem.id,
          overItem.id,
          overItem.treeId
        );
      } else if (position === 'before' || position === 'after') {
        // Move as sibling - get the parent from overItem's parentPath
        const parentPath = overItem.parentPath;

        // If overItem is at root level (parentPath is empty), we can't drop before/after it
        // as that would create another root. Instead, drop as last child of overItem.
        if (!parentPath) {
          await treesDB.moveNode(
            draggedItem.id,
            overItem.id,
            overItem.treeId
          );
          return;
        }

        // Extract parent ID from parentPath (e.g., "abc/def/" -> "def")
        const parentId = parentPath.split('/').filter(Boolean).pop() ?? null;

        // Pass the sibling info so moveNode can calculate order after normalization
        await treesDB.moveNode(
          draggedItem.id,
          parentId,
          overItem.treeId,
          undefined,
          { siblingId: overItem.id, position }
        );
      }
    } catch (error) {
      console.error('Error moving node:', error);
    }
  }, []);

  const handlePointerMove = useCallback((event: PointerEvent) => {
    const x = event.clientX;
    const y = event.clientY;

    const dropInfo = findDropZoneAtPoint(x, y);

    setDragState(prev => ({
      ...prev,
      position: { x, y },
      overId: dropInfo?.id ?? null,
      overPosition: dropInfo?.position ?? null,
      overItem: dropInfo?.item ?? null,
    }));
  }, [findDropZoneAtPoint]);

  const handlePointerUp = useCallback(async (event: PointerEvent) => {
    const x = event.clientX;
    const y = event.clientY;

    const dropInfo = findDropZoneAtPoint(x, y);
    const draggedItem = draggedItemRef.current;

    if (dropInfo && draggedItem) {
      await performDrop(draggedItem, dropInfo);
    }

    // Clean up
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);

    draggedItemRef.current = null;
    setDragState({
      isDragging: false,
      draggedItem: null,
      position: null,
      overId: null,
      overPosition: null,
      overItem: null,
    });
  }, [findDropZoneAtPoint, performDrop, handlePointerMove]);

  const handlePointerCancel = useCallback(() => {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);

    draggedItemRef.current = null;
    setDragState({
      isDragging: false,
      draggedItem: null,
      position: null,
      overId: null,
      overPosition: null,
      overItem: null,
    });
  }, [handlePointerMove, handlePointerUp]);

  const startDrag = useCallback((item: TreeItem, event: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    // Get pointer position from the event
    let x: number, y: number;
    if ('touches' in event && event.touches.length > 0) {
      x = event.touches[0].clientX;
      y = event.touches[0].clientY;
    } else if ('clientX' in event) {
      x = event.clientX;
      y = event.clientY;
    } else {
      return;
    }

    draggedItemRef.current = item;

    setDragState({
      isDragging: true,
      draggedItem: item,
      position: { x, y },
      overId: null,
      overPosition: null,
      overItem: null,
    });

    // Add document-level event listeners
    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerCancel);
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  const endDrag = useCallback(() => {
    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
    document.removeEventListener('pointercancel', handlePointerCancel);

    draggedItemRef.current = null;
    setDragState({
      isDragging: false,
      draggedItem: null,
      position: null,
      overId: null,
      overPosition: null,
      overItem: null,
    });
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [handlePointerMove, handlePointerUp, handlePointerCancel]);

  const value: DndContextValue = {
    dragState,
    startDrag,
    endDrag,
    registerDropZone,
    unregisterDropZone,
  };

  return (
    <DndCtx.Provider value={value}>
      {children}
      {dragState.isDragging && dragState.draggedItem && dragState.position && (
        <div
          className="drag-overlay"
          style={{
            position: 'fixed',
            left: dragState.position.x + 10,
            top: dragState.position.y + 10,
            pointerEvents: 'none',
            zIndex: 10000,
          }}
        >
          <span className="drag-overlay-name">{dragState.draggedItem.name}</span>
        </div>
      )}
    </DndCtx.Provider>
  );
};
