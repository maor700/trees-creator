import { TreeItem } from "./TreeItem"

export const FIELDS_INDEXES: { [K in keyof TreeItem]: string } = {
    id: "++id",
    treeId: "treeId",
    parentPath: "parentPath",
    name: "name",
    order: "order",
    selected: "selected"
}

export const INDEXES = {
    ...FIELDS_INDEXES,
    t: `[${FIELDS_INDEXES.treeId}]`,
    tp: `[${FIELDS_INDEXES.treeId}+${FIELDS_INDEXES.parentPath}]`,
    tpo: `[${FIELDS_INDEXES.treeId}+${FIELDS_INDEXES.parentPath}+${FIELDS_INDEXES.order}]`,
    tpn: `[${FIELDS_INDEXES.treeId}+${FIELDS_INDEXES.parentPath}+${FIELDS_INDEXES.name}]`,
    tps: `[${FIELDS_INDEXES.treeId}+${FIELDS_INDEXES.parentPath}+${FIELDS_INDEXES.selected}]`,
    ts: `[${FIELDS_INDEXES.treeId}+${FIELDS_INDEXES.selected}]`,
}

export const STRING_INDEXES = Object.values(INDEXES).join(", ");