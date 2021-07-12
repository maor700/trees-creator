import { ChangeEventHandler, FC, useContext, useEffect, useState } from "react";
import { useToggle } from "../../../hooks";
import { TreeItem } from "../../../models/TreeItem";
import { BsThreeDots } from "react-icons/bs"
import { FaChevronDown, FaChevronUp } from "react-icons/fa"
import { TreeNode } from "../TreeNode/TreeNode"
import { ModalJunior } from "../../ModalJunior/ModalJunior";
import { Blurred } from "../../Blurred/Blurred";
import { treeCtx } from "../Tree";
import { ORIGINS } from "../";
import "./NodeRow.scss";

export const NodeRow: FC<{ treeItem: TreeItem, childrenItems: TreeItem[] }> = ({ treeItem, childrenItems }) => {
    const { name, id, selected } = treeItem;
    const { onRowChecked, onRowToggle, actionPanelComponent: ActionPanelComponent } = useContext(treeCtx);
    const [showActionPanel, toggleActionPanel] = useToggle();
    const [showChildren, toggleChildren] = useToggle();
    const [hasChildren, setHasChildren] = useState(false);

    useEffect(() => {
        setHasChildren(!!childrenItems?.length)
    }, [childrenItems])

    useEffect(() => {
        onRowToggle?.(treeItem, showChildren);
    }, [showChildren])

    const checkboxChangeHandler: ChangeEventHandler<HTMLInputElement> = (ev) => {
        ev.stopPropagation();
        const { target } = ev;
        const { checked } = target;
        onRowChecked?.(treeItem, checked)
    }

    return (
        <>
            <div className="row">
                <div className="name-con" onClick={(ev) => { ev.stopPropagation(); hasChildren && toggleChildren(null) }} >
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
                </div>
                {
                    ActionPanelComponent ?
                        <>
                            <div className="actions-panel">
                                <BsThreeDots onClick={toggleActionPanel} className="btn" />
                            </div>
                            <Blurred onBlur={(ev) => toggleActionPanel(ev, false)} shouldBlur={showActionPanel}>
                                <div onClick={(ev) => { ev.stopPropagation() }}>
                                    <ModalJunior show={showActionPanel}>
                                        <ActionPanelComponent
                                            origin={ORIGINS.TREE_NODE}
                                            show={showActionPanel}
                                            toggleActionPanel={toggleActionPanel}
                                            treeItem={treeItem}
                                            hasChildren={hasChildren}
                                            toggleRow={toggleChildren}
                                        />
                                    </ModalJunior>
                                </div>
                            </Blurred>
                        </>
                        : null
                }
            </div>
            {
                showChildren && <div className="ul">
                    {childrenItems?.map(child => <TreeNode key={child.id} treeItem={child} />)}
                </div>
            }
        </>

    )
}