import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
interface OwnProps {
    onBlur: (ev: Event) => void
    excludedElements?: HTMLElement[]
    shouldBlur: boolean,
    children: React.ReactNode
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
    }, [shouldBlur, onBlur, excludedElements]);

    const escapeHandler = useCallback((ev) => {
        ev?.code === "Escape" && onBlur(ev)
    }, [])

    useEffect(() => {

        if (!shouldBlur) return;

        document.addEventListener("click", clickHandler);
        document.addEventListener("keydown", escapeHandler);
        
        return () => {
            document.removeEventListener("click", clickHandler);
            document.removeEventListener("keydown", escapeHandler);
        };
    }, [shouldBlur])

    return (
        <div ref={blurredElmRef} onClick={(ev) => { ev.stopPropagation(); }} className="blurred">
           {children}
        </div>
    )
}