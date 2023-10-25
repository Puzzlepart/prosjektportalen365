import { createContext, useContext } from "react";
import { ICustomEditPanelProps } from "./types";
import { UseModelReturnType } from "./useModel";
import { EditableSPField } from "../../models";

export interface ICustomEditPanelContext {
    model: UseModelReturnType
    fields: EditableSPField[]
    getFieldElement: (field: EditableSPField) => JSX.Element
    props: ICustomEditPanelProps
}

export const CustomEditPanelContext = createContext<ICustomEditPanelContext>(null)

export const useCustomEditPanelContext = () => useContext(CustomEditPanelContext)