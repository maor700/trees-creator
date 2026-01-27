import { useLiveQuery } from 'dexie-react-hooks';
import { treesDB } from './models/treesDb';
import { TreeClass } from './models/Tree';
import { CategoryTree } from './components/CategoryTree/CategoryTree';
import { NavBar } from './components/NavBar/NavBar';
import { useAuth } from './contexts/AuthContext';
import React, { useEffect } from 'react';
import { syncService } from './services/syncService';
import './App.scss';

function App() {
  const { user, loading } = useAuth();

  const trees = useLiveQuery<TreeClass[], TreeClass[]>(
    () => treesDB.trees.toArray(),
    [],
    []
  );

  // Sync with Supabase when user changes
  useEffect(() => {
    if (user) {
      // User logged in - load their data from Supabase
      syncService.loadFromSupabase(user.id);
    } else if (!loading) {
      // User logged out - clear local data
      syncService.clearLocalData();
    }
  }, [user, loading]);

  if (loading) {
    return (
      <div className="app-con">
        <NavBar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="app-con">
      <NavBar />
      <div className="trees-con">
        {!user ? (
          <div className="login-prompt">
            <h2>Welcome to Trees Creator</h2>
            <p>Please login to view and manage your trees.</p>
          </div>
        ) : (
          (trees ?? []).map(tree => <CategoryTree key={tree.id} treeData={tree} />)
        )}
      </div>
    </div>
  );
}

export default App;
