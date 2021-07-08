export class TreeItem<T = any> {
    id!: string;
    treeId!: string;
    name!: string;
    parentPath!: string;
    data?: T;
    selected?: 1 | 0;
}