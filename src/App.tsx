import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { MAX_TREES, treesDB } from './models/treesDb';
import { TreeClass } from './models/Tree';
import { CategoryTree } from './components/CategoryTree/CategoryTree';
import './App.scss';

function App() {
  const trees = useLiveQuery<TreeClass[], TreeClass[]>(async () => (await treesDB.trees.toArray()), [], [])

  const addTree = useCallback(() => {
    return treesDB.createNewTree()
  }, []);

  const deleteAllTrees = useCallback(() => {
    return treesDB.deleteAllTrees()
  }, []);

  const maxAchived = useMemo(() => {
    return trees.length >= MAX_TREES;
  }, [trees])

  return (
    <div className="app-con">
      <nav>
        <h1>Tree Creator</h1>
        <div className="nav-panel">
          <div onClick={() => addTree()} title={`${maxAchived ? `Limited to ${MAX_TREES} trees. Please first delete a tree in order to be able to add another ` : 'Add a new tree'}`} className={`btn primary ${maxAchived ? 'disable' : ""}`}>Add Tree</div>
          <div onClick={() => deleteAllTrees()} className={`btn primary ${!trees?.length ? 'disable' : ""}`}>Delete All Trees</div>
        </div>
      </nav>
      <div className="trees-con">
        {trees.map(tree => <CategoryTree treeData={tree} />)}
      </div>
    </div>
  );
}

export default App;
