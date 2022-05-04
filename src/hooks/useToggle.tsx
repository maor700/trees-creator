import { useCallback, useState } from "react";

export const useToggle = (init = false):[boolean, (ev: any|null, force?: boolean | undefined) => void] => {
    const [isToggled, setIsToggle] = useState(init);
    const toggle = useCallback((ev: React.MouseEvent<HTMLElement>|null, force?: boolean) => {
        ev?.stopPropagation?.();
        setIsToggle(force ?? !isToggled);
    }, [isToggled]);

    return [isToggled, toggle]
}
