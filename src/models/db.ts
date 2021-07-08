import Dexie from 'dexie';
import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon';
import { TreeItem } from './TreeItem';
import { INDEXES, STRING_INDEXES } from './indexes';
import { TreeClass } from './Tree';

export const TREES_DB_NAME = "treesDB";
const TREES_ITEMS_TABLE_NAME = "treesItems";
const TREES_TABLE_NAME = "trees";
export const MAX_TREES = 4;

export class TreesDB extends Dexie {
  treesItems!: DexieCloudTable<TreeItem>;
  trees!: DexieCloudTable<TreeClass>;

  constructor() {
    super(TREES_DB_NAME, { addons: [dexieCloud] });
    this.version(12).stores({
      [TREES_ITEMS_TABLE_NAME]: STRING_INDEXES,
      [TREES_TABLE_NAME]: "@id, treeName"
    });

    this.cloud.configure({
      databaseUrl: process.env.REACT_APP_DBURL!,
      tryUseServiceWorker: true,
      requireAuth: false
    });

    this.treesItems = this.table(TREES_ITEMS_TABLE_NAME) as any;
    this.trees = this.table(TREES_TABLE_NAME) as any;
    this.treesItems.mapToClass(TreeItem);
    this.trees.mapToClass(TreeClass);
  }

  _canAddTree = async (): Promise<boolean> => {
    return (await this.trees.count()) < MAX_TREES;
  }

  createNewTree = async (treeName = "", addRoot: boolean = true, initial: Partial<TreeClass> = {}) => {
    if (!await this._canAddTree()) return "";
    return this.transaction("rw", this.trees, this.treesItems, async () => {
      const finalTree = { ...initial, id: undefined, treeName }
      const treeId = await this.trees.add(finalTree);
      addRoot && this.addRootNode(treeId, "root");
      !treeName && treeId && this.trees.update(treeId, { treeName: `My Tree #${treeId}` })
      return treeId;
    })
  }

  getAllTreeItemsCollection = async (treeId: string) => {
    return this.treesItems.where(INDEXES.treeId).equals(treeId);
  }

  deleteTree = async (treeId: string) => {
    return this.transaction<boolean>("rw", this.trees, this.treesItems, async () => {
      try {
        await this.trees.delete(treeId);
        (await this.getAllTreeItemsCollection(treeId)).delete();
        return true
      } catch (error) {
        console.error(error);
        return false
      }
    });
  }

  editTree = async (treeId: string, changes: Partial<TreeClass>) => {
    return this.trees.update(treeId, changes);
  }

  duplicateTree = async (treeId: string) => {

    return await this.transaction("rw", this.trees, this.treesItems, async () => {
      if (!await this._canAddTree()) return "";
      // check if exist
      const currentTree = await treesDB.trees.get(treeId);
      if (!currentTree) return;
      // create new Tree with no treeItems
      const { treeName } = currentTree;
      const newTreeId = await this.createNewTree(`${treeName}-copy`, false, currentTree);
      if (!newTreeId) return false;

      // get all items from current tree
      const coll = await this.getAllTreeItemsCollection(treeId);
      const idsMap: any = {};

      // iterate over them and add each with the new treeId
      await coll.each(async (item) => {
        const newNodeId = await this.treesItems.add({ ...item, treeId: newTreeId, id: undefined as any });
        idsMap[item.id] = newNodeId;
      });

      const newTreeColl = await this.getAllTreeItemsCollection(newTreeId);
      await newTreeColl.modify((item, ref) => {
        const { id, parentPath } = item;
        const newParentPath = parentPath.split("/").map(_ => idsMap[_]).join("/")
        const newItem = { ...item, parentPath: newParentPath };
        ref.value = newItem;
      })
    })
  }

  deleteAllTrees = async () => {
    const results = await Promise.allSettled([this.trees.clear(), this.treesItems.clear()])
    return results.every(({ status }) => status === "fulfilled");
  }

  addRootNode = async (treeId: string, name: string) => {
    const alreadyExist = (await this.treesItems.where(INDEXES.tp).equals([treeId, ""]).count()) > 0;
    if (alreadyExist) throw "Tree root node already exist";
    return await this.treesItems.add({ treeId, name, parentPath: "" } as any);
  }

  addChildNode = async (treeId: string, name: string, parentId: string) => {
    const parent = await this.treesItems.get(parentId);
    if (!parent) return;
    const parentPath = parent.parentPath + parentId + "/";
    return await this.treesItems.add({ treeId, name, parentPath } as TreeItem);
  }

