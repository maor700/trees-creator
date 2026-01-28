import { ChangeEventHandler, FC, useCallback, useContext, useEffect, useState } from "react";
import { useToggle } from "../../../hooks";
import { TreeItem } from "../../../models/TreeItem";
import { TreeItemData, TreeItemStatus } from "../../../models/TreeItemData";
import { treesDB } from "../../../models/treesDb";
import { BsThreeDots } from "react-icons/bs"
import { FaChevronDown, FaChevronUp, FaInfoCircle } from "react-icons/fa"
import { TreeNode } from "../TreeNode/TreeNode"
import { ModalJunior } from "../../ModalJunior/ModalJunior";
import { ItemDetailsModal } from "../../ItemDetailsModal";
import { treeCtx } from "../Tree";
import { ORIGINS } from "../";
import { useDnd } from "../../../contexts/DndContext";
import "./NodeRow.scss";

const STATUS_OPTIONS: { value: TreeItemStatus; label: string; color: string }[] = [
    { value: 'not_started', label: 'Not Started', color: '#6b7280' },
    { value: 'in_progress', label: 'In Progress', color: '#3b82f6' },
    { value: 'completed', label: 'Completed', color: '#22c55e' },
    { value: 'blocked', label: 'Blocked', color: '#ef4444' },
];

export const NodeRow: FC<{ treeItem: TreeItem<TreeItemData>, childrenItems: TreeItem<TreeItemData>[] }> = ({ treeItem, childrenItems }) => {
    const { name, id, selected, data } = treeItem;
    const { onRowChecked, onRowToggle, actionPanelComponent: ActionPanelComponent, onRowKeyDown } = useContext(treeCtx);
    const [showActionPanel, toggleActionPanel] = useToggle();
    const [showChildren, toggleChildren] = useToggle();
    const [showDetailsModal, toggleDetailsModal] = useToggle();
    const [hasChildren, setHasChildren] = useState(false);
    const [origin, setOrigin] = useState<ORIGINS>(ORIGINS.TREE_NODE);
    const [itemData, setItemData] = useState<TreeItemData>(data || {});
    const { startDrag, dragState } = useDnd();

    const handleStartDrag = useCallback((event: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
        startDrag(treeItem, event);
    }, [startDrag, treeItem]);

    // Sync itemData when treeItem.data changes
    useEffect(() => {
        setItemData(treeItem.data || {});
    }, [treeItem.data]);

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

    // Cycle through status options
    const handleStatusClick = useCallback(async (ev: React.MouseEvent) => {
        ev.stopPropagation();
        const currentStatus = itemData.status || 'not_started';
        const currentIndex = STATUS_OPTIONS.findIndex(s => s.value === currentStatus);
        const nextIndex = (currentIndex + 1) % STATUS_OPTIONS.length;
        const nextStatus = STATUS_OPTIONS[nextIndex].value;

        const newData = {
            ...itemData,
            status: nextStatus,
            lastModified: new Date().toISOString(),
        };
        setItemData(newData);

        try {
            await treesDB.editNode(id, { data: newData });
        } catch (error) {
            console.error('Error updating status:', error);
        }
    }, [id, itemData]);

    // Open details modal
    const handleDetailsClick = useCallback((ev: React.MouseEvent) => {
        ev.stopPropagation();
        toggleDetailsModal(null, true);
    }, [toggleDetailsModal]);

    const currentStatus = STATUS_OPTIONS.find(s => s.value === (itemData.status || 'not_started')) || STATUS_OPTIONS[0];

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

                {/* Row action buttons */}
                <div className="row-actions">
                    <button
                        type="button"
                        className="row-action-btn status-btn"
                        onClick={handleStatusClick}
                        title={`Status: ${currentStatus.label} (click to change)`}
                        style={{ backgroundColor: currentStatus.color }}
                    >
                        <span className="status-dot" />
                    </button>

                    <button
                        type="button"
                        className="row-action-btn details-btn"
                        onClick={handleDetailsClick}
                        title="Open details"
                    >
                        <FaInfoCircle size={16} />
                    </button>
                </div>

                {
                    ActionPanelComponent ?
                        <>
                            <div className="actions-panel" onClick={(ev) => { ev.stopPropagation(); actionPanelToggleHandler() }}>
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
                                        onOpenDetails={() => toggleDetailsModal(null, true)}
                                        onStartDrag={handleStartDrag}
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
            {showDetailsModal && (
                <ItemDetailsModal
                    treeItem={{ ...treeItem, data: itemData }}
                    onClose={() => toggleDetailsModal(null, false)}
                />
            )}
        </>

    )
}
