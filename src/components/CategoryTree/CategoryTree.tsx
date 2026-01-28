import { liveQuery } from "dexie";
import { FC, useCallback } from "react";
import { TreeClass } from "../../models/Tree";
import { Tree } from "../Tree";
import { from } from "rxjs";
import { treesDB } from "../../models/treesDb";
import { ActionsPanel } from "../ActionsPanel/ActionsPanel";
import { useLiveQuery } from "dexie-react-hooks";
import { TreeItem } from "../../models/TreeItem";

interface OwnProps {
    treeData: TreeClass
}

export const CategoryTree: FC<OwnProps> = ({ treeData }) => {
    const { id } = treeData;
    const treeIdStr = String(id);
    const root = useLiveQuery(() => treesDB.getRoot(treeIdStr), [treeIdStr]);

    const getChildren = useCallback((treeItem) => {

        return from(liveQuery(async () => {
            const children = (await (await treesDB.getNodeChildrenCollection(treeItem.id as string))?.toArray() ?? [])
            // Sort children by order field
            return (children as TreeItem[]).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        }))
    }, [treesDB]);

    const onRowKeyDownHandler = useCallback(({ code, key }, { id: itemId }) => {
        if (key === "+" && treeIdStr) {
            treesDB.addChildNode(treeIdStr, "new node", itemId)
        }
        if (code === "Delete") {
            treesDB.deleteNode(itemId);
        }
    }, [treeIdStr])

    const checkHandler = useCallback(async (treeItem, checked) => {
        return await treesDB.selectNode(treeItem.id, checked ? 1 : 0)
    }, [treeData])

    if (!root) return null;

    return <Tree
        onRowKeyDown={onRowKeyDownHandler}
        onRowChecked={checkHandler} root={root}
        getNodeChildren={getChildren}
        actionPanelComponent={ActionsPanel}
        key={treeData.id}
        treeData={treeData} />
}