import { FC, useMemo } from "react";
import { ActionPanelProps, ORIGINS } from "../Tree";
import { RowActionsPanel } from "./RowActionsPanel";
import { TreeActionsPanel } from "./TreeActionsPanel";

export const ActionsPanel: FC<ActionPanelProps> = (props) => {
    const actionPanel = useMemo(() => {
        const { origin } = props;
        let comp = null
        switch (origin) {
            case ORIGINS.TREE_HEADER:
                comp = <TreeActionsPanel {...props} />
                break;
            case ORIGINS.TREE_NODE:
                comp = <RowActionsPanel {...props} />
                break;
        }
        return comp;
    }, [props])
    return actionPanel
}