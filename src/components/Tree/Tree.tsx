import { createContext, FC, useCallback, useEffect, useRef, useState } from "react";
import { TreeClass } from "../../models/Tree";
import { TreeNode } from "./TreeNode/TreeNode";
import { ModalJunior } from "../ModalJunior/ModalJunior";
import { useToggle } from "../../hooks";
import { BsThreeDots } from "react-icons/bs";
import { FaPlus } from "react-icons/fa";
import { Blurred } from "../Blurred/Blurred";
import { TreeItem } from "../../models/TreeItem";
import { ReactNode } from "react";
import { Observable } from "rxjs";
import { ActionsPanel } from "../ActionsPanel/ActionsPanel";
import { ActionPanelProps, ORIGINS } from ".";
import { treesDB } from "../../models/treesDb";
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
    const { treeData, root, getNodeChildren } = props;
    const { treeName, rtl, lightMode, multiSelect } = treeData;
    const [showActionPanel, toggleActionPanel] = useToggle();
    const [rootChildren, setRootChildren] = useState<TreeItem[]>([]);
    const menuBtnRef = useRef<HTMLDivElement>(null);

    // Fetch root's children directly to display them without showing the root node
    useEffect(() => {
        if (!root) return;
        const subscription = getNodeChildren(root).subscribe((children) => {
            const sorted = [...children].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            setRootChildren(sorted);
        });
        return () => subscription.unsubscribe();
    }, [root, getNodeChildren]);

    // Add new item to root
    const handleAddItem = useCallback(async () => {
        if (!root || !treeData.id) return;
        try {
            await treesDB.addChildNode(String(treeData.id), "new item", root.id);
        } catch (error) {
            console.error('Error adding item:', error);
        }
    }, [root, treeData.id]);

    return (
        <treeCtx.Provider value={props}>
            <div className={`tree-con grid-stick-layout ${multiSelect ? "multi-select-mode" : ""} ${lightMode ? "light-theme" : ""} ${rtl ? "rtl" : ""}`}>
                <div className="head-row header truncate">
                    <h4 title={treeName || 'Untitled'} className="truncate">{treeName || 'Untitled'}</h4>
                    <div className="header-actions">
                        <div className="add-item-btn" onClick={handleAddItem} title="Add item">
                            <FaPlus className="btn" />
                        </div>
                        <div ref={menuBtnRef} className="actions-panel" onClick={toggleActionPanel}>
                            <BsThreeDots className="btn" />
                        </div>
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
                    {rootChildren.map(child => <TreeNode key={child.id} treeItem={child} />)}
                </div>
            </div>
        </treeCtx.Provider>
    )
}

export const treeCtx = createContext<Partial<TreeProps>>({})
