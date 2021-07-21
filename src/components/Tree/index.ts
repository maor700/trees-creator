import { TreeClass } from "../../models/Tree";
import { TreeItem } from "../../models/TreeItem";

export {Tree} from "./Tree";

export enum ORIGINS {
    TREE_NODE,
    TREE_NODE_SPACE,
    TREE_HEADER
}

export interface ActionPanelProps {
    origin: ORIGINS,
    show: boolean,
    toggleActionPanel: (ev: any, force?: boolean) => void
    treeItem?: TreeItem,
    treeData?: TreeClass,
    hasChildren?: boolean,
    toggleRow?: (ev:any, force?: boolean) => void,
}