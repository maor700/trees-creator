export class TreeItem<T = any> {
    id!: string;
    treeId!: string;
    name!: string;
    parentPath!: string;
    order?: number;
    data?: T;
    selected?: 1 | 0;
}