import Dexie, { Table } from 'dexie';
import { TreeItem } from './TreeItem';
import { INDEXES } from './indexes';
import { TreeClass } from './Tree';
import { TreesStates } from './TreesStates';
import { AppState } from './AppState';

export const TREES_DB_NAME = "treesDB_local";
const TREES_ITEMS_TABLE_NAME = "treesItems";
const TREES_TABLE_NAME = "trees";
const TREES_STATES_TABLE_NAME = "treesStates";
const APP_TABLE_NAME = "app";

export const MAX_TREES = 4;

// Generate UUID for local use
const generateId = () => crypto.randomUUID();

// Lazy-load syncService to avoid circular dependency
let _syncService: any = null;
const getSyncService = async () => {
  if (!_syncService) {
    const module = await import('../services/syncService');
    _syncService = module.syncService;
  }
  return _syncService;
};

// Background sync helper - doesn't block UI
const syncInBackground = async (fn: (syncService: any) => Promise<void>) => {
  try {
    const syncService = await getSyncService();
    if (syncService.getCurrentUserId()) {
      await fn(syncService);
    }
  } catch (error) {
    console.error('Background sync error:', error);
  }
};

export class TreesDB extends Dexie {
  treesItems!: Table<TreeItem, string>;
  trees!: Table<TreeClass, string>;
  treesStates!: Table<TreesStates, string>;
  app!: Table<AppState, string>;
  treesItemesDirt!: boolean;

