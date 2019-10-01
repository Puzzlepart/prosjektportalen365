import { ProjectColumnConfig, SectionModel } from 'shared/lib/models';
import { IBaseSectionProps } from '../BaseSection';

export interface ISummarySectionProps extends IBaseSectionProps {
    /**
     * @todo describe property
     */
    sections: SectionModel[];

    /**
     * @todo describe property
     */
    columnConfig: ProjectColumnConfig[];
}
