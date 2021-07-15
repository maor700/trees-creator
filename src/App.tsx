import { useLiveQuery } from 'dexie-react-hooks';
import { useCallback, useMemo } from 'react';
import { MAX_TREES, treesDB } from './models/treesDb';
import { TreeClass } from './models/Tree';
import { CategoryTree } from './components/CategoryTree/CategoryTree';
import { useObservable } from 'react-use';
import './App.scss';

function App() {
  const trees = useLiveQuery<TreeClass[], TreeClass[]>(async () => (await treesDB.trees.toArray()), [], [])
  const currentUser = useObservable(treesDB.cloud.currentUser);
  const addTree = useCallback(() => {
    return treesDB.createNewTree()
  }, []);

  const deleteAllTrees = useCallback(() => {
    return treesDB.deleteAllTrees()
  }, []);

  const maxAchived = useMemo(() => {
    return trees.length >= MAX_TREES;
  }, [trees])

  const login = async () => {
    const res = await treesDB.cloud.login({ grant_type: 'demo', userId: 'foo@demo.local' })
    console.log(res);
  }

  return (
    <div className="app-con">
      <nav>
        <h1>Tree Creator</h1>
        <div className="nav-panel">
          {currentUser?.isLoggedIn ?
            <div className="loggedIn">
              Signed in as: <a>{currentUser.name}</a>
            </div>
            : <div onClick={login} className={`btn primary`}>Login</div>
          }
          <div onClick={() => addTree()} title={`${maxAchived ? `Limited to ${MAX_TREES} trees. Please first delete a tree in order to be able to add another ` : 'Add a new tree'}`} className={`btn primary ${maxAchived ? 'disable' : ""}`}>Add Tree</div>
          <div onClick={() => deleteAllTrees()} className={`btn primary ${!trees?.length ? 'disable' : ""}`}>Delete All Trees</div>
        </div>
      </nav>
      <div className="trees-con">
        {trees.map(tree => <CategoryTree key={tree.id} treeData={tree} />)}
      </div>
    </div>
  );
}

export default App;