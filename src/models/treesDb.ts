import Dexie, { liveQuery } from 'dexie';
import dexieCloud, { DexieCloudTable } from 'dexie-cloud-addon';
import { TreeItem } from './TreeItem';
import { INDEXES, STRING_INDEXES } from './indexes';
import { TreeClass } from './Tree';
import { TreesStates } from './TreesStates';
import { AppState } from './AppState';

export const TREES_DB_NAME = "treesDB";
const TREES_ITEMS_TABLE_NAME = "treesItems";
const TREES_TABLE_NAME = "trees";
const TREES_STATES_TABLE_NAME = "treesStates";
const APP_TABLE_NAME = "app";

export const MAX_TREES = 4;

export class TreesDB extends Dexie {
  treesItems!: DexieCloudTable<TreeItem>;
  trees!: DexieCloudTable<TreeClass>;
  treesStates!: DexieCloudTable<TreesStates>;
  app!: DexieCloudTable<AppState>;
  treesItemesDirt!: boolean;

  constructor() {
    super(TREES_DB_NAME, { addons: [dexieCloud] });
    this.version(26).stores({
      [TREES_ITEMS_TABLE_NAME]: STRING_INDEXES,
      [TREES_TABLE_NAME]: "@id, treeName",
      [TREES_STATES_TABLE_NAME]: "@id, treeName",
      [APP_TABLE_NAME]: "@id, key, value",
    });

    this.cloud.configure({
      databaseUrl: process.env.REACT_APP_DBURL!,
      tryUseServiceWorker: true,
      requireAuth: false
    });

    this.treesItems = this.table(TREES_ITEMS_TABLE_NAME) as any;
    this.trees = this.table(TREES_TABLE_NAME) as any;
    this.treesStates = this.table(TREES_STATES_TABLE_NAME) as any;
    this.app = this.table(APP_TABLE_NAME) as any;
    this.treesItems.mapToClass(TreeItem);
    this.trees.mapToClass(TreeClass);
    this.treesStates.mapToClass(TreesStates);
    this.app.mapToClass(AppState);

    this.setAppPropVal("appIsDirt", false);

    // appDirt
    liveQuery(() => this.trees.toArray() && this.treesItems.toArray())
      .subscribe(() => {
        this.setAppPropVal<boolean>("appIsDirt", true)
      })
  }

  _canAddTree = async (): Promise<boolean> => {
    return (await this.trees.count()) < MAX_TREES;
  }

  createNewTree = async (treeName = "", addRoot: boolean = true, initial: Partial<TreeClass> = {}) => {
    if (!await this._canAddTree()) return "";
    return await this.transaction("rw", this.trees, this.treesItems, async () => {
      const { id, ...rest } = initial;
      const finalTree = { ...rest, treeName }
      const treeId = await this.trees.add(finalTree);
      addRoot && await this.addRootNode(treeId, treeName || "root");
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
      if (!await this._canAddTree()) return;
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
        const { parentPath } = item;
        // fix parentPath with new ids
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
    return this.transaction("rw", this.trees, this.treesItems, async () => {
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
        const [tree, children] = await this.getRootAndChildren(nodeId);
      }
    })
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
    return this.treesItems.where(INDEXES.tp).equals([treeId, ""]).first() as Promise<TreeItem>;
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
    /* eslint-disable */
    return await this.treesItems.where(INDEXES.tp).between([treeId, `${parentPath}${nodeId}/`], [treeId, `${parentPath}${nodeId}/` + `\uffff`])
    /* eslint-disable */
  }

  // app table utils

  getAppPropColl = (propName: string) => {
    return this.app.where("key").equals(propName);
  }

  getAppPropVal = async<T = any>(propName: string) => {
    return ((await this.getAppPropColl(propName).first())?.value) as Promise<T>
  }

  setAppPropVal = async<T = any>(propName: string, value: T) => {
    const propExist = !!(await this.getAppPropColl(propName).first());
    if (propExist) {
      return !!((await this.getAppPropColl(propName).modify({ value })))
    } else {
      return !!(await this.app.add({ key: propName, value }))
    }
  }

  /// Trees States

  _saveTreesState = async ({ stateName, id }: { stateName?: string, id?: string }) => (
    this.transaction("rw", this.treesStates, this.treesItems, this.trees, async () => {
      const trees = await this.trees.toArray();
      const treesItems = await this.treesItems.toArray();
      let stateToSave: TreesStates = { trees, treesItems, stateName };
      //update selected state
      if (id) stateToSave.id = id;
      return await this.treesStates.put(stateToSave);
    })
  )

  saveCurrentTree = async (stateName?: string) => {
    const { id, stateName: currName } = await this.getAppPropVal<TreesStates>("selectedState");
    const secceed = await this._saveTreesState({ stateName: stateName ?? currName, id });
    return secceed && await this.setAppPropVal("appIsDirt", false);
  }

  saveNewState = async (stateName: string) => {
    return this._saveTreesState({ stateName });
  }

  loadTreesState = async (id: string) => {
    return this.transaction("rw", this.treesStates, this.treesItems, this.trees, this.app, async () => {
      const state = await this.treesStates.get(id);
      if (!state) return false;
      const { trees, treesItems, stateName } = state;
      await this.trees.clear();
      await this.treesItems.clear();
      await this.trees.bulkPut(trees);
      await this.treesItems.bulkPut(treesItems);
      await this.setAppPropVal("selectedState", state);
      setTimeout(async () => {
        await this.setAppPropVal("appIsDirt", false);
      }, 100)
      return true;
    });
  }

  deleteState = async (id: string) => {
    this.transaction("rw", this.treesStates, this.treesItems, this.trees,this.app, async () => {
      await this.treesStates.delete(id);
      const newSelectedSate = await this.treesStates.toCollection().first();
      newSelectedSate?.id && await this.loadTreesState(newSelectedSate?.id);
    })
  }

}

export const treesDB = new TreesDB();
console.log(treesDB);

// treesDB.on("ready", async () => {
//   const treeId = await treesDB.createNewTree("Categories");
//   if (!treeId) return;
//   const { id, parentPath } = (await treesDB.getRoot(treeId)) || {};
//   const finalParentPath = parentPath + id + "/";
//   return await treesDB.treesItems.bulkAdd(([
//     { treeId, name: "Action", parentPath: finalParentPath } as TreeItem,
//     { treeId, name: "Comedy", parentPath: finalParentPath } as TreeItem,
//     { treeId, name: "Drama", parentPath: finalParentPath } as TreeItem,
//     { treeId, name: "Fantasy", parentPath: finalParentPath } as TreeItem,
//     { treeId, name: "Horror", parentPath: finalParentPath } as TreeItem,
//     { treeId, name: "Mystery", parentPath: finalParentPath } as TreeItem,
//   ]))
// })