  constructor() {
    super(TREES_DB_NAME);
    // Version 131: Local-first with UUID IDs, key as primary for app table
    // Note: Version increased from 14 to 131 to handle migration from Dexie Cloud (which was at v130)
    this.version(131).stores({
      [TREES_ITEMS_TABLE_NAME]: "id, treeId, parentPath, name, selected, [treeId+parentPath], [treeId+parentPath+name], [treeId+parentPath+selected], [treeId+selected], [treeId]",
      [TREES_TABLE_NAME]: "id, treeName",
      [TREES_STATES_TABLE_NAME]: "id, stateName",
      [APP_TABLE_NAME]: "key",
    });

    this.treesItems = this.table(TREES_ITEMS_TABLE_NAME);
    this.trees = this.table(TREES_TABLE_NAME);
    this.treesStates = this.table(TREES_STATES_TABLE_NAME);
    this.app = this.table(APP_TABLE_NAME);
    this.treesItems.mapToClass(TreeItem);
    this.trees.mapToClass(TreeClass);
    this.treesStates.mapToClass(TreesStates);
    this.app.mapToClass(AppState);

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

    const treeId = generateId();
    const finalTreeName = treeName || `My Tree #${treeId.substring(0, 4)}`;

    // Spread initial first, then override with our generated values
    // This ensures treeName defaults properly even if initial has empty treeName
    const treeData = {
      ...initial,
      id: treeId,
      treeName: finalTreeName,
    } as TreeClass;

    // Save to local Dexie first
    await this.trees.put(treeData);

    // Add root node
    let rootNodeId: string | undefined;
    if (addRoot) {
      rootNodeId = await this.addRootNode(treeId, finalTreeName || "root");
    }

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      await syncService.saveTreeToSupabase(treeData);
      if (rootNodeId) {
        const rootNode = await this.treesItems.get(rootNodeId);
        if (rootNode) {
          await syncService.saveTreeItemToSupabase(rootNode);
        }
      }
    });

    return treeId;
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

    // Sync to Supabase in background
    if (result) {
      await this.setAppPropVal("appIsDirt", true);
      syncInBackground(async (syncService) => {
        await syncService.deleteTreeFromSupabase(treeId);
      });
    }

    return result;
  }

  editTree = async (treeId: string, changes: Partial<TreeClass>) => {
    const result = await this.trees.update(treeId, changes);

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      await syncService.updateTreeInSupabase(treeId, changes);
    });

    return result;
  }

  duplicateTree = async (treeId: string) => {
    if (!await this._canAddTree()) return;

    const currentTree = await this.trees.get(treeId);
    if (!currentTree) return;

    const { treeName } = currentTree;
    const newTreeId = await this.createNewTree(`${treeName}-copy`, false, currentTree);
    if (!newTreeId) return false;

    // get all items from current tree and duplicate them
    const items = await (await this.getAllTreeItemsCollection(treeId)).toArray();
    const idsMap: Record<string, string> = {};
    const newItems: TreeItem[] = [];

    for (const item of items) {
      const newId = generateId();
      idsMap[item.id] = newId;
      const newItem = {
        ...item,
        id: newId,
        treeId: newTreeId,
        parentPath: item.parentPath // Will fix below
      };
      await this.treesItems.put(newItem);
      newItems.push(newItem);
    }

    // Fix parentPath with new ids
    const updatedItems = await (await this.getAllTreeItemsCollection(newTreeId)).toArray();
    for (const item of updatedItems) {
      if (item.parentPath) {
        const newParentPath = item.parentPath.split("/").map(id => idsMap[id] || id).join("/");
        await this.treesItems.update(item.id, { parentPath: newParentPath });
        item.parentPath = newParentPath;
      }
    }

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      for (const item of updatedItems) {
        await syncService.saveTreeItemToSupabase(item);
      }
    });

    return newTreeId;
  }

  deleteAllTrees = async () => {
    const trees = await this.trees.toArray();
    const results = await Promise.allSettled([this.trees.clear(), this.treesItems.clear()]);

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      for (const tree of trees) {
        await syncService.deleteTreeFromSupabase(tree.id!);
      }
    });

    return results.every(({ status }) => status === "fulfilled");
  }

  addRootNode = async (treeId: string, name: string) => {
    const alreadyExist = (await this.treesItems.where(INDEXES.tp).equals([treeId, ""]).count()) > 0;
    if (alreadyExist) throw new Error("Tree root node already exist");

    const nodeId = generateId();

    const nodeData = {
      id: nodeId,
      treeId,
      name,
      parentPath: "",
      selected: 0
    } as TreeItem;

    // Save to local Dexie
    await this.treesItems.put(nodeData);

    // Note: Sync is handled by createNewTree for root nodes
    return nodeId;
  }

  addChildNode = async (treeId: string, name: string, parentId: string) => {
    const parent = await this.treesItems.get(parentId);
    if (!parent) return;
    const parentPath = parent.parentPath + parentId + "/";

    const nodeId = generateId();

    const nodeData = {
      id: nodeId,
      treeId,
      name,
      parentPath,
      selected: 0
    } as TreeItem;

    // Save to local Dexie
    await this.treesItems.put(nodeData);

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      await syncService.saveTreeItemToSupabase(nodeData);
    });

    return nodeId;
  }

  editNode = async (nodeId: string, changes: Partial<TreeItem>) => {
    const result = await this.treesItems.update(nodeId, changes);

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      await syncService.updateTreeItemInSupabase(nodeId, changes);
    });

    return result;
  }

  selectNode = async (nodeId: string, status?: 1 | 0) => {
    const updatedIds: string[] = [];

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
          updatedIds.push(nodeId);
          await allDescendantsColl?.modify((item) => {
            item.selected = 1;
            updatedIds.push(item.id);
          })
        } else {
          await this.treesItems.update(nodeId, { selected: 0 });
          updatedIds.push(nodeId);
          await allDescendantsColl?.modify((item) => {
            item.selected = 0;
            updatedIds.push(item.id);
          })
        }
      } else {
        const newSelected = status ?? (selected ? 0 : 1);
        this.treesItems.update(nodeId, { selected: newSelected });
        updatedIds.push(nodeId);
      }
    });

    // Mark as dirty
    await this.setAppPropVal("appIsDirt", true);

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      for (const id of updatedIds) {
        const item = await this.treesItems.get(id);
        if (item) {
          await syncService.updateTreeItemInSupabase(id, { selected: item.selected });
        }
      }
    });
  }

  deleteNode = async (nodeId: string) => {
    const nodeToDelete = await this.treesItems.get(nodeId);
    const descendants = await (await this.getNodeDescendantsCollection(nodeId))?.toArray() || [];

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

    // Sync to Supabase in background
    if (result) {
      await this.setAppPropVal("appIsDirt", true);
      syncInBackground(async (syncService) => {
        await syncService.deleteTreeItemFromSupabase(nodeId);
        for (const desc of descendants) {
          await syncService.deleteTreeItemFromSupabase(desc.id);
        }
      });
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

  /// Trees States - synced to Supabase

  _saveTreesState = async ({ stateName, id }: { stateName?: string, id?: string }) => {
    const stateId = await this.transaction("rw", this.treesStates, this.treesItems, this.trees, async () => {
      const trees = await this.trees.toArray();
      const treesItems = await this.treesItems.toArray();
      let stateToSave: TreesStates = { trees, treesItems, stateName };
      if (id) stateToSave.id = id;
      else stateToSave.id = generateId();
      await this.treesStates.put(stateToSave);
      return stateToSave.id;
    });

    // Sync to Supabase in background
    if (stateId) {
      syncInBackground(async (syncService) => {
        const state = await this.treesStates.get(stateId);
        if (state) {
          await syncService.saveTreeStateToSupabase(state);
        }
      });
    }

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
    const id = generateId();
    return this._saveTreesState({ stateName, id });
  }

  loadTreesState = async (id: string) => {
    // Set loading flag to prevent UI flicker during state transition
    await this.setAppPropVal("loadingState", true);

    try {
      return await this.transaction("rw", this.treesStates, this.treesItems, this.trees, this.app, async () => {
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
    } finally {
      // Clear loading flag after transition completes
      await this.setAppPropVal("loadingState", false);
    }
  }

  deleteState = async (id: string) => {
    await this.transaction("rw", this.treesStates, this.treesItems, this.trees, this.app, async () => {
      await this.treesStates.delete(id);
      const newSelectedSate = await this.treesStates.toCollection().first();
      newSelectedSate?.id && await this.loadTreesState(newSelectedSate?.id);
    });

    // Sync to Supabase in background
    syncInBackground(async (syncService) => {
      await syncService.deleteTreeStateFromSupabase(id);
    });
  }
}

export const treesDB = new TreesDB();
