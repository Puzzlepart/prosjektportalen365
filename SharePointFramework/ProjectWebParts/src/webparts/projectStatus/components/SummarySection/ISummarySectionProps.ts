import { IStatusSectionBaseProps } from "../@StatusSectionBase/IStatusSectionBaseProps";
import SectionModel from "../../models/SectionModel";

export interface ISummarySectionProps extends IStatusSectionBaseProps {
    entity: any;
    sections: SectionModel[];
}
