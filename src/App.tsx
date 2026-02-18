import { useLiveQuery } from 'dexie-react-hooks';
import { treesDB } from './models/treesDb';
import { TreeClass } from './models/Tree';
import { CategoryTree } from './components/CategoryTree/CategoryTree';
import { StatusView } from './components/StatusView/StatusView';
import { ForTodaySection } from './components/ForTodaySection/ForTodaySection';
import { NavBar } from './components/NavBar/NavBar';
import { useAuth } from './contexts/AuthContext';
import { DndProvider } from './contexts/DndContext';
import React from 'react';
import './App.scss';

function App() {
  const { user, loading } = useAuth();

  const trees = useLiveQuery<TreeClass[], TreeClass[]>(
    () => treesDB.trees.toArray(),
    [],
    []
  );

  const viewMode = useLiveQuery<'tree' | 'status'>(
    () => treesDB.getAppPropVal('viewMode'),
    [],
    'tree'
  );

  const isRtl = useLiveQuery<boolean>(
    () => treesDB.getAppPropVal('isRtl'),
    [],
    false
  );

  // Dexie Cloud handles sync automatically - no manual sync needed!

  if (loading) {
    return (
      <div className={`app-con ${isRtl ? 'rtl' : ''}`}>
        <NavBar />
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <DndProvider>
      <div className={`app-con ${isRtl ? 'rtl' : ''}`}>
        <NavBar />
        <div className="trees-con">
          {!user ? (
            <div className="login-prompt">
              <h2>Welcome to DueTo</h2>
              <p>Please login to view and manage your tasks.</p>
            </div>
          ) : (
            <>
              <ForTodaySection />
              {viewMode === 'status' ? (
                <StatusView trees={trees ?? []} />
              ) : (
                (trees ?? []).map(tree => <CategoryTree key={tree.id} treeData={tree} />)
              )}
            </>
          )}
        </div>
      </div>
    </DndProvider>
  );
}

export default App;
