import Dexie, { Table } from 'dexie';
import dexieCloud from 'dexie-cloud-addon';
import { TreeItem } from './TreeItem';
import { INDEXES } from './indexes';
import { TreeClass } from './Tree';
import { TreesStates } from './TreesStates';
import { AppState } from './AppState';

export const TREES_DB_NAME = "treesDB_cloud";
const TREES_ITEMS_TABLE_NAME = "treesItems";
const TREES_TABLE_NAME = "trees";
const TREES_STATES_TABLE_NAME = "treesStates";
const APP_TABLE_NAME = "app";

export const MAX_TREES = 4;

export class TreesDB extends Dexie {
  treesItems!: Table<TreeItem, string>;
  trees!: Table<TreeClass, string>;
  treesStates!: Table<TreesStates, string>;
  app!: Table<AppState, string>;
  treesItemesDirt!: boolean;

  constructor() {
    super(TREES_DB_NAME, { addons: [dexieCloud] });

    // Version 132: Dexie Cloud with @ prefix for synced tables
    // @ prefix = synced with auto-generated cloud IDs
    // No @ prefix = local only
    this.version(132).stores({
      [TREES_ITEMS_TABLE_NAME]: "@id, treeId, parentPath, name, selected, [treeId+parentPath], [treeId+parentPath+name], [treeId+parentPath+selected], [treeId+selected], [treeId]",
      [TREES_TABLE_NAME]: "@id, treeName",
      [TREES_STATES_TABLE_NAME]: "@id, stateName",
      [APP_TABLE_NAME]: "key", // Local only (no @)
    });

    this.treesItems = this.table(TREES_ITEMS_TABLE_NAME);
    this.trees = this.table(TREES_TABLE_NAME);
    this.treesStates = this.table(TREES_STATES_TABLE_NAME);
    this.app = this.table(APP_TABLE_NAME);
    this.treesItems.mapToClass(TreeItem);
    this.trees.mapToClass(TreeClass);
    this.treesStates.mapToClass(TreesStates);
    this.app.mapToClass(AppState);

    // Configure Dexie Cloud
    this.cloud.configure({
      databaseUrl: import.meta.env.VITE_DEXIE_CLOUD_URL || 'https://zu80g6353.dexie.cloud',
      requireAuth: true,
    });

    // Initialize after DB is ready
    this.on('ready', () => {
      this.setAppPropVal("appIsDirt", false).catch(console.error);
    });
  }

  _canAddTree = async (): Promise<boolean> => {
    return (await this.trees.count()) < MAX_TREES;
  }

  createNewTree = async (treeName = "", addRoot: boolean = true, initial: Partial<TreeClass> = {}) => {
    if (!await this._canAddTree()) return "";

    // Spread initial first, then override with our generated values
    // This ensures treeName defaults properly even if initial has empty treeName
    const treeData = {
      ...initial,
      treeName: treeName || `My Tree #${Date.now().toString(36)}`,
    } as TreeClass;

    // Remove id from initial if present - Dexie Cloud will generate it
    delete (treeData as any).id;

    // Save to Dexie (syncs automatically via Dexie Cloud)
    const treeId = await this.trees.add(treeData);

    // Add root node
    if (addRoot) {
      await this.addRootNode(treeId as string, treeData.treeName || "root");
    }

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    return treeId as string;
  }

  getAllTreeItemsCollection = async (treeId: string) => {
    return this.treesItems.where(INDEXES.treeId).equals(treeId);
  }

  deleteTree = async (treeId: string) => {
    const result = await this.transaction<boolean>("rw", this.trees, this.treesItems, async () => {
      try {
        await this.trees.delete(treeId);
        (await this.getAllTreeItemsCollection(treeId)).delete();
        return true
      } catch (error) {
        console.error(error);
        return false
      }
    });

    if (result) {
      await this.setAppPropVal("appIsDirt", true);
    }

    return result;
  }

  editTree = async (treeId: string, changes: Partial<TreeClass>) => {
    const result = await this.trees.update(treeId, changes);
    await this.setAppPropVal("appIsDirt", true);
    return result;
  }

  duplicateTree = async (treeId: string) => {
    if (!await this._canAddTree()) return;

    const currentTree = await this.trees.get(treeId);
    if (!currentTree) return;

    const { treeName, ...rest } = currentTree;
    const newTreeId = await this.createNewTree(`${treeName}-copy`, false, rest);
    if (!newTreeId) return false;

    // get all items from current tree and duplicate them
    const items = await (await this.getAllTreeItemsCollection(treeId)).toArray();
    const idsMap: Record<string, string> = {};

    for (const item of items) {
      const { id, ...itemData } = item;
      const newId = await this.treesItems.add({
        ...itemData,
        treeId: newTreeId,
      } as TreeItem);
      idsMap[id] = newId as string;
    }

    // Fix parentPath with new ids
    const updatedItems = await (await this.getAllTreeItemsCollection(newTreeId)).toArray();
    for (const item of updatedItems) {
      if (item.parentPath) {
        const newParentPath = item.parentPath.split("/").map(id => idsMap[id] || id).join("/");
        await this.treesItems.update(item.id, { parentPath: newParentPath });
      }
    }

    await this.setAppPropVal("appIsDirt", true);

    return newTreeId;
  }

  deleteAllTrees = async () => {
    const results = await Promise.allSettled([this.trees.clear(), this.treesItems.clear()]);
    await this.setAppPropVal("appIsDirt", true);
    return results.every(({ status }) => status === "fulfilled");
  }

