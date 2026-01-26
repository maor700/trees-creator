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
    const { onRowChecked, onRowToggle, actionPanelComponent: ActionPanelComponent, onRowKeyDown } = useContext(treeCtx);
    const [showActionPanel, toggleActionPanel] = useToggle();
    const [showChildren, toggleChildren] = useToggle();
    const [hasChildren, setHasChildren] = useState(false);
    const [origin, setOrigin] = useState<ORIGINS>(ORIGINS.TREE_NODE);

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

    const actionPanelToggleHandler = (status?: boolean, origin: ORIGINS = ORIGINS.TREE_NODE) => {
        setOrigin(origin);
        toggleActionPanel(null, status);
    }

    const rowClickHandler = (ev: any) => { ev?.stopPropagation(); hasChildren && toggleChildren(null) }

    return (
        <>
            <div tabIndex={1} className="row" onKeyUp={(ev) => {
                ev?.code === "Enter" && rowClickHandler(ev);
                ev?.code === "Space" && actionPanelToggleHandler(true, ORIGINS.TREE_NODE_SPACE)
                onRowKeyDown?.(ev, treeItem);
            }}>
                <div className="name-con" onClick={rowClickHandler} >
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
                            <div className="actions-panel" onClick={() => { actionPanelToggleHandler() }}>
                                <BsThreeDots className="btn" />
                            </div>
                            <div onClick={(ev) => { ev.stopPropagation() }}>
                                <ModalJunior show={showActionPanel}>
                                    <ActionPanelComponent
                                        origin={origin}
                                        show={showActionPanel}
                                        toggleActionPanel={toggleActionPanel}
                                        treeItem={treeItem}
                                        hasChildren={hasChildren}
                                        toggleRow={toggleChildren}
                                    />
                                </ModalJunior>
                            </div>
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