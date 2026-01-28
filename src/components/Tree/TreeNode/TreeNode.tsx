import { FC, useCallback, useContext, useEffect, useState } from "react";
import { TreeItem } from "../../../models/TreeItem";
import { Pipes } from "./Pipes";
import { NodeRow } from "../NodeRow/NodeRow";
import { treeCtx } from "../Tree";
import { useDnd } from "../../../contexts/DndContext";
import "./TreeNode.scss";

export const TreeNode: FC<{ treeItem: TreeItem }> = ({ treeItem }) => {
    const { id } = treeItem;
    const [childrenItems, setChildrenItems] = useState<TreeItem[]>([]);
    const { getNodeChildren } = useContext(treeCtx);
    const { dragState, registerDropZone, unregisterDropZone } = useDnd();

    // Sort children by order
    const sortedChildren = [...childrenItems].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

    // Callback refs that register drop zones when elements mount
    const setBeforeRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            registerDropZone(`${id}-before`, node, {
                id: `${id}-before`,
                position: 'before',
                item: treeItem,
            });
        } else {
            unregisterDropZone(`${id}-before`);
        }
    }, [id, treeItem, registerDropZone, unregisterDropZone]);

    const setInsideRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            registerDropZone(`${id}-inside`, node, {
                id: `${id}-inside`,
                position: 'inside',
                item: treeItem,
            });
        } else {
            unregisterDropZone(`${id}-inside`);
        }
    }, [id, treeItem, registerDropZone, unregisterDropZone]);

    const setAfterRef = useCallback((node: HTMLDivElement | null) => {
        if (node) {
            registerDropZone(`${id}-after`, node, {
                id: `${id}-after`,
                position: 'after',
                item: treeItem,
            });
        } else {
            unregisterDropZone(`${id}-after`);
        }
    }, [id, treeItem, registerDropZone, unregisterDropZone]);

    useEffect(() => {
        const subscription = getNodeChildren?.(treeItem)
            .subscribe((childrenItems) => {
                setChildrenItems(childrenItems);
            });
        return () => { subscription?.unsubscribe() };
    }, [getNodeChildren, treeItem])

    const isDragging = dragState.isDragging;
    const isDraggedItem = dragState.draggedItem?.id === id;
    const isOverBefore = dragState.overId === `${id}-before`;
    const isOverInside = dragState.overId === `${id}-inside`;
    const isOverAfter = dragState.overId === `${id}-after`;

    return (
        <div className={`t-node ${isDraggedItem ? 'is-dragging' : ''}`} key={id}>
            <Pipes />
            <div className="node-drop-zones">
                {isDragging && !isDraggedItem && (
                    <div
                        ref={setBeforeRef}
                        className={`drop-zone drop-zone-before ${isOverBefore ? 'drop-zone-active' : ''}`}
                    />
                )}
                <div ref={setInsideRef} className={`node-content ${isOverInside && isDragging && !isDraggedItem ? 'drop-zone-inside-active' : ''}`}>
                    <NodeRow treeItem={treeItem} childrenItems={sortedChildren} />
                </div>
                {isDragging && !isDraggedItem && (
                    <div
                        ref={setAfterRef}
                        className={`drop-zone drop-zone-after ${isOverAfter ? 'drop-zone-active' : ''}`}
                    />
                )}
            </div>
        </div>
    );
}
