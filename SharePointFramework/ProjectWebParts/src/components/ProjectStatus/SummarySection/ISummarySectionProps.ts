import { IStatusSectionBaseProps } from '../@StatusSectionBase/IStatusSectionBaseProps';
import { SectionModel } from 'models';

export interface ISummarySectionProps extends IStatusSectionBaseProps {
    entity: any;
    sections: SectionModel[];
}
