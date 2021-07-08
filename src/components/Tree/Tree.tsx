import { FC } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { treesDB } from "../../models/db";
import { TreeClass } from "../../models/Tree";
import { TreeNode } from "../TreeNode/TreeNode";
import { EditPanel } from "../EditPanel/EditPanel";
import { ModalJunior } from "../ModalJunior/ModalJunior";
import { useToggle } from "../../hooks";
import { FaTrash, FaCopy, FaLightbulb } from "react-icons/fa"
import { MdEdit, } from "react-icons/md";
import { BsThreeDots } from "react-icons/bs";
import { BiSelectMultiple } from "react-icons/bi";
import "./Tree.scss";


export const Tree: FC<{ data: TreeClass }> = ({ data }) => {
    const { id, treeName, rtl, lightMode, multiSelect } = data;
    const [parent] = useLiveQuery(async () => id ? treesDB.getRootAndChildren(id) : [], [], []);
    const [showEditNamePanel, toggleShowEditNamePanel] = useToggle(false);
    const [showModal, toggleModal] = useToggle();

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
        console.log(val)
        try {
            await treesDB.editTree(id, { treeName: val });
            toggleModal(null, false)
            toggleShowEditNamePanel(null, false);
        } catch (error) {
            console.error(error)
        }
    }


    return (
        <div className={`tree-con grid-stick-layout ${multiSelect ? "multi-select-mode" : ""} ${lightMode ? "light-theme" : ""} ${rtl ? "rtl" : ""}`}>
            <div className="head-row header truncate">
                <h4 title={treeName} className="truncate">{treeName}</h4>
                <div className="actions-panel">
                    <BsThreeDots onClick={toggleModal} className="btn" />
                </div>
                <ModalJunior show={showModal}>
                    {!showEditNamePanel ? <div className="content">
                        <div title="ערוך שם עץ">
                            <MdEdit className="btn" onClick={toggleShowEditNamePanel} size={18} />
                        </div>
                        <div title="מחק עץ">
                            <FaTrash className="btn" onClick={deleteTree} />
                        </div>
                        <div title="העתק עץ">
                            <FaCopy className="btn" onClick={duplicateTree} />
                        </div>
                        <div title={`${lightMode ? 'Dark Mode' : 'Light Mode'}`}>
                            <FaLightbulb onClick={() => updateTree(id, { lightMode: !lightMode })} className="btn" />
                        </div>
                        <div title={`${multiSelect ? 'הסתר' : 'הצג'} בחירה מרובה`}>
                            <BiSelectMultiple onClick={() => updateTree(id, { multiSelect: !multiSelect })} className="btn" />
                        </div>
                        <div onClick={() => updateTree(id, { rtl: !rtl })} className="btn">{rtl ? "LTR" : "RTL"}</div>
                    </div>
                        : <EditPanel value={treeName} onSubmit={editTreeName} onCancel={() => toggleShowEditNamePanel(null, false)} />
                    }
                </ModalJunior>
            </div>
            <div className="main">
                {parent && <TreeNode key={parent.id} treeItem={parent} />}
            </div>
        </div>
    )
}
