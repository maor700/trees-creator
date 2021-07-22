import { TreeClass } from "./Tree";
import { TreeItem } from "./TreeItem";

export class TreesStates {
    id?: string;
    stateName?: string;
    trees!: TreeClass[];
    treesItems!: TreeItem[]
}