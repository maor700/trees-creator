import { createContext, FC, useRef } from "react";
import { TreeClass } from "../../models/Tree";
import { TreeNode } from "./TreeNode/TreeNode";
import { ModalJunior } from "../ModalJunior/ModalJunior";
import { useToggle } from "../../hooks";
import { BsThreeDots } from "react-icons/bs";
import { Blurred } from "../Blurred/Blurred";
import { TreeItem } from "../../models/TreeItem";
import { ReactNode } from "react";
import { Observable } from "rxjs";
import { ActionsPanel } from "../ActionsPanel/ActionsPanel";
import { ActionPanelProps, ORIGINS } from ".";
import "./Tree.scss";

interface TreeProps {
    treeData: TreeClass;
    root: TreeItem
    actionPanelComponent?: FC<ActionPanelProps>;
    getNodeChildren: (treeItem?: TreeItem) => Observable<TreeItem[]>
    onRowChecked?: (itemId: TreeItem, status: boolean) => ReactNode,
    onRowToggle?: (itemId: TreeItem, isCollapsed: boolean) => void;
    onRowKeyDown?: (ev: React.KeyboardEvent<any>, treeItem: TreeItem) => void
}

export const Tree: FC<TreeProps> = (props) => {
    const { treeData, root } = props;
    const { treeName, rtl, lightMode, multiSelect } = treeData;
    const [showActionPanel, toggleActionPanel] = useToggle();
    const menuBtnRef = useRef<HTMLDivElement>(null);

    return (
        <treeCtx.Provider value={props}>
            <div className={`tree-con grid-stick-layout ${multiSelect ? "multi-select-mode" : ""} ${lightMode ? "light-theme" : ""} ${rtl ? "rtl" : ""}`}>
                <div className="head-row header truncate">
                    <h4 title={treeName || 'Untitled'} className="truncate">{treeName || 'Untitled'}</h4>
                    <div ref={menuBtnRef} className="actions-panel" onClick={toggleActionPanel}>
                        <BsThreeDots className="btn" />
                    </div>
                    <Blurred shouldBlur={showActionPanel} excludedElements={menuBtnRef.current ? [menuBtnRef.current] : []} onBlur={(ev) => toggleActionPanel(ev, false)}>
                        <ModalJunior show={showActionPanel}>
                            <ActionsPanel
                                origin={ORIGINS.TREE_HEADER}
                                treeData={treeData}
                                show={showActionPanel}
                                toggleActionPanel={toggleActionPanel}
                            />
                        </ModalJunior>
                    </Blurred>
                </div>
                <div className="main">
                    {root && <TreeNode key={root.id} treeItem={root} />}
                </div>
            </div>
        </treeCtx.Provider>
    )
}

export const treeCtx = createContext<Partial<TreeProps>>({})