  editNode = async (nodeId: string, changes: Partial<TreeItem>) => {
    return this.treesItems.update(nodeId, changes);
  }

  selectNode = async (nodeId: string, status?: 1 | 0) => {
    const [item, children] = await this.getNodeAndChildren(nodeId);
    if (!item) return;
    const { selected, treeId, parentPath } = item;

    if (children?.length) {
      // if all selected unselect all
      const selectedDescendantsColl = this.treesItems.where(INDEXES.tps).between([treeId, `${parentPath}${nodeId}/`, 1], [treeId, `${parentPath}${nodeId}/` + `\uffff`, 1]);
      const allDescendantsColl = await this.getNodeDescendantsCollection(nodeId);
      const descendantsCount = await allDescendantsColl?.count();
      const selectedCount = await selectedDescendantsColl.count();
      if (descendantsCount !== selectedCount) {
        await this.treesItems.update(nodeId, { selected: 1 });
        await allDescendantsColl?.modify({ selected: 1 })
      } else {
        await this.treesItems.update(nodeId, { selected: 0 });
        await allDescendantsColl?.modify({ selected: 0 })
      }
      // else select all
    } else {
      this.treesItems.update(nodeId, { selected: status ?? selected ? 1 : 0 });
      const [tree, children] =  await this.getRootAndChildren(nodeId);
    }
  }

  deleteNode = async (nodeId: string) => {
    return this.transaction("rw", this.treesItems, async () => {
      try {
        const coll = await this.getNodeDescendantsCollection(nodeId);
        await this.treesItems.delete(nodeId);
        await coll?.delete();
        return true
      } catch (error) {
        console.error(error);
        return false;
      }
    })
  }

  getRoot = async (treeId: string) => {
    return this.treesItems.where(INDEXES.tp).equals([treeId, ""]).first();
  }

  getRootAndChildren = async (treeId: string): Promise<[TreeItem | null, TreeItem[]]> => {
    const root = await this.getRoot(treeId);
    if (root === undefined) return [null, []];
    return this.getNodeAndChildren(root.id)
  }

  getNodeAndChildren = async (nodeId: string): Promise<[TreeItem | null, TreeItem[]]> => {
    const node = await this.treesItems.get(nodeId) ?? null;
    if (!node) return [null, []];
    const children = (await (await this.getNodeChildrenCollection(nodeId))?.toArray() ?? [])
    return [node, children];
  }

  getNodeChildrenCollection = async (nodeId: string) => {
    const { treeId, parentPath, id } = await this.treesItems.get(nodeId) ?? {};
    if (!(id ?? treeId ?? treeId)) return;
    return this.treesItems.where(INDEXES.tp).equals([treeId, `${parentPath}${id}/`] as string[]);
  }

  getNodeDescendantsCollection = async (nodeId: string) => {
    const { treeId, parentPath } = await this.treesItems.get(nodeId) ?? {};
    if (!(treeId ?? treeId)) return;
    return await this.treesItems.where(INDEXES.tp).between([treeId, `${parentPath}${nodeId}/`], [treeId, `${parentPath}${nodeId}/` + `\uffff`])
  }
}

export const treesDB = new TreesDB();
console.log(treesDB);

// const data = JSON.parse("[{\"treeId\":\"myTree\",\"name\":\"node-1\",\"parentPath\":\"\",\"data\":{\"a\":1,\"b\":2},\"id\":1},{\"treeId\":\"myTree\",\"name\":\"node-2\",\"parentPath\":\"node-1/\",\"data\":{\"a\":1,\"b\":2},\"id\":2},{\"treeId\":\"a\",\"name\":\"b\",\"parentPath\":\"\",\"id\":3},{\"treeId\":\"a\",\"name\":\"maor\",\"parentPath\":\"3/\",\"id\":4},{\"treeId\":\"a\",\"name\":\"elimelech\",\"parentPath\":\"3/4/\",\"id\":5},{\"treeId\":\"a\",\"name\":\"elimelech2\",\"parentPath\":\"3/4/\",\"id\":6},{\"treeId\":\"a\",\"name\":\"elimelech3\",\"parentPath\":\"3/4/\",\"id\":7},{\"treeId\":\"a\",\"name\":\"elimelech4\",\"parentPath\":\"3/4/\",\"id\":8},{\"treeId\":\"a\",\"name\":\"elimelech5\",\"parentPath\":\"3/4/\",\"id\":9}]")

// db.on("populate", async (tn) => {
//   await db.treesItems.bulkAdd(data)
// });

