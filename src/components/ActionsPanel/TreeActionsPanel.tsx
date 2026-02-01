import { FC, useContext, useMemo } from "react";
import { BiSelectMultiple } from "react-icons/bi";
import { FaTrash, FaCopy, FaLightbulb } from "react-icons/fa";
import { MdEdit } from "react-icons/md";
import { useToggle } from "../../hooks";
import { treesDB } from "../../models/treesDb";
import { TreeClass } from "../../models/Tree";
import { ActionPanelProps } from "../Tree";
import { treeCtx } from "../Tree/Tree";
import { EditPanel } from "./EditPanel/EditPanel";

export const TreeActionsPanel: FC<ActionPanelProps> = ({ toggleActionPanel, treeData }) => {
    const [showEditNamePanel, toggleShowEditNamePanel] = useToggle(false);
    if (!treeData) return null;
    const { id, treeName, lightMode, multiSelect } = treeData;

    if (id === undefined) return null;

    const deleteTree = () => {
        treesDB.deleteTree(id)
    }
    const duplicateTree = () => {
        treesDB.duplicateTree(id)
    }
    const updateTree = async (id: string, changes: Partial<TreeClass>) => {
        return await treesDB.trees.update(id, changes);
    }

    const editTreeName = async (val: string) => {
        try {
            toggleActionPanel(null, false)
            toggleShowEditNamePanel(null, false);
            await treesDB.editTree(id, { treeName: val });
        } catch (error) {
            console.error(error)
        }
    }
    return (
        <>
            {!showEditNamePanel ? <div className="content">
                <div title="Edit tree name">
                    <MdEdit className="btn" onClick={toggleShowEditNamePanel} size={18} />
                </div>
                <div title="Delete tree">
                    <FaTrash className="btn" onClick={deleteTree} />
                </div>
                <div title="Duplicate tree">
                    <FaCopy className="btn" onClick={duplicateTree} />
                </div>
                <div title={`${lightMode ? 'Dark Mode' : 'Light Mode'}`}>
                    <FaLightbulb onClick={() => updateTree(id, { lightMode: !lightMode })} className="btn" />
                </div>
                <div title={`${multiSelect ? 'hide' : 'show'} multiselect`}>
                    <BiSelectMultiple onClick={() => updateTree(id, { multiSelect: !multiSelect })} className="btn" />
                </div>
            </div>
                : <EditPanel value={treeName} onSubmit={editTreeName} onCancel={() => toggleShowEditNamePanel(null, false)} />
            }
        </>
    )
}


