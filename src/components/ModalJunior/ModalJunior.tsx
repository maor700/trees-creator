import { FC } from "react";
import "./ModalJunior.scss";

export const ModalJunior: FC<{ show: boolean }> = ({ show, children }) => {
    return (
        <>
            {show && <div className="modal-junior" onClick={(ev) => ev.stopPropagation()}>
                {children}
            </div>}
        </>
    )
}