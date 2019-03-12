import { IStatusSectionBaseProps } from "../StatusSectionBase/IStatusSectionBaseProps";
import { IStatusElementProps } from "../StatusElement/IStatusElementProps";
import SectionModel from "../SectionModel";

export interface IStatusPropertySectionProps extends IStatusSectionBaseProps {
    headerProps: IStatusElementProps;
    section?: SectionModel;
}
