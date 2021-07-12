import { FC, useContext, useEffect, useState } from "react";
import { TreeItem } from "../../../models/TreeItem";
import { Pipes } from "./Pipes";
import { NodeRow } from "../NodeRow/NodeRow";
import { treeCtx } from "../Tree";
import "./TreeNode.scss";

export const TreeNode: FC<{ treeItem: TreeItem }> = ({ treeItem }) => {
    const { id } = treeItem;
    const [childrenItems, setChildrenItems] = useState<TreeItem[]>([]);
    const { getNodeChildren } = useContext(treeCtx);

    useEffect(() => {
        const subscription = getNodeChildren?.(treeItem)
            .subscribe((childrenItems) => {
                setChildrenItems(childrenItems);
            });
        return () => { subscription?.unsubscribe() };
    }, [getNodeChildren])

    return (<div className="t-node" key={id}>
        <Pipes />
        <NodeRow treeItem={treeItem} childrenItems={childrenItems} />
    </div>)
}