import { supabase } from '../lib/supabase';
import { TreeClass } from '../models/Tree';
import { TreeItem } from '../models/TreeItem';

interface SupabaseTree {
  id: string;
  user_id: string;
  tree_name: string;
  rtl?: boolean;
  light_mode?: boolean;
  multi_select?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface SupabaseTreeItem {
  id: string;
  tree_id: string;
  user_id: string;
  name: string;
  parent_path: string;
  data?: Record<string, unknown>;
  selected: 0 | 1;
  created_at?: string;
  updated_at?: string;
}

// Lazy load treesDB to avoid circular dependency
let _treesDB: any = null;
const getTreesDB = async () => {
  if (!_treesDB) {
    const module = await import('../models/treesDb');
    _treesDB = module.treesDB;
  }
  return _treesDB;
};

class SyncService {
  private currentUserId: string | null = null;

  async loadFromSupabase(userId: string) {
    this.currentUserId = userId;

    try {
      const treesDB = await getTreesDB();

      // Clear local data first
      await treesDB.trees.clear();
      await treesDB.treesItems.clear();

      // Load trees from Supabase
      const { data: trees, error: treesError } = await supabase
        .from('trees')
        .select('*')
        .eq('user_id', userId);

      if (treesError) {
        console.error('Error loading trees:', treesError);
        return;
      }

      // Load tree items from Supabase
      const { data: treeItems, error: itemsError } = await supabase
        .from('tree_items')
        .select('*')
        .eq('user_id', userId);

      if (itemsError) {
        console.error('Error loading tree items:', itemsError);
        return;
      }

      // Convert and store in Dexie
      if (trees && trees.length > 0) {
        const localTrees: TreeClass[] = trees.map((t: SupabaseTree) => ({
          id: t.id,
          treeName: t.tree_name,
          rtl: t.rtl,
          lightMode: t.light_mode,
          multiSelect: t.multi_select,
        }));

        await treesDB.trees.bulkPut(localTrees);
      }

      if (treeItems && treeItems.length > 0) {
        const localItems: TreeItem[] = treeItems.map((item: SupabaseTreeItem) => ({
          id: item.id,
          treeId: item.tree_id,
          name: item.name,
          parentPath: item.parent_path || '',
          selected: (item.selected || 0) as 0 | 1,
          data: item.data,
        }));

        await treesDB.treesItems.bulkPut(localItems);
      }

      console.log(`Loaded ${trees?.length || 0} trees and ${treeItems?.length || 0} items from Supabase`);
    } catch (error) {
      console.error('Error syncing from Supabase:', error);
    }
  }

  async clearLocalData() {
    try {
      const treesDB = await getTreesDB();
      await treesDB.trees.clear();
      await treesDB.treesItems.clear();
    } catch (error) {
      console.error('Error clearing local data:', error);
    }
  }

  async saveTreeToSupabase(tree: TreeClass) {
    if (!this.currentUserId) {
      console.error('No user logged in');
      return null;
    }

    const supabaseTree: Partial<SupabaseTree> = {
      id: tree.id, // Use existing ID from local
      user_id: this.currentUserId,
      tree_name: tree.treeName || 'Untitled',
      rtl: tree.rtl,
      light_mode: tree.lightMode,
      multi_select: tree.multiSelect,
    };

    const { data, error } = await supabase
      .from('trees')
      .upsert(supabaseTree) // Use upsert to handle both insert and update
      .select()
      .single();

    if (error) {
      console.error('Error saving tree to Supabase:', error);
      return null;
    }

    return data;
  }

  async updateTreeInSupabase(treeId: string, changes: Partial<TreeClass>) {
    const supabaseChanges: Partial<SupabaseTree> = {};

    if (changes.treeName !== undefined) supabaseChanges.tree_name = changes.treeName;
    if (changes.rtl !== undefined) supabaseChanges.rtl = changes.rtl;
    if (changes.lightMode !== undefined) supabaseChanges.light_mode = changes.lightMode;
    if (changes.multiSelect !== undefined) supabaseChanges.multi_select = changes.multiSelect;

    const { error } = await supabase
      .from('trees')
      .update(supabaseChanges)
      .eq('id', treeId);

    if (error) {
      console.error('Error updating tree in Supabase:', error);
    }
  }

  async deleteTreeFromSupabase(treeId: string) {
    // Delete tree items first
    await supabase
      .from('tree_items')
      .delete()
      .eq('tree_id', treeId);

    // Then delete the tree
    const { error } = await supabase
      .from('trees')
      .delete()
      .eq('id', treeId);

    if (error) {
      console.error('Error deleting tree from Supabase:', error);
    }
  }

  async saveTreeItemToSupabase(item: TreeItem) {
    if (!this.currentUserId) {
      console.error('No user logged in');
      return null;
    }

    const supabaseItem: Partial<SupabaseTreeItem> = {
      id: item.id, // Use existing ID from local
      tree_id: item.treeId,
      user_id: this.currentUserId,
      name: item.name,
      parent_path: item.parentPath || '',
      selected: item.selected || 0,
    };

    const { data, error } = await supabase
      .from('tree_items')
      .upsert(supabaseItem) // Use upsert to handle both insert and update
      .select()
      .single();

    if (error) {
      console.error('Error saving tree item to Supabase:', error);
      return null;
    }

    return data;
  }

  async updateTreeItemInSupabase(itemId: string, changes: Partial<TreeItem>) {
    const supabaseChanges: Partial<SupabaseTreeItem> = {};

    if (changes.name !== undefined) supabaseChanges.name = changes.name;
    if (changes.parentPath !== undefined) supabaseChanges.parent_path = changes.parentPath;
    if (changes.selected !== undefined) supabaseChanges.selected = changes.selected;

    const { error } = await supabase
      .from('tree_items')
      .update(supabaseChanges)
      .eq('id', itemId);

    if (error) {
      console.error('Error updating tree item in Supabase:', error);
    }
  }

  async deleteTreeItemFromSupabase(itemId: string) {
    const { error } = await supabase
      .from('tree_items')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting tree item from Supabase:', error);
    }
  }

  getCurrentUserId() {
    return this.currentUserId;
  }

  setCurrentUserId(userId: string | null) {
    this.currentUserId = userId;
  }
}

export const syncService = new SyncService();
