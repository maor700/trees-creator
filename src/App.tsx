import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import './App.scss';
import { Tree } from './components/Tree/Tree';
import { MAX_TREES, treesDB } from './models/db';
import { TreeClass } from './models/Tree';

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

  // const login = async () => {
  //   const res = await treesDB.cloud.login({ grant_type: 'demo', userId: 'foo@demo.local' })
  //   console.log(res);
  // }
  return (
    <div className="app-con">
      <nav>
        <h1>Tree Creator</h1>
        <div className="nav-panel">
          <div onClick={() => addTree()} title={`${maxAchived ? `Limited to ${MAX_TREES} trees. Please first delete a tree in order to be able to add another ` : 'Add a new tree'}`} className={`btn primary ${maxAchived ? 'disable' : ""}`}>Add Tree</div>
          <div onClick={() => deleteAllTrees()} className={`btn primary ${!trees?.length ? 'disable' : ""}`}>Delete All Trees</div>
          {/* <div onClick={login} className={`btn primary ${!trees?.length ? 'disable' : ""}`}>Login</div> */}
        </div>
      </nav>
      <div className="trees-con">
        {trees.map(tree => <Tree key={tree.id} data={tree} />)}
      </div>
    </div>
  );
}

export default App;
