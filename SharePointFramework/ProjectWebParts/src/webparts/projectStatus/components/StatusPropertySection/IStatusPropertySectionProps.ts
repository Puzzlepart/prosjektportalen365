import { IStatusSectionBaseProps } from "../StatusSectionBase/IStatusSectionBaseProps";
import { IStatusElementProps } from "../StatusElement/IStatusElementProps";

export interface IStatusPropertySectionProps extends IStatusSectionBaseProps {
    headerProps: IStatusElementProps;
}