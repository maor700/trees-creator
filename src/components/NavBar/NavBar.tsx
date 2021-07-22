import { useLiveQuery } from "dexie-react-hooks";
import react, { useCallback, useEffect, useMemo } from "react";
import { useObservable } from 'react-use';
import { useToggle } from "../../hooks";
import { TreeClass } from "../../models/Tree";
import { MAX_TREES, treesDB } from "../../models/treesDb";
import { TreesStates } from "../../models/TreesStates";
import { EditPanel } from "../ActionsPanel/EditPanel/EditPanel";
import { Blurred } from "../Blurred/Blurred";
import { ModalJunior } from "../ModalJunior/ModalJunior";
import { MdSave, MdDelete, MdAdd } from "react-icons/md"
import { VscSaveAs } from "react-icons/vsc";
import "./NavBar.scss";


export const NavBar = () => {
    const currentUser = useObservable(treesDB.cloud.currentUser);
    const states: TreesStates[] = useLiveQuery(async () => treesDB.treesStates.toArray(), [], []);
    const trees = useLiveQuery<TreeClass[], TreeClass[]>(async () => (await treesDB.trees.toArray()), [], [])
    const [isToggled, toggle] = useToggle(false);
    const selectedState = useLiveQuery<TreesStates>(async () => (await treesDB.getAppPropVal("selectedState")), [])

    const login = async () => {
        await treesDB.cloud.login({ grant_type: 'demo', userId: 'foo@demo.local' })
    }

    useEffect(() => {
        const ctrl_s_handler = (e: any) => {
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                treesDB.saveCurrentTree();
            }
        }

        document.addEventListener('keydown', ctrl_s_handler);

        return () => { document.removeEventListener('keydown', ctrl_s_handler) };
    }, [])

    const appIsDirt = useLiveQuery<boolean>(() => treesDB.getAppPropVal("appIsDirt"));

    const logout = async () => {
        treesDB.table("$logins").clear();
    }

    const loadTreesState = (id: string) => {
        return treesDB.loadTreesState(id)
    }

    const saveAs = useCallback(async (name: string) => {
        if (!name) return;
        toggle(null, false);
        const newStateId = await treesDB.saveNewState(name);
        if (newStateId) {
            const newState = await treesDB.treesStates.get(newStateId);
            newState && await treesDB.setAppPropVal("selectedState", newState);
        }
    }, [])

    const save = (name?: string) => treesDB.saveCurrentTree(name);

    const onSelectChanched = useCallback(({ target }) => {
        loadTreesState(target.value)
    }, [])

    const addTree = useCallback(() => {
        return treesDB.createNewTree()
    }, []);

    const deleteDocument = useCallback(async () => {
        if (!selectedState?.id) return;
        await treesDB.deleteState(selectedState.id)
    }, [selectedState]);

    const maxAchived = useMemo(() => {
        return trees.length >= MAX_TREES;
    }, [trees])

    return (
        <nav>
            <h1>Tree Creator</h1>
            <div className="document">
                <Blurred onBlur={(ev) => toggle(ev, false)} shouldBlur={isToggled}>
                    <ModalJunior show={isToggled}>
                        <EditPanel placeholder="Name of document" value={selectedState?.stateName ? selectedState?.stateName + "-copy" : ""} onSubmit={saveAs} onCancel={() => toggle(null, false)} />
                    </ModalJunior>
                </Blurred>
                <select value={selectedState?.id} name="document-select" id="document-select" className="btn primary" onChange={onSelectChanched}>
                    {states.map(_ => (
                        <option className={`${selectedState?.id === _.id ? "selcted" : ""}`} key={_.id} value={_.id}>{_.stateName}</option>
                    ))}
                </select>
                {appIsDirt && <div title="save document (ctrl+S)" onClick={() => save()} className={`btn primary`}>{<MdSave size="1.2em" />}</div>}
                <div onClick={toggle} title="Save as" className={`btn primary`}><VscSaveAs size="1.2em" /></div>
                <div onClick={addTree} title={`${maxAchived ? `Limited to ${MAX_TREES} trees. Please first delete a tree in order to be able to add another ` : 'Add a new tree'}`} className={`btn primary ${maxAchived ? 'disable' : ""}`}>{<MdAdd size="1.2em" />}</div>
                <div onClick={deleteDocument} title={`Delete Document ${selectedState?.stateName}`} className={`btn primary`}>{<MdDelete size="1.2em" />}</div>
            </div>
            <div className="nav-panel">
                {currentUser?.isLoggedIn ?
                    <div title={` Signed in as: ${currentUser.name}`} className="loggedIn">
                        <div onClick={logout} className={`btn primary`}>Logout</div>
                    </div>
                    : <div onClick={login} className={`btn primary`}>Login</div>
                }
            </div>
        </nav>
    )
}