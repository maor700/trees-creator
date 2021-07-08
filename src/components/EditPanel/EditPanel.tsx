import { FC, KeyboardEventHandler, useState } from "react"
import { MdCheck, MdClose } from "react-icons/md";
import "./EditPanel.scss";

interface OwnProps {
    value: string, onSubmit: (value: string) => void,
    onCancel: () => void
}
export const EditPanel: FC<OwnProps> = ({ value, onSubmit, onCancel }) => {
    const [inputVal, setInputVal] = useState(value);

    const keyDownHandler: KeyboardEventHandler<HTMLInputElement> = ({ code }) => {
        code === 'Enter' && onSubmit(inputVal);
    }

    const onCheckMarkClickHandler = () => { onSubmit(inputVal) }
    const onCloseClickHandler = () => { onCancel() }

    return (
        <div className="edit-panel">
            <input className="edit-name-input" type="text" value={inputVal}
                onKeyDown={keyDownHandler}
                onChange={({ target }) => { setInputVal(target.value) }} />
            <button title="אישור" className="btn" onClick={onCheckMarkClickHandler}>
                <MdCheck />
            </button>
            <button title="ביטול"  className="btn" onClick={onCloseClickHandler}>
                <MdClose />
            </button>
        </div>
    )
}