import { ChangeEventHandler, FC, useEffect, useState } from "react";
import { useToggle } from "../../hooks";
import { treesDB } from "../../models/db";
import { TreeItem } from "../../models/TreeItem";
import { BsThreeDots } from "react-icons/bs"
import { FaTrash, FaPlus, FaChevronDown, FaChevronUp } from "react-icons/fa"
import { MdEdit, } from "react-icons/md";
import { TreeNode } from "../TreeNode/TreeNode"
import { ModalJunior } from "../ModalJunior/ModalJunior";
import { EditPanel } from "../EditPanel/EditPanel";
import "./NodeRow.scss";

export const NodeRow: FC<{ treeItem: TreeItem, childrenItems: TreeItem[] }> = ({ treeItem, childrenItems }) => {
    const { name, id, treeId, selected, } = treeItem;
    const [showModal, toggleModal] = useToggle();
    const [showChildren, toggleChildren] = useToggle();
    const [showEditNamePanel, toggleShowEditNamePanel] = useToggle();
    const [hasChildren, setHasChildren] = useState(false);

    useEffect(() => {
        setHasChildren(childrenItems?.length > 0)
    }, [childrenItems]);

    const addNode = async (ev: React.MouseEvent<HTMLElement, MouseEvent>) => {
        toggleChildren(ev, true);
        try {
            await treesDB.addChildNode(treeId, "new node", id);
        } catch (error) {
            console.error(error);
        }
    }
    const deleteNode = () => {
        treesDB.deleteNode(id)
    }
    const editName = async (val: string) => {
        try {
            await treesDB.editNode(id, { name: val });
            toggleModal(null, false)
            toggleShowEditNamePanel(null, false);
        } catch (error) {
            console.error(error)
        }
    }
    const checkboxChangeHandler: ChangeEventHandler<HTMLInputElement> = (ev) => {
        ev.stopPropagation();
        const { target } = ev;
        const { checked } = target;
        treesDB.selectNode(id, checked ? 1 : 0);
    }

    return (
        <>
            <div className="row" onClick={toggleChildren}>
                <div className="node-name">
                    <div className="collapsser-con">
                        {!showChildren ?
                            <div title={'פתח'} >
                                <FaChevronDown className="expand-collaps"
                                    pointerEvents={hasChildren ? "all" : "none"}
                                    opacity={hasChildren ? 1 : 0} />
                            </div>
                            :
                            <div title={'סגור'} >
                                <FaChevronUp className="expand-collaps"
                                    pointerEvents={hasChildren ? "all" : "none"}
                                    opacity={hasChildren ? 1 : 0} />
                            </div>

                        }
                    </div>
                    <input id={id} className="checkbox-input" onClick={(ev) => { ev.stopPropagation() }} onChange={checkboxChangeHandler} checked={!!selected} name={id} type="checkbox" />
                    <div title={name} className="label">{name}</div>
                </div>
                <div className="actions-panel">
                    <BsThreeDots onClick={toggleModal} className="btn" />
                </div>
                <ModalJunior show={showModal}>
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
                        : <EditPanel value={name} onSubmit={editName} onCancel={() => toggleShowEditNamePanel(null, false)} />
                    }
                </ModalJunior>
            </div>
            {showChildren && <div className="ul">
                {childrenItems?.map(child => <TreeNode key={child.id} treeItem={child} />)}
            </div>}
        </>

    )
}