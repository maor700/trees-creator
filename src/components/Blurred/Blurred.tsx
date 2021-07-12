import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
interface OwnProps {
    onBlur: (ev: MouseEvent) => void
    excludedElements?: HTMLElement[]
    shouldBlur: boolean
}

export const Blurred: FC<OwnProps> = ({ children, onBlur, excludedElements, shouldBlur }) => {
    const blurredElmRef = useRef<HTMLDivElement>(null);
    const clickHandler: (ev: globalThis.MouseEvent) => void = useCallback((ev) => {
        if (!shouldBlur) return;
        const { target } = ev;

        if (!target || !blurredElmRef.current) return;

        const targrtElm: HTMLElement = target as any;
        const elements = [...(excludedElements ?? [])];

        let blur: boolean = true;
        for (let currentElm of elements) {
            blur = !currentElm.contains(targrtElm) && blur;
            if (blur === false) break;
        }
        blur && onBlur(ev);
    }, [shouldBlur]);

    useEffect(() => {

        if (!shouldBlur) return;

        document.addEventListener("click", clickHandler);
        
        return () => {
            document.removeEventListener("click", clickHandler);
        };
    }, [shouldBlur])

    return (
        <div ref={blurredElmRef} onClick={(ev) => { ev.stopPropagation(); }} className="blurred">
            {children}
        </div>
    )
}