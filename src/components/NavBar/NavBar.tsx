import { useLiveQuery } from "dexie-react-hooks";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { useToggle } from "../../hooks";
import { TreeClass } from "../../models/Tree";
import { MAX_TREES, treesDB } from "../../models/treesDb";
import { TreesStates } from "../../models/TreesStates";
import { EditPanel } from "../ActionsPanel/EditPanel/EditPanel";
import { Blurred } from "../Blurred/Blurred";
import { ModalJunior } from "../ModalJunior/ModalJunior";
import { MdSave, MdDelete, MdAdd, MdMenu, MdClose } from "react-icons/md"
import { VscSaveAs } from "react-icons/vsc";
import { BsListNested, BsKanban, BsGearFill } from "react-icons/bs";
import { SettingsModal } from "../SettingsModal/SettingsModal";
import { useAuth } from "../../contexts/AuthContext";
import logoSrc from "../../assets/logo.svg";
import "./NavBar.scss";


export const NavBar = () => {
    const { user, login, logout } = useAuth();
    const states: TreesStates[] = useLiveQuery(async () => treesDB.treesStates.toArray(), [], []);
    const trees = useLiveQuery<TreeClass[], TreeClass[]>(async () => (await treesDB.trees.toArray()), [], [])
    const [isToggled, toggle] = useToggle(false);
    const saveAsBtnRef = useRef<HTMLDivElement>(null);
    const selectedState = useLiveQuery<TreesStates>(async () => (await treesDB.getAppPropVal("selectedState")), [])
    const viewMode = useLiveQuery<'tree' | 'status'>(() => treesDB.getAppPropVal('viewMode'), [], 'tree');
    const [showSettings, toggleSettings] = useToggle(false);
    const [showMenu, toggleMenu] = useToggle(false);
    const menuBtnRef = useRef<HTMLDivElement>(null);

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
        return (trees?.length ?? 0) >= MAX_TREES;
    }, [trees])

    return (
        <nav>
            <div className="brand">
                <img src={logoSrc} alt="DueTo Logo" className="logo" />
                <h1>DueTo</h1>
            </div>

            {/* Document buttons - hidden on mobile */}
            <div className="document">
                <div className="view-toggle">
                    <div
                        className={`btn primary ${viewMode === 'tree' ? 'active' : ''}`}
                        onClick={() => treesDB.setAppPropVal('viewMode', 'tree')}
                        title="Tree View"
                    >
                        <BsListNested />
                    </div>
                    <div
                        className={`btn primary ${viewMode === 'status' ? 'active' : ''}`}
                        onClick={() => treesDB.setAppPropVal('viewMode', 'status')}
                        title="Status View"
                    >
                        <BsKanban />
                    </div>
                </div>
                <Blurred onBlur={(ev) => toggle(ev, false)} shouldBlur={isToggled} excludedElements={saveAsBtnRef.current ? [saveAsBtnRef.current] : []}>
                    <ModalJunior show={isToggled}>
                        <EditPanel placeholder="Name of document" value={selectedState?.stateName ? selectedState?.stateName + "-copy" : ""} onSubmit={saveAs} onCancel={() => toggle(null, false)} />
                    </ModalJunior>
                </Blurred>
                <select value={selectedState?.id} name="document-select" id="document-select" className="btn primary" onChange={onSelectChanched}>
                    {(states ?? []).map(_ => (
                        <option className={`${selectedState?.id === _.id ? "selcted" : ""}`} key={_.id} value={_.id}>{_.stateName}</option>
                    ))}
                </select>
                <div title="save document (ctrl+S)" onClick={() => appIsDirt && save()} className={`btn primary ${!appIsDirt ? 'disable' : ''}`}><MdSave size="1.2em" /></div>
                <div ref={saveAsBtnRef} onClick={toggle} title="Save as" className={`btn primary`}><VscSaveAs size="1.2em" /></div>
                <div onClick={addTree} title={`${maxAchived ? `Limited to ${MAX_TREES} trees. Please first delete a tree in order to be able to add another ` : 'Add a new tree'}`} className={`btn primary ${maxAchived ? 'disable' : ""}`}>{<MdAdd size="1.2em" />}</div>
                <div onClick={deleteDocument} title={selectedState?.stateName ? `Delete Document ${selectedState.stateName}` : 'No document selected'} className={`btn primary ${!selectedState?.id ? 'disable' : ''}`}>{<MdDelete size="1.2em" />}</div>
            </div>

            {/* Nav panel - hidden on mobile */}
            <div className="nav-panel">
                <div
                    className="btn primary"
                    onClick={toggleSettings}
                    title="Settings"
                >
                    <BsGearFill />
                </div>
                {user ?
                    <div title={`Signed in as: ${user.email}`} className="loggedIn">
                        <div onClick={logout} className={`btn primary`}>Logout</div>
                    </div>
                    : <div onClick={login} className={`btn primary`}>Login</div>
                }
            </div>

            {/* Mobile Hamburger */}
            <div className="mobile-nav">
                <div
                    ref={menuBtnRef}
                    className="btn primary hamburger-btn"
                    onClick={toggleMenu}
                    title="Menu"
                >
                    {showMenu ? <MdClose size="1.4em" /> : <MdMenu size="1.4em" />}
                </div>
                <Blurred onBlur={() => toggleMenu(null, false)} shouldBlur={showMenu} excludedElements={menuBtnRef.current ? [menuBtnRef.current] : []}>
                    <div className={`hamburger-menu ${showMenu ? 'open' : ''}`}>
                        {/* View Toggle */}
                        <div className="menu-section">
                            <div className="menu-section-title">View</div>
                            <div className="menu-row">
                                <div
                                    className={`btn primary ${viewMode === 'tree' ? 'active' : ''}`}
                                    onClick={() => treesDB.setAppPropVal('viewMode', 'tree')}
                                    title="Tree View"
                                >
                                    <BsListNested />
                                    <span>Tree</span>
                                </div>
                                <div
                                    className={`btn primary ${viewMode === 'status' ? 'active' : ''}`}
                                    onClick={() => treesDB.setAppPropVal('viewMode', 'status')}
                                    title="Status View"
                                >
                                    <BsKanban />
                                    <span>Status</span>
                                </div>
                            </div>
                        </div>

                        {/* Document */}
                        <div className="menu-section">
                            <div className="menu-section-title">Document</div>
                            <select value={selectedState?.id} name="document-select-mobile" id="document-select-mobile" className="btn primary menu-select" onChange={onSelectChanched}>
                                {(states ?? []).map(_ => (
                                    <option className={`${selectedState?.id === _.id ? "selcted" : ""}`} key={_.id} value={_.id}>{_.stateName}</option>
                                ))}
                            </select>
                            <div className="menu-row">
                                <div title="Save (ctrl+S)" onClick={() => { appIsDirt && save(); }} className={`btn primary ${!appIsDirt ? 'disable' : ''}`}>
                                    <MdSave size="1.2em" />
                                    <span>Save</span>
                                </div>
                                <div onClick={toggle} title="Save as" className="btn primary">
                                    <VscSaveAs size="1.2em" />
                                    <span>Save As</span>
                                </div>
                                <div onClick={deleteDocument} title={selectedState?.stateName ? `Delete ${selectedState.stateName}` : 'No document'} className={`btn primary ${!selectedState?.id ? 'disable' : ''}`}>
                                    <MdDelete size="1.2em" />
                                    <span>Delete</span>
                                </div>
                            </div>
                        </div>

                        {/* Trees */}
                        <div className="menu-section">
                            <div className="menu-section-title">Trees</div>
                            <div className="menu-row">
                                <div onClick={addTree} title={maxAchived ? `Limited to ${MAX_TREES} trees` : 'Add a new tree'} className={`btn primary ${maxAchived ? 'disable' : ""}`}>
                                    <MdAdd size="1.2em" />
                                    <span>Add Tree</span>
                                </div>
                            </div>
                        </div>

                        {/* Settings & Account */}
                        <div className="menu-section">
                            <div className="menu-section-title">Settings & Account</div>
                            <div className="menu-row">
                                <div className="btn primary" onClick={() => { toggleSettings(); toggleMenu(null, false); }} title="Settings">
                                    <BsGearFill />
                                    <span>Settings</span>
                                </div>
                                {user ?
                                    <div onClick={logout} className="btn primary" title={`Signed in as: ${user.email}`}>
                                        <span>Logout</span>
                                    </div>
                                    : <div onClick={login} className="btn primary">
                                        <span>Login</span>
                                    </div>
                                }
                            </div>
                        </div>
                    </div>
                </Blurred>
                <Blurred onBlur={(ev) => toggle(ev, false)} shouldBlur={isToggled} excludedElements={[]}>
                    <ModalJunior show={isToggled}>
                        <EditPanel placeholder="Name of document" value={selectedState?.stateName ? selectedState?.stateName + "-copy" : ""} onSubmit={saveAs} onCancel={() => toggle(null, false)} />
                    </ModalJunior>
                </Blurred>
            </div>

            {showSettings && <SettingsModal onClose={() => toggleSettings(null, false)} />}
        </nav>
    )
}
