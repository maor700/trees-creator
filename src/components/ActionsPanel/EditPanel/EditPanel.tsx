import { FC, KeyboardEventHandler, useCallback, useEffect, useRef, useState } from "react"
import { MdCheck, MdClose } from "react-icons/md";
import "./EditPanel.scss";

interface OwnProps {
    placeholder?: string;
    value: string, onSubmit: (value: string) => void,
    onCancel: () => void
}
export const EditPanel: FC<OwnProps> = ({ value, onSubmit, onCancel, placeholder }) => {
    const [inputVal, setInputVal] = useState(value);
    const inputElmentRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputElmentRef?.current?.select();
    }, [])

    const keyDownHandler: KeyboardEventHandler<HTMLInputElement> = useCallback((ev) => {
        const { code } = ev;
        ev.stopPropagation();
        if (code === 'Enter') { onSubmit(inputVal); }
        if (code === 'Escape') { onCancel(); }
    }, [inputVal])

    const onCheckMarkClickHandler = () => { onSubmit(inputVal) };
    const changeHandler = ({ target }:any) => { setInputVal(target.value) }
    
    return (
        <div className="edit-panel">
            <input ref={inputElmentRef}
                placeholder={placeholder}
                className="edit-name-input"
                type="text" value={inputVal}
                onKeyDown={keyDownHandler}
                onChange={changeHandler} />
            <button title="Submit" className="btn" onClick={onCheckMarkClickHandler}>
                <MdCheck />
            </button>
            <button title="Cancel" className="btn" onClick={onCancel}>
                <MdClose />
            </button>
        </div>
    )
}