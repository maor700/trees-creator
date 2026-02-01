import React, { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from 'react';
import { TreeItem } from '../models/TreeItem';
import { TreeItemStatus } from '../models/TreeItemData';
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
  type?: 'tree' | 'status';
  targetStatus?: TreeItemStatus;
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
  const scrollIntervalRef = useRef<number | null>(null);
  const lastClientYRef = useRef<number>(0);
  const lastClientXRef = useRef<number>(0);
  const listenersRef = useRef<{
    pointerMove: ((e: PointerEvent) => void) | null;
    pointerUp: ((e: PointerEvent) => void) | null;
    pointerCancel: (() => void) | null;
    touchMove: ((e: TouchEvent) => void) | null;
    touchEnd: ((e: TouchEvent) => void) | null;
  }>({
    pointerMove: null,
    pointerUp: null,
    pointerCancel: null,
    touchMove: null,
    touchEnd: null,
  });

  const registerDropZone = useCallback((id: string, element: HTMLElement, info: DropZoneInfo) => {
    dropZonesRef.current.set(id, { element, info });
  }, []);

  const unregisterDropZone = useCallback((id: string) => {
    dropZonesRef.current.delete(id);
  }, []);

  // Auto-scroll when dragging near edges
  const EDGE_THRESHOLD = 80; // pixels from edge to trigger scroll
  const SCROLL_SPEED = 8; // pixels per frame

  const startAutoScroll = useCallback((clientX: number, clientY: number) => {
    // Update the refs with current position
    lastClientXRef.current = clientX;
    lastClientYRef.current = clientY;

    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    // If already scrolling, let the existing loop continue with updated ref
    if (scrollIntervalRef.current) {
      return;
    }

    const scroll = () => {
      // Read the latest position from refs
      const currentX = lastClientXRef.current;
      const currentY = lastClientYRef.current;
      const currentViewportHeight = window.innerHeight;
      const currentViewportWidth = window.innerWidth;

      // Find the scrollable containers
      const treeContainer = document.querySelector('.trees-con') as HTMLElement;
      const statusView = document.querySelector('.status-view') as HTMLElement;

      let shouldContinue = false;

      // Vertical scrolling (for both tree view and mobile status view)
      if (currentY < EDGE_THRESHOLD) {
        // Near top - scroll up
        const speed = SCROLL_SPEED * (1 - currentY / EDGE_THRESHOLD);
        if (treeContainer) treeContainer.scrollTop -= speed;
        if (statusView) statusView.scrollTop -= speed;
        window.scrollBy(0, -speed);
        shouldContinue = true;
      } else if (currentY > currentViewportHeight - EDGE_THRESHOLD) {
        // Near bottom - scroll down
        const speed = SCROLL_SPEED * (1 - (currentViewportHeight - currentY) / EDGE_THRESHOLD);
        if (treeContainer) treeContainer.scrollTop += speed;
        if (statusView) statusView.scrollTop += speed;
        window.scrollBy(0, speed);
        shouldContinue = true;
      }

      // Horizontal scrolling (for desktop status view)
      if (statusView) {
        if (currentX < EDGE_THRESHOLD) {
          // Near left - scroll left
          const speed = SCROLL_SPEED * (1 - currentX / EDGE_THRESHOLD);
          statusView.scrollLeft -= speed;
          shouldContinue = true;
        } else if (currentX > currentViewportWidth - EDGE_THRESHOLD) {
          // Near right - scroll right
          const speed = SCROLL_SPEED * (1 - (currentViewportWidth - currentX) / EDGE_THRESHOLD);
          statusView.scrollLeft += speed;
          shouldContinue = true;
        }
      }

      if (!shouldContinue) {
        // Not near edges - stop scrolling
        scrollIntervalRef.current = null;
        return;
      }

      // Continue scrolling
      scrollIntervalRef.current = requestAnimationFrame(scroll);
    };

    // Check if we're near any edge to start scrolling
    const nearVerticalEdge = clientY < EDGE_THRESHOLD || clientY > viewportHeight - EDGE_THRESHOLD;
    const nearHorizontalEdge = clientX < EDGE_THRESHOLD || clientX > viewportWidth - EDGE_THRESHOLD;

    if (nearVerticalEdge || nearHorizontalEdge) {
      scrollIntervalRef.current = requestAnimationFrame(scroll);
    }
  }, []);

  const stopAutoScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      cancelAnimationFrame(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
  }, []);

  const findDropZoneAtPoint = useCallback((x: number, y: number): DropZoneInfo | null => {
    const elements = document.elementsFromPoint(x, y);

    for (const element of elements) {
      let current: Element | null = element;
      while (current) {
        for (const [, { element: dropElement, info }] of dropZonesRef.current) {
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

    // Handle status column drops
    if (dropInfo.type === 'status' && dropInfo.targetStatus) {
      const newData = {
        ...draggedItem.data,
        status: dropInfo.targetStatus,
        lastModified: new Date().toISOString(),
      };
      await treesDB.treesItems.update(draggedItem.id, { data: newData });
      return;
    }

    if (draggedItem.id === overItem.id) {
      return;
    }

    if (overItem.parentPath.includes(draggedItem.id)) {
      return;
    }

    try {
      if (position === 'inside') {
        await treesDB.moveNode(
          draggedItem.id,
          overItem.id,
          overItem.treeId
        );
      } else if (position === 'before' || position === 'after') {
        const parentPath = overItem.parentPath;

        if (!parentPath) {
          await treesDB.moveNode(
            draggedItem.id,
            overItem.id,
            overItem.treeId
          );
          return;
        }

        const parentId = parentPath.split('/').filter(Boolean).pop() ?? null;

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

  const cleanupListeners = useCallback(() => {
    const listeners = listenersRef.current;

    if (listeners.pointerMove) {
      document.removeEventListener('pointermove', listeners.pointerMove);
    }
    if (listeners.pointerUp) {
      document.removeEventListener('pointerup', listeners.pointerUp);
    }
    if (listeners.pointerCancel) {
      document.removeEventListener('pointercancel', listeners.pointerCancel);
    }
    if (listeners.touchMove) {
      document.removeEventListener('touchmove', listeners.touchMove);
    }
    if (listeners.touchEnd) {
      document.removeEventListener('touchend', listeners.touchEnd);
      document.removeEventListener('touchcancel', listeners.touchEnd);
    }

    listenersRef.current = {
      pointerMove: null,
      pointerUp: null,
      pointerCancel: null,
      touchMove: null,
      touchEnd: null,
    };

    // Stop auto-scroll
    stopAutoScroll();

    // Restore body scroll behavior
    document.body.style.touchAction = '';
    document.body.style.overflow = '';
    document.body.classList.remove('dragging');
  }, [stopAutoScroll]);

  const resetDragState = useCallback(() => {
    draggedItemRef.current = null;
    setDragState({
      isDragging: false,
      draggedItem: null,
      position: null,
      overId: null,
      overPosition: null,
      overItem: null,
    });
  }, []);

  const startDrag = useCallback((item: TreeItem, event: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
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

    // Prevent scrolling on mobile during drag
    document.body.style.touchAction = 'none';
    document.body.style.overflow = 'hidden';
    document.body.classList.add('dragging');

    setDragState({
      isDragging: true,
      draggedItem: item,
      position: { x, y },
      overId: null,
      overPosition: null,
      overItem: null,
    });

    // Create move handler
    const handleMove = (clientX: number, clientY: number) => {
      const dropInfo = findDropZoneAtPoint(clientX, clientY);

      // Trigger auto-scroll when near edges
      startAutoScroll(clientX, clientY);

      setDragState(prev => ({
        ...prev,
        position: { x: clientX, y: clientY },
        overId: dropInfo?.id ?? null,
        overPosition: dropInfo?.position ?? null,
        overItem: dropInfo?.item ?? null,
      }));
    };

    // Create end handler
    const handleEnd = async (clientX: number, clientY: number) => {
      const dropInfo = findDropZoneAtPoint(clientX, clientY);
      const draggedItem = draggedItemRef.current;

      if (dropInfo && draggedItem) {
        await performDrop(draggedItem, dropInfo);
      }

      cleanupListeners();
      resetDragState();
    };

    // Create cancel handler
    const handleCancel = () => {
      cleanupListeners();
      resetDragState();
    };

    // Pointer event handlers
    const pointerMoveHandler = (e: PointerEvent) => {
      e.preventDefault();
      handleMove(e.clientX, e.clientY);
    };

    const pointerUpHandler = (e: PointerEvent) => {
      handleEnd(e.clientX, e.clientY);
    };

    // Touch event handlers
    const touchMoveHandler = (e: TouchEvent) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        handleMove(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const touchEndHandler = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        handleEnd(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
      } else {
        handleCancel();
      }
    };

    // Store listeners in ref
    listenersRef.current = {
      pointerMove: pointerMoveHandler,
      pointerUp: pointerUpHandler,
      pointerCancel: handleCancel,
      touchMove: touchMoveHandler,
      touchEnd: touchEndHandler,
    };

    // Add event listeners
    document.addEventListener('pointermove', pointerMoveHandler);
    document.addEventListener('pointerup', pointerUpHandler);
    document.addEventListener('pointercancel', handleCancel);
    document.addEventListener('touchmove', touchMoveHandler, { passive: false });
    document.addEventListener('touchend', touchEndHandler);
    document.addEventListener('touchcancel', touchEndHandler);
  }, [findDropZoneAtPoint, performDrop, cleanupListeners, resetDragState, startAutoScroll]);

  const endDrag = useCallback(() => {
    cleanupListeners();
    resetDragState();
  }, [cleanupListeners, resetDragState]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupListeners();
    };
  }, [cleanupListeners]);

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