  addRootNode = async (treeId: string, name: string) => {
    const alreadyExist = (await this.treesItems.where(INDEXES.tp).equals([treeId, ""]).count()) > 0;
    if (alreadyExist) throw new Error("Tree root node already exist");

    const nodeData = {
      treeId,
      name,
      parentPath: "",
      selected: 0
    } as TreeItem;

    // Save to Dexie (syncs automatically)
    const nodeId = await this.treesItems.add(nodeData);

    return nodeId as string;
  }

  addChildNode = async (treeId: string, name: string, parentId: string) => {
    const parent = await this.treesItems.get(parentId);
    if (!parent) return;
    const parentPath = parent.parentPath + parentId + "/";

    const nodeData = {
      treeId,
      name,
      parentPath,
      selected: 0
    } as TreeItem;

    // Save to Dexie (syncs automatically)
    const nodeId = await this.treesItems.add(nodeData);

    await this.setAppPropVal("appIsDirt", true);

    return nodeId as string;
  }

  editNode = async (nodeId: string, changes: Partial<TreeItem>) => {
    const result = await this.treesItems.update(nodeId, changes);
    await this.setAppPropVal("appIsDirt", true);
    return result;
  }

  selectNode = async (nodeId: string, status?: 1 | 0) => {
    await this.transaction("rw", this.trees, this.treesItems, async () => {
      const [item, children] = await this.getNodeAndChildren(nodeId);
      if (!item) return;
      const { selected, treeId, parentPath } = item;

      if (children?.length) {
        const selectedDescendantsColl = this.treesItems.where(INDEXES.tps).between([treeId, `${parentPath}${nodeId}/`, 1], [treeId, `${parentPath}${nodeId}/` + `\uffff`, 1]);
        const allDescendantsColl = await this.getNodeDescendantsCollection(nodeId);
        const descendantsCount = await allDescendantsColl?.count();
        const selectedCount = await selectedDescendantsColl.count();
        if (descendantsCount !== selectedCount) {
          await this.treesItems.update(nodeId, { selected: 1 });
          await allDescendantsColl?.modify((item) => {
            item.selected = 1;
          })
        } else {
          await this.treesItems.update(nodeId, { selected: 0 });
          await allDescendantsColl?.modify((item) => {
            item.selected = 0;
          })
        }
      } else {
        const newSelected = status ?? (selected ? 0 : 1);
        this.treesItems.update(nodeId, { selected: newSelected });
      }
    });

    await this.setAppPropVal("appIsDirt", true);
  }

  deleteNode = async (nodeId: string) => {
    const result = await this.transaction("rw", this.treesItems, async () => {
      try {
        const coll = await this.getNodeDescendantsCollection(nodeId);
        await this.treesItems.delete(nodeId);
        await coll?.delete();
        return true
      } catch (error) {
        console.error(error);
        return false;
      }
    });

    if (result) {
      await this.setAppPropVal("appIsDirt", true);
    }

    return result;
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
    return await this.treesItems.where(INDEXES.tp).between([treeId, `${parentPath}${nodeId}/`], [treeId, `${parentPath}${nodeId}/` + `\uffff`])
  }

  // app table utils

  getAppPropColl = (propName: string) => {
    return this.app.where("key").equals(propName);
  }

  getAppPropVal = async<T = any>(propName: string) => {
    return ((await this.getAppPropColl(propName).first())?.value) as Promise<T>
  }

  setAppPropVal = async<T = any>(propName: string, value: T) => {
    // Use put which will insert or update based on key
    return !!(await this.app.put({ key: propName, value } as AppState))
  }

  /// Trees States - synced via Dexie Cloud

  _saveTreesState = async ({ stateName, id }: { stateName?: string, id?: string }) => {
    const stateId = await this.transaction("rw", this.treesStates, this.treesItems, this.trees, async () => {
      const trees = await this.trees.toArray();
      const treesItems = await this.treesItems.toArray();
      let stateToSave: TreesStates = { trees, treesItems, stateName };

      if (id) {
        stateToSave.id = id;
        await this.treesStates.put(stateToSave);
        return id;
      } else {
        const newId = await this.treesStates.add(stateToSave);
        return newId as string;
      }
    });

    return stateId;
  }

  saveCurrentTree = async (stateName?: string) => {
    const selectedState = await this.getAppPropVal<TreesStates>("selectedState");
    if (!selectedState) return false;
    const { id, stateName: currName } = selectedState;
    const stateId = await this._saveTreesState({ stateName: stateName ?? currName, id });
    if (stateId) {
      // Update selectedState with new data
      const updatedState = await this.treesStates.get(stateId);
      if (updatedState) {
        await this.setAppPropVal("selectedState", updatedState);
      }
    }
    return stateId && await this.setAppPropVal("appIsDirt", false);
  }

  saveNewState = async (stateName: string) => {
    return this._saveTreesState({ stateName });
  }

  loadTreesState = async (id: string) => {
    return this.transaction("rw", this.treesStates, this.treesItems, this.trees, this.app, async () => {
      const state = await this.treesStates.get(id);
      if (!state) return false;
      const { trees, treesItems } = state;
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
    await this.transaction("rw", this.treesStates, this.treesItems, this.trees, this.app, async () => {
      await this.treesStates.delete(id);
      const newSelectedSate = await this.treesStates.toCollection().first();
      newSelectedSate?.id && await this.loadTreesState(newSelectedSate?.id);
    });
  }
}

export const treesDB = new TreesDB();
