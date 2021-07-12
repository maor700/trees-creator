import { liveQuery } from "dexie";
import { FC, useCallback } from "react";
import { TreeClass } from "../../models/Tree";
import { Tree } from "../Tree";
import { from } from "rxjs"
import { treesDB } from "../../models/treesDb";
import { ActionsPanel } from "../ActionsPanel/ActionsPanel";
import { useLiveQuery } from "dexie-react-hooks";
import { TreeItem } from "../../models/TreeItem";

interface OwnProps {
    treeData: TreeClass
}

export const CategoryTree: FC<OwnProps> = ({ treeData }) => {
    const { id } = treeData;
    const root = useLiveQuery(() => treesDB.getRoot(id as string));

    const getChildren = useCallback((treeItem) => {

        return from(liveQuery(async () => {
            const children = (await (await treesDB.getNodeChildrenCollection(treeItem.id as string))?.toArray() ?? [])
            return children as TreeItem[];
        }))
    }, [treesDB]);

    const checkHandler = useCallback(async (treeItem, checked) => {
        return await treesDB.selectNode(treeItem.id, checked ? 1 : 0)
    }, [treeData])

    if (!root) return null;

    return <Tree onRowChecked={checkHandler} root={root} getNodeChildren={getChildren} actionPanelComponent={ActionsPanel} key={treeData.id} treeData={treeData} />
}