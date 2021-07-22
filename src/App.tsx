import { useLiveQuery } from 'dexie-react-hooks';
import { treesDB } from './models/treesDb';
import { TreeClass } from './models/Tree';
import { CategoryTree } from './components/CategoryTree/CategoryTree';
import { NavBar } from './components/NavBar/NavBar';
import React from 'react';
import './App.scss';

function App() {
  const trees = useLiveQuery<TreeClass[], TreeClass[]>(async () => (await treesDB.trees.toArray()), [], [])
  
  return (
    <div className="app-con">
      <NavBar />
      <div className="trees-con">
        {trees.map(tree => <CategoryTree key={tree.id} treeData={tree} />)}
      </div>
    </div>
  );
}

export default App;