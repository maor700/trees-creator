import { FC } from "react";
import { FaPlus, FaTrash } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useToggle } from "../../hooks";
import { treesDB } from "../../models/treesDb";
import { ActionPanelProps } from "../Tree";
import { EditPanel } from "./EditPanel/EditPanel";

export const RowActionsPanel: FC<ActionPanelProps> = ({ treeItem, toggleRow, toggleActionPanel }) => {
    const [showEditNamePanel, toggleShowEditNamePanel] = useToggle();
    if (!treeItem) return null;
    const { treeId, id, name } = treeItem;

    const addNode = async (ev: React.MouseEvent<HTMLElement, MouseEvent>) => {
        toggleRow?.(true);
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
    const editName = async (val: string) => {
        try {
            await treesDB.editNode(id, { name: val });
            toggleActionPanel(null, false)
            toggleShowEditNamePanel(null, false);
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <>
            {!showEditNamePanel ? <div className="content">
                <div title="ערוך">
                    <MdEdit className="btn" onClick={toggleShowEditNamePanel} size={18} />
                </div>
                <div title="הוסף פריט">
                    <FaPlus className="btn" onClick={addNode as any} />
                </div>
                <div title="מחק פריט">
                    <FaTrash className="btn" onClick={deleteNode} />
                </div>
            </div>
                : <EditPanel value={name} onSubmit={editName} onCancel={() => toggleShowEditNamePanel(null, false)} />}
        </>
    )
}