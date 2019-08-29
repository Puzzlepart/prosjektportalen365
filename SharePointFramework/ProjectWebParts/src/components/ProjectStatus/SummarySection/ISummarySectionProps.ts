import { IStatusSectionBaseProps } from '../@StatusSectionBase/IStatusSectionBaseProps';
import { SectionModel } from 'models';
import { ProjectColumnConfig } from 'shared/lib/models';

export interface ISummarySectionProps extends IStatusSectionBaseProps {
    /**
     * @todo describe property
     */
    entity: any;

    /**
     * @todo describe property
     */
    sections: SectionModel[];
    
    /**
     * @todo describe property
     */
    columnConfig: ProjectColumnConfig[];
}
