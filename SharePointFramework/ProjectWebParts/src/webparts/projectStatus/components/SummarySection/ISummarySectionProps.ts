import { IStatusSectionBaseProps } from "../StatusSectionBase/IStatusSectionBaseProps";
import SectionModel from "../SectionModel";

export interface ISummarySectionProps extends IStatusSectionBaseProps {
    entity: any;
    sections: SectionModel[];
}
