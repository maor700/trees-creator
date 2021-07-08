import { useLiveQuery } from "dexie-react-hooks";
import { FC, useState } from "react";
import { useToggle } from "../../hooks";
import { treesDB } from "../../models/db";
import { TreeItem } from "../../models/TreeItem";
import { Pipes } from "./Pipes";
import { NodeRow } from "../NodeRow/NodeRow";
import "./TreeNode.scss";

export const TreeNode: FC<{ treeItem: TreeItem }> = ({ treeItem }) => {
    const [, children] = useLiveQuery(() => treesDB.getNodeAndChildren(treeItem.id), [], [null,[]])
    const { id} = treeItem;

    return (<div className="t-node" key={id}>
        <Pipes />
        <NodeRow treeItem={treeItem} childrenItems={children} />
    </div>)
}