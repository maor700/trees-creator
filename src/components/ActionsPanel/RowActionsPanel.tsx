import { FC, useCallback } from "react";
import { FaPlus, FaTrash, FaGripVertical } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useToggle } from "../../hooks";
import { treesDB } from "../../models/treesDb";
import { ActionPanelProps, ORIGINS } from "../Tree";
import { EditPanel } from "./EditPanel/EditPanel";

export const RowActionsPanel: FC<ActionPanelProps> = ({ treeItem, toggleRow, toggleActionPanel, origin, onStartDrag }) => {
    const [showEditNamePanel, toggleShowEditNamePanel] = useToggle(origin === ORIGINS.TREE_NODE_SPACE);
    const editName = useCallback(async (val: string) => {
        try {
            await treesDB.editNode(id, { name: val });
            toggleActionPanel(null, false)
            toggleShowEditNamePanel(null, false);
        } catch (error) {
            console.error(error)
        }
    }, [treesDB]);

    const cancelHandler = useCallback(() => {
        if (origin === ORIGINS.TREE_NODE_SPACE) {
            toggleActionPanel(null, false);
        }
        toggleShowEditNamePanel(null, false)
    }, [])

    if (!treeItem) return null;
    const { treeId, id, name } = treeItem;

    const addNode = async (ev: any) => {
        toggleRow?.(null, true);
        try {
            await treesDB.addChildNode(treeId, "new node", id);
        } catch (error) {
            console.error(error);
        }
    }
    const deleteNode = async () => {
        const { id: rootId } = await treesDB.getRoot(treeId) || {};
        let allowed = true;
        if (rootId === id) {
            allowed = false;
        }
        allowed && treesDB.deleteNode(id)
    }

    const handleDragStart = useCallback((event: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        toggleActionPanel(null, false);
        onStartDrag?.(event);
    }, [toggleActionPanel, onStartDrag]);

    return (
        <>
            {!showEditNamePanel ? <div className="content">
                <div
                    title="גרור"
                    className="drag-btn"
                    onPointerDown={handleDragStart}
                    onTouchStart={handleDragStart as any}
                >
                    <FaGripVertical className="btn" />
                </div>
                <div title="ערוך" onClick={toggleShowEditNamePanel}>
                    <MdEdit className="btn" size={18} />
                </div>
                <div title="הוסף פריט" onClick={addNode}>
                    <FaPlus className="btn" />
                </div>
                <div title="מחק פריט" onClick={deleteNode}>
                    <FaTrash className="btn" />
                </div>
            </div>
                : <EditPanel value={name} onSubmit={editName} onCancel={cancelHandler} />}
        </>
    )
